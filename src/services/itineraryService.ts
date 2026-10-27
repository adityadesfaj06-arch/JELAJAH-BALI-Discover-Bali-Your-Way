import { Destination, TripPlan, TripStop } from '../types';
import { BALI_DESTINATIONS } from '../data/baliCatalog';
import { calculateTripCosts } from './pricingService';

export function calculateHaversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      sinDLng *
      sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  // Multiply straight-line distance by 1.38 road winding factor for Bali topography
  return Number((R * c * 1.38).toFixed(1));
}

export function estimateTravelMinutes(distanceKm: number, crossesIsland: boolean): number {
  // Average Bali road speed ~30 km/h (2 min per km), plus 45m harbor/boat buffer if crossing to Nusa islands
  const roadMinutes = Math.max(10, Math.round(distanceKm * 2.1));
  return crossesIsland ? roadMinutes + 55 : roadMinutes;
}

export function optimizeStopOrder(
  originCoords: { lat: number; lng: number },
  destinations: Destination[]
): Destination[] {
  if (destinations.length <= 1) return [...destinations];

  // Separate mainland vs island destinations so route never zigzags back and forth across the sea
  const mainland = destinations.filter((d) => d.subIsland === 'Mainland Bali' || d.subIsland === 'Pulau Serangan');
  const islands = destinations.filter((d) => d.subIsland !== 'Mainland Bali' && d.subIsland !== 'Pulau Serangan');

  function greedySort(start: { lat: number; lng: number }, pool: Destination[]): Destination[] {
    const remaining = [...pool];
    const ordered: Destination[] = [];
    let current = start;

    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = calculateHaversineKm(current, remaining[i].coordinates);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      ordered.push(next);
      current = next.coordinates;
    }
    return ordered;
  }

  const sortedMainland = greedySort(originCoords, mainland);
  const lastCoord =
    sortedMainland.length > 0
      ? sortedMainland[sortedMainland.length - 1].coordinates
      : originCoords;
  const sortedIslands = greedySort(lastCoord, islands);

  return [...sortedMainland, ...sortedIslands];
}

function formatClock(totalMinutesFromMidnight: number): string {
  const normalized = ((totalMinutesFromMidnight % 1440) + 1440) % 1440;
  const hh = String(Math.floor(normalized / 60)).padStart(2, '0');
  const mm = String(normalized % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function buildTripStops(
  originCoords: { lat: number; lng: number },
  destinations: Destination[],
  days: number,
  departureTime: string,
  pace: 'relaxed' | 'balanced' | 'packed'
): {
  stops: TripStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  warningsId: string[];
  warningsEn: string[];
} {
  const safeDays = Math.max(1, days);
  const maxStopsPerDay = pace === 'relaxed' ? 2 : pace === 'balanced' ? 3 : 4;
  const [depH, depM] = (departureTime || '08:00').split(':').map((n) => parseInt(n, 10) || 0);
  const startClockMin = depH * 60 + depM;

  const stops: TripStop[] = [];
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  const warningsId: string[] = [];
  const warningsEn: string[] = [];

  for (let i = 0; i < destinations.length; i++) {
    const dest = destinations[i];
    const dayNumber = Math.min(safeDays, Math.floor(i / maxStopsPerDay) + 1);
    const isFirstOfDay = i === 0 || Math.min(safeDays, Math.floor((i - 1) / maxStopsPerDay) + 1) !== dayNumber;

    const prevCoords = isFirstOfDay ? originCoords : destinations[i - 1].coordinates;
    const prevIsland = isFirstOfDay ? 'Mainland Bali' : destinations[i - 1].subIsland;
    const crossesIsland = prevIsland !== dest.subIsland;

    const distKm = calculateHaversineKm(prevCoords, dest.coordinates);
    const travelMin = estimateTravelMinutes(distKm, crossesIsland);

    let prevDepartureMin = startClockMin;
    if (!isFirstOfDay && stops.length > 0) {
      const prevDepParts = stops[stops.length - 1].plannedDeparture.split(':').map(Number);
      prevDepartureMin = prevDepParts[0] * 60 + prevDepParts[1];
    }

    const arrivalMin = prevDepartureMin + travelMin;
    const stayMin = dest.recommendedDurationMinutes;
    const departureMin = arrivalMin + stayMin;

    totalDistanceKm = Number((totalDistanceKm + distKm).toFixed(1));
    totalDurationMinutes += travelMin + stayMin;

    if (crossesIsland) {
      warningsId.push(
        `Hari ${dayNumber}: Perpindahan lintas pulau menuju ${dest.nameId} memerlukan kapal cepat dari Pelabuhan Sanur/Padangbai.`
      );
      warningsEn.push(
        `Day ${dayNumber}: Crossing to ${dest.nameEn} requires a scheduled fast boat from Sanur or Padangbai Harbor.`
      );
    }

    stops.push({
      destinationId: dest.id,
      dayNumber,
      order: i + 1,
      plannedArrival: formatClock(arrivalMin),
      plannedDeparture: formatClock(departureMin),
      travelMinutesFromPrev: travelMin,
      distanceKmFromPrev: distKm,
      notes: `${dest.area}, ${dest.regency}`,
      weatherRainFallbackId:
        dest.regency === 'Badung' || dest.regency === 'Denpasar'
          ? 'Alternatif saat hujan: Museum Bali Denpasar, Museum Pasifika Nusa Dua, atau Spa Tradisional.'
          : 'Alternatif saat hujan: Galeri Seni Ubud, Workshop Perak Celuk, atau Kafe Panorama Kaldera.',
      weatherRainFallbackEn:
        dest.regency === 'Badung' || dest.regency === 'Denpasar'
          ? 'Rainy weather alternative: Bali Museum Denpasar, Museum Pasifika Nusa Dua, or Traditional Balinese Spa.'
          : 'Rainy weather alternative: Ubud Art Galleries, Celuk Silver Workshop, or Indoor Caldera Coffee Lounge.',
    });
  }

  return {
    stops,
    totalDistanceKm,
    totalDurationMinutes,
    warningsId,
    warningsEn,
  };
}

export interface TripTemplate {
  id: string;
  titleId: string;
  titleEn: string;
  days: number;
  pace: 'relaxed' | 'balanced' | 'packed';
  vehicleId: string;
  originName: string;
  originCoords: { lat: number; lng: number };
  stopIds: string[];
  summaryId: string;
  summaryEn: string;
}

export const TRIP_TEMPLATES: TripTemplate[] = [
  {
    id: 'tpl-1d-highlights',
    titleId: '1 Hari: One Day Bali Highlights (Ubud & Kintamani)',
    titleEn: '1 Day: One Day Bali Highlights (Ubud & Kintamani)',
    days: 1,
    pace: 'balanced',
    vehicleId: 'car-with-driver-avanza',
    originName: 'Kuta / Seminyak / Denpasar',
    originCoords: { lat: -8.6913, lng: 115.1686 },
    stopIds: ['sacred-monkey-forest-ubud', 'tegallalang-rice-terraces', 'pura-tirta-empul', 'gunung-danau-batur-kintamani'],
    summaryId: 'Rute klasik searah dari Ubud menuju terasering Ceking, Pura Tirta Empul, dan makan siang menghadap Kaldera Gunung Batur.',
    summaryEn: 'Directional classic route from Ubud Monkey Forest to Tegallalang terraces, Tirta Empul holy spring, and Mount Batur caldera.',
  },
  {
    id: 'tpl-2d-culture-nature',
    titleId: '2 Hari: Bali Culture & Nature (Ubud, Bangli & Bedugul)',
    titleEn: '2 Days: Bali Culture & Nature (Ubud, Bangli & Bedugul)',
    days: 2,
    pace: 'balanced',
    vehicleId: 'car-with-driver-avanza',
    originName: 'Ubud Central',
    originCoords: { lat: -8.5067, lng: 115.2625 },
    stopIds: [
      'campuhan-ridge-walk',
      'goa-gajah-gianyar',
      'desa-penglipuran-bangli',
      'air-terjun-tukad-cepung',
      'jatiluwih-rice-terraces',
      'pura-ulun-danu-beratan',
    ],
    summaryId: 'Hari 1 menjelajahi warisan kuno Gianyar–Bangli; Hari 2 menyusuri sawah UNESCO Jatiluwih dan Danau Beratan Bedugul.',
    summaryEn: 'Day 1 explores Gianyar–Bangli cultural gems; Day 2 visits UNESCO Jatiluwih rice terraces and Lake Beratan.',
  },
  {
    id: 'tpl-3d-south-ubud',
    titleId: '3 Hari: South Bali Cliffs & Ubud Heartland',
    titleEn: '3 Days: South Bali Cliffs & Ubud Heartland',
    days: 3,
    pace: 'balanced',
    vehicleId: 'car-with-driver-avanza',
    originName: 'Bandara Ngurah Rai / Jimbaran',
    originCoords: { lat: -8.7482, lng: 115.1675 },
    stopIds: [
      'pantai-melasti',
      'gwk-cultural-park',
      'pura-uluwatu',
      'pantai-jimbaran',
      'sacred-monkey-forest-ubud',
      'istana-ubud',
      'tegallalang-rice-terraces',
      'pura-tanah-lot',
    ],
    summaryId: 'Perpaduan tebing kapur Uluwatu & seafood Jimbaran, pusat seni Ubud, serta sunset ikonik di Pura Tanah Lot.',
    summaryEn: 'Combines Uluwatu limestone cliffs & Jimbaran seafood with Ubud arts and Tanah Lot sunset.',
  },
  {
    id: 'tpl-5d-complete',
    titleId: '5 Hari: Bali Complete Experience (Selatan, Ubud, Timur & Nusa Penida)',
    titleEn: '5 Days: Bali Complete Experience (South, Ubud, East & Nusa Penida)',
    days: 5,
    pace: 'balanced',
    vehicleId: 'car-with-driver-avanza',
    originName: 'Seminyak / Sanur',
    originCoords: { lat: -8.6938, lng: 115.2661 },
    stopIds: [
      'pantai-melasti',
      'pura-uluwatu',
      'sacred-monkey-forest-ubud',
      'tegallalang-rice-terraces',
      'pura-tirta-empul',
      'desa-penglipuran-bangli',
      'gunung-danau-batur-kintamani',
      'pura-agung-besakih',
      'tirta-gangga-karangasem',
      'kelingking-beach-nusa-penida',
      'broken-beach-angels-billabong',
      'crystal-bay-manta-point-penida',
    ],
    summaryId: 'Rencana perjalanan menyeluruh 5 hari mencakup Bali Selatan, Ubud, Kintamani, Karangasem, dan penyeberangan ke Nusa Penida.',
    summaryEn: 'Comprehensive 5-day journey spanning South Bali, Ubud, Kintamani, East Bali, and Nusa Penida island.',
  },
  {
    id: 'tpl-7d-explorer',
    titleId: '7 Hari: Grand Bali Explorer (9 Kabupaten/Kota)',
    titleEn: '7 Days: Grand Bali Explorer (All Regions)',
    days: 7,
    pace: 'balanced',
    vehicleId: 'suv-innova-zenix',
    originName: 'Denpasar / Sanur',
    originCoords: { lat: -8.6717, lng: 115.2339 },
    stopIds: [
      'pantai-sanur',
      'monumen-bajra-sandhi',
      'pura-uluwatu',
      'sacred-monkey-forest-ubud',
      'tegallalang-rice-terraces',
      'desa-penglipuran-bangli',
      'gunung-danau-batur-kintamani',
      'pura-agung-besakih',
      'tirta-gangga-karangasem',
      'pantai-amed-jemeluk-tulamben',
      'air-terjun-sekumpul-fiji',
      'pantai-lovina-buleleng',
      'pura-ulun-danu-beratan',
      'jatiluwih-rice-terraces',
      'pura-rambut-siwi-perancak',
      'pura-tanah-lot',
    ],
    summaryId: 'Lintas pulau 7 hari mengelilingi Bali Selatan, Denpasar, Gianyar, Bangli, Karangasem, Buleleng, Jembrana, dan Tabanan.',
    summaryEn: 'Full-island 7-day circuit covering South, Central, East, North, and West Bali.',
  },
  {
    id: 'tpl-honeymoon',
    titleId: '3 Hari: Honeymoon Escape (Sunset, Caldera & Nusa Lembongan)',
    titleEn: '3 Days: Honeymoon Escape (Sunset, Caldera & Nusa Lembongan)',
    days: 3,
    pace: 'relaxed',
    vehicleId: 'car-with-driver-avanza',
    originName: 'Jimbaran / Uluwatu',
    originCoords: { lat: -8.7794, lng: 115.1668 },
    stopIds: [
      'pantai-balangan',
      'pantai-jimbaran',
      'campuhan-ridge-walk',
      'taman-mumbul-sangeh',
      'nusa-lembongan-devils-tear-mangrove',
      'nusa-ceningan-yellow-bridge-blue-lagoon',
    ],
    summaryId: 'Dirancang dengan tempo santai untuk pasangan: makan malam tepi pantai Jimbaran, jalan pagi Ubud, dan pulau romantis Nusa Lembongan.',
    summaryEn: 'Relaxed romantic itinerary featuring Jimbaran candlelit seafood, Ubud ridge walks, and Nusa Lembongan.',
  },
  {
    id: 'tpl-family',
    titleId: '3 Hari: Family Friendly Bali (Taman Safari, Pantai Tenang & Kebun Raya)',
    titleEn: '3 Days: Family Friendly Bali (Safari, Calm Lagoons & Botanic Garden)',
    days: 3,
    pace: 'relaxed',
    vehicleId: 'van-hiace-commuter',
    originName: 'Nusa Dua / Sanur',
    originCoords: { lat: -8.8007, lng: 115.2395 },
    stopIds: [
      'pantai-pandawa',
      'gwk-cultural-park',
      'pantai-sanur',
      'bali-safari-marine-park',
      'kebun-raya-bali-bedugul',
      'pura-ulun-danu-beratan',
    ],
    summaryId: 'Aman dan ramah anak-anak maupun lansia dengan jalur jalan kaki landai dan perairan tenang.',
    summaryEn: 'Child- and senior-friendly stops featuring calm lagoons, wildlife conservation, and flat botanical lawns.',
  },
  {
    id: 'tpl-backpacker',
    titleId: '3 Hari: Budget Backpacker Scooter Loop',
    titleEn: '3 Days: Budget Backpacker Scooter Loop',
    days: 3,
    pace: 'packed',
    vehicleId: 'scooter-125',
    originName: 'Canggu / Kuta',
    originCoords: { lat: -8.6595, lng: 115.1301 },
    stopIds: [
      'pantai-canggu',
      'pantai-padang-padang',
      'pantai-bingin',
      'campuhan-ridge-walk',
      'air-terjun-kanto-lampo',
      'air-terjun-tibumana',
    ],
    summaryId: 'Fokus pada pantai publik, jalur alam gratis/hemat, dan transportasi skuter yang ekonomis.',
    summaryEn: 'Focused on low-cost beaches, scenic ridge walks, and hidden waterfalls by scooter.',
  },
  {
    id: 'tpl-adventure',
    titleId: '3 Hari: Adventure & Waterfalls North Bali',
    titleEn: '3 Days: Adventure & Waterfalls North Bali',
    days: 3,
    pace: 'packed',
    vehicleId: 'suv-innova-zenix',
    originName: 'Ubud / Bedugul',
    originCoords: { lat: -8.5067, lng: 115.2625 },
    stopIds: [
      'gunung-danau-batur-kintamani',
      'air-terjun-nungnung',
      'air-terjun-banyumala',
      'air-terjun-sekumpul-fiji',
      'air-terjun-gitgit-aling-aling',
      'danau-buyan-tamblingan',
    ],
    summaryId: 'Petualangan pendakian Gunung Batur dan ekspedisi air terjun terbesar di Bali Utara.',
    summaryEn: 'Summit sunrise trekking at Mount Batur followed by North Bali’s grandest waterfalls.',
  },
  {
    id: 'tpl-spiritual',
    titleId: '2 Hari: Spiritual & Cultural Heritage Journey',
    titleEn: '2 Days: Spiritual & Cultural Heritage Journey',
    days: 2,
    pace: 'relaxed',
    vehicleId: 'car-with-driver-avanza',
    originName: 'Ubud / Gianyar',
    originCoords: { lat: -8.5067, lng: 115.2625 },
    stopIds: [
      'pura-tirta-empul',
      'gunung-kawi-tampaksiring',
      'pura-samuan-tiga-pejeng',
      'pura-kehen-bangli',
      'pura-agung-besakih',
      'pura-luhur-batukaru',
    ],
    summaryId: 'Menelusuri pura Sad Kahyangan, candi pahat abad ke-11, dan tradisi melukat dengan pemandu adat.',
    summaryEn: 'Focused exploration of Bali’s ancient directional temples, rock-cut shrines, and water purification.',
  },
  {
    id: 'tpl-diving',
    titleId: '3 Hari: Diving & Snorkeling Trip (Amed, Tulamben & Menjangan)',
    titleEn: '3 Days: Diving & Snorkeling Trip (Amed, Tulamben & Menjangan)',
    days: 3,
    pace: 'balanced',
    vehicleId: 'suv-innova-zenix',
    originName: 'Sanur',
    originCoords: { lat: -8.6938, lng: 115.2661 },
    stopIds: [
      'padangbai-bias-tugel',
      'pantai-amed-jemeluk-tulamben',
      'pemuteran-pulau-menjangan',
      'taman-nasional-bali-barat',
    ],
    summaryId: 'Menjelajahi situs selam terbaik Bali: Blue Lagoon Padangbai, kapal karam USAT Liberty Tulamben, dan dinding karang Pulau Menjangan.',
    summaryEn: 'Covers Bali’s finest underwater sites: Blue Lagoon, USAT Liberty shipwreck, and Menjangan Island coral walls.',
  },
  {
    id: 'tpl-nusa-islands',
    titleId: '2 Hari: Nusa Penida, Lembongan & Ceningan Island Hopping',
    titleEn: '2 Days: Nusa Penida, Lembongan & Ceningan Island Hopping',
    days: 2,
    pace: 'balanced',
    vehicleId: 'fast-boat-nusa-bundle',
    originName: 'Pelabuhan Sanur',
    originCoords: { lat: -8.6712, lng: 115.2634 },
    stopIds: [
      'kelingking-beach-nusa-penida',
      'broken-beach-angels-billabong',
      'crystal-bay-manta-point-penida',
      'diamond-atuh-beach-penida',
      'nusa-lembongan-devils-tear-mangrove',
      'nusa-ceningan-yellow-bridge-blue-lagoon',
    ],
    summaryId: 'Eksplorasi lengkap tiga pulau di tenggara Bali dari Pantai Kelingking & Diamond hingga Jembatan Kuning Lembongan–Ceningan.',
    summaryEn: 'Two-day island adventure across West & East Nusa Penida, Nusa Lembongan, and Nusa Ceningan.',
  },
];

export function createTripFromTemplate(templateId: string, travelers = 2, isInternational = false): TripPlan {
  const tpl = TRIP_TEMPLATES.find((t) => t.id === templateId) || TRIP_TEMPLATES[0];
  const dests = tpl.stopIds
    .map((id) => BALI_DESTINATIONS.find((d) => d.id === id))
    .filter((d): d is Destination => Boolean(d));

  const built = buildTripStops(tpl.originCoords, dests, tpl.days, '08:00', tpl.pace);
  const ticketPerPerson = dests.reduce(
    (sum, d) => sum + (isInternational ? d.ticketIDR.international : d.ticketIDR.domestic),
    0
  );
  const hasIsland = dests.some((d) => d.subIsland !== 'Mainland Bali' && d.subIsland !== 'Pulau Serangan');

  const cost = calculateTripCosts({
    vehicleId: tpl.vehicleId,
    days: tpl.days,
    passengers: travelers,
    estimatedDistanceKm: built.totalDistanceKm,
    includeDriver: true,
    useTollRoad: false,
    tollCrossings: 0,
    includeFastBoat: hasIsland,
    fastBoatRoundTripCount: 1,
    destinationTicketTotalIDRPerPerson: ticketPerPerson,
    isInternationalTourist: isInternational,
    pickupAreaSurchargeIDR: 0,
    includeOptionalInsurance: false,
  });

  const today = new Date().toISOString().slice(0, 10);

  return {
    id: `trip_${Date.now()}`,
    tripName: tpl.titleId,
    startDate: today,
    endDate: today,
    departureTime: '08:00',
    days: tpl.days,
    originName: tpl.originName,
    originCoords: tpl.originCoords,
    travelers,
    pace: tpl.pace,
    vehicleId: tpl.vehicleId,
    budgetIDR: Math.ceil((cost.totalIDR * 1.15) / 100000) * 100000,
    isInternational,
    interests: ['beach', 'temple_culture', 'rice_terrace_nature'],
    stops: built.stops,
    totalDistanceKm: built.totalDistanceKm,
    totalDurationMinutes: built.totalDurationMinutes,
    totalEstimatedCostIDR: cost.totalIDR,
    visibility: 'private',
    status: 'planned',
    notes: tpl.summaryId,
  };
}
