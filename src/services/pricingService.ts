import {
  VehicleOption,
  CostBreakdownInput,
  CostBreakdownResult,
} from '../types';

export const VEHICLE_OPTIONS: VehicleOption[] = [
  {
    id: 'scooter-125',
    nameId: 'Skuter Matik 110–125cc (Honda Scoopy / Vario)',
    nameEn: '110–125cc Automatic Scooter (Honda Scoopy / Vario)',
    category: 'scooter',
    capacityPassengers: 2,
    capacityLuggage: 1,
    baseRateIDRPerDay: 90000,
    hourlyRateIDR: 20000,
    driverFeeIDRPerDay: 0,
    includesDriver: false,
    includesFuel: false,
    fuelKmPerLiter: 42,
    fuelPriceIDRPerLiter: 10000,
    supportedAreas: ['Badung', 'Denpasar', 'Gianyar', 'Tabanan', 'Nusa Penida'],
    notesId: 'Termasuk 2 helm SNI dan jas hujan. Wajib memiliki SIM C / SIM Internasional.',
    notesEn: 'Includes 2 SNI helmets and rain ponchos. Valid motorcycle license required.',
    priceSource: 'configured_reference',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'scooter-160-maxi',
    nameId: 'Maxi Scooter 155–160cc (Yamaha NMAX / Honda PCX / ADV)',
    nameEn: '155–160cc Maxi Scooter (Yamaha NMAX / Honda PCX / ADV)',
    category: 'scooter',
    capacityPassengers: 2,
    capacityLuggage: 2,
    baseRateIDRPerDay: 165000,
    hourlyRateIDR: 30000,
    driverFeeIDRPerDay: 0,
    includesDriver: false,
    includesFuel: false,
    fuelKmPerLiter: 36,
    fuelPriceIDRPerLiter: 12500,
    supportedAreas: ['Seluruh Bali Daratan', 'Nusa Penida', 'Nusa Lembongan'],
    notesId: 'Nyaman untuk rute menanjak Ubud, Kintamani, dan Bedugul dengan bagasi bawah jok luas.',
    notesEn: 'Comfortable for highland climbs in Ubud, Kintamani, and Bedugul with spacious under-seat storage.',
    priceSource: 'configured_reference',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'compact-brio-agya',
    nameId: 'City Car Ringkas Lepas Kunci (Honda Brio / Toyota Agya AT)',
    nameEn: 'Compact City Car Self-Drive (Honda Brio / Toyota Agya AT)',
    category: 'compact_car',
    capacityPassengers: 4,
    capacityLuggage: 2,
    baseRateIDRPerDay: 325000,
    hourlyRateIDR: 50000,
    driverFeeIDRPerDay: 225000,
    includesDriver: false,
    includesFuel: false,
    fuelKmPerLiter: 16,
    fuelPriceIDRPerLiter: 10000,
    supportedAreas: ['Badung', 'Denpasar', 'Gianyar', 'Tabanan'],
    notesId: 'Gesit untuk jalan sempit area Canggu, Seminyak, dan Ubud.',
    notesEn: 'Nimble for narrow streets in Canggu, Seminyak, and Ubud.',
    priceSource: 'configured_reference',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'car-with-driver-avanza',
    nameId: 'MPV Keluarga + Sopir + BBM (All New Avanza / Xpander)',
    nameEn: 'Family MPV + Private Driver + Fuel (All New Avanza / Xpander)',
    category: 'car_with_driver',
    capacityPassengers: 6,
    capacityLuggage: 4,
    baseRateIDRPerDay: 650000,
    hourlyRateIDR: 80000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 13,
    fuelPriceIDRPerLiter: 10000,
    supportedAreas: ['Seluruh 9 Kabupaten/Kota Bali'],
    notesId: 'Paket terpopuler di Bali: durasi 10 jam/hari sudah termasuk sopir merangkap pemandu lokal & BBM.',
    notesEn: 'Most popular choice in Bali: 10 hours/day inclusive of English-speaking local driver and fuel.',
    priceSource: 'vendor_estimate',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'mpv-self-drive-avanza',
    nameId: 'MPV Keluarga Lepas Kunci (Toyota Avanza / Veloz AT)',
    nameEn: 'Self-Drive Family MPV (Toyota Avanza / Veloz AT)',
    category: 'mpv',
    capacityPassengers: 6,
    capacityLuggage: 4,
    baseRateIDRPerDay: 425000,
    hourlyRateIDR: 60000,
    driverFeeIDRPerDay: 225000,
    includesDriver: false,
    includesFuel: false,
    fuelKmPerLiter: 13,
    fuelPriceIDRPerLiter: 10000,
    supportedAreas: ['Seluruh 9 Kabupaten/Kota Bali'],
    notesId: 'Sewa 24 jam lepas kunci untuk keluarga; wajib memiliki SIM A aktif.',
    notesEn: '24-hour self-drive MPV rental for families; valid driver’s license required.',
    priceSource: 'configured_reference',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'suv-innova-zenix',
    nameId: 'Medium SUV/MPV Premium + Sopir + BBM (Innova Reborn / Zenix)',
    nameEn: 'Medium SUV/MPV + Driver + Fuel (Toyota Innova Reborn / Zenix)',
    category: 'suv',
    capacityPassengers: 6,
    capacityLuggage: 5,
    baseRateIDRPerDay: 950000,
    hourlyRateIDR: 115000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 12,
    fuelPriceIDRPerLiter: 13500,
    supportedAreas: ['Seluruh 9 Kabupaten/Kota Bali'],
    notesId: 'Suspensi paling nyaman dan bertenaga untuk perjalanan jauh ke Buleleng, Karangasem, dan Jembrana.',
    notesEn: 'Superior suspension and torque for long-distance trips to North, East, and West Bali.',
    priceSource: 'vendor_estimate',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'suv-fortuner-pajero',
    nameId: 'SUV Tangguh + Sopir + BBM (Toyota Fortuner / Pajero Sport)',
    nameEn: 'Full-Size SUV + Driver + Fuel (Toyota Fortuner / Pajero Sport)',
    category: 'suv',
    capacityPassengers: 6,
    capacityLuggage: 5,
    baseRateIDRPerDay: 1550000,
    hourlyRateIDR: 180000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 10,
    fuelPriceIDRPerLiter: 14000,
    supportedAreas: ['Seluruh 9 Kabupaten/Kota Bali'],
    notesId: 'Ground clearance tinggi untuk medan perbukitan ekstrem dan perjalanan eksekutif.',
    notesEn: 'High ground clearance for steep highland terrain and executive travel.',
    priceSource: 'vendor_estimate',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'van-hiace-commuter',
    nameId: 'Minivan Rombongan + Sopir + BBM (Toyota HiAce Commuter 14 Kursi)',
    nameEn: 'Group Minivan + Driver + Fuel (Toyota HiAce Commuter 14-Seater)',
    category: 'van',
    capacityPassengers: 14,
    capacityLuggage: 10,
    baseRateIDRPerDay: 1350000,
    hourlyRateIDR: 160000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 9,
    fuelPriceIDRPerLiter: 14000,
    supportedAreas: ['Seluruh 9 Kabupaten/Kota Bali'],
    notesId: 'Ideal untuk keluarga besar atau rombongan kantor hingga 14 penumpang.',
    notesEn: 'Ideal for extended families or small corporate groups up to 14 passengers.',
    priceSource: 'vendor_estimate',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'minibus-elf-long',
    nameId: 'Minibus Pariwisata + Sopir + BBM (Isuzu Elf Long 18 Kursi)',
    nameEn: 'Tour Minibus + Driver + Fuel (Isuzu Elf Long 18-Seater)',
    category: 'minibus',
    capacityPassengers: 18,
    capacityLuggage: 14,
    baseRateIDRPerDay: 1450000,
    hourlyRateIDR: 175000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 8,
    fuelPriceIDRPerLiter: 14000,
    supportedAreas: ['Seluruh 9 Kabupaten/Kota Bali'],
    notesId: 'Kapasitas besar untuk grup tur komunitas atau studi banding.',
    notesEn: 'High capacity for community tours or group excursions.',
    priceSource: 'vendor_estimate',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'premium-alphard',
    nameId: 'Luxury MPV VIP + Sopir + BBM (Toyota Alphard / Vellfire)',
    nameEn: 'VIP Luxury MPV + Chauffeur + Fuel (Toyota Alphard / Vellfire)',
    category: 'premium',
    capacityPassengers: 5,
    capacityLuggage: 4,
    baseRateIDRPerDay: 2650000,
    hourlyRateIDR: 300000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 9,
    fuelPriceIDRPerLiter: 14500,
    supportedAreas: ['Badung', 'Denpasar', 'Gianyar', 'Tabanan', 'Bangli', 'Karangasem'],
    notesId: 'Captain seat mewah untuk honeymoon, tamu VIP, atau perjalanan bisnis.',
    notesEn: 'First-class captain seats for honeymooners, VIP guests, or executive travel.',
    priceSource: 'vendor_estimate',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'airport-port-transfer',
    nameId: 'Antar-Jemput Bandara Ngurah Rai / Pelabuhan Sanur (Sekali Jalan)',
    nameEn: 'Airport DPS / Sanur Harbor Private Transfer (One-Way)',
    category: 'port_transfer',
    capacityPassengers: 4,
    capacityLuggage: 4,
    baseRateIDRPerDay: 250000,
    hourlyRateIDR: 125000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 13,
    fuelPriceIDRPerLiter: 10000,
    supportedAreas: ['Bandara DPS', 'Pelabuhan Sanur', 'Pelabuhan Padangbai', 'Kuta', 'Ubud'],
    notesId: 'Tarif rata-rata antar-jemput poin-ke-poin termasuk parkir bandara/pelabuhan.',
    notesEn: 'Point-to-point private transfer inclusive of airport or harbor parking.',
    priceSource: 'configured_reference',
    lastUpdated: '2026-10-27',
  },
  {
    id: 'fast-boat-nusa-bundle',
    nameId: 'Paket Fast Boat PP Sanur + Mobil Pulau Nusa Penida/Lembongan',
    nameEn: 'Round-Trip Fast Boat Sanur + Nusa Island Car Bundle',
    category: 'fast_boat',
    capacityPassengers: 6,
    capacityLuggage: 4,
    baseRateIDRPerDay: 750000,
    hourlyRateIDR: 95000,
    driverFeeIDRPerDay: 0,
    includesDriver: true,
    includesFuel: true,
    fuelKmPerLiter: 11,
    fuelPriceIDRPerLiter: 12000,
    supportedAreas: ['Pelabuhan Sanur', 'Nusa Penida', 'Nusa Lembongan', 'Nusa Ceningan'],
    notesId: 'Mencakup sewa mobil & sopir lokal di Nusa Penida; tiket kapal cepat dihitung per penumpang.',
    notesEn: 'Covers private island car & driver on Nusa Penida; fast boat tickets calculated per passenger.',
    priceSource: 'vendor_estimate',
    lastUpdated: '2026-10-27',
  },
];

export function calculateTripCosts(
  input: CostBreakdownInput
): CostBreakdownResult {
  const vehicle =
    VEHICLE_OPTIONS.find((v) => v.id === input.vehicleId) ||
    VEHICLE_OPTIONS.find((v) => v.id === 'car-with-driver-avanza')!;

  const safeDays = Math.max(1, input.days);
  const safePassengers = Math.max(1, input.passengers);
  const vehicleCount = Math.max(
    1,
    Math.ceil(safePassengers / vehicle.capacityPassengers)
  );

  const vehicleRentalIDR =
    vehicle.baseRateIDRPerDay * safeDays * vehicleCount;

  const driverTotalIDR =
    !vehicle.includesDriver && input.includeDriver
      ? vehicle.driverFeeIDRPerDay * safeDays * vehicleCount
      : 0;

  const fuelEstimateIDR = vehicle.includesFuel
    ? 0
    : Math.ceil(
        (Math.max(15, input.estimatedDistanceKm) / vehicle.fuelKmPerLiter) *
          vehicle.fuelPriceIDRPerLiter *
          vehicleCount
      );

  const perDayParking =
    vehicle.category === 'scooter' ? 8000 : 25000;
  const parkingEstimateIDR = perDayParking * safeDays * vehicleCount;

  const tollRatePerCrossing =
    vehicle.category === 'scooter' ? 5500 : 14000;
  const tollEstimateIDR = input.useTollRoad
    ? tollRatePerCrossing * Math.max(1, input.tollCrossings) * vehicleCount
    : 0;

  const fastBoatRoundTripRatePerPerson = input.isInternationalTourist
    ? 350000
    : 225000;
  const fastBoatTotalIDR = input.includeFastBoat
    ? fastBoatRoundTripRatePerPerson *
      safePassengers *
      Math.max(1, input.fastBoatRoundTripCount)
    : 0;

  const destinationTicketsTotalIDR =
    Math.max(0, input.destinationTicketTotalIDRPerPerson) * safePassengers;

  const pickupSurchargeIDR =
    Math.max(0, input.pickupAreaSurchargeIDR) * vehicleCount;

  const insuranceTotalIDR = input.includeOptionalInsurance
    ? 35000 * safeDays * safePassengers
    : 0;

  const subtotalBeforeExtrasIDR =
    vehicleRentalIDR +
    driverTotalIDR +
    fuelEstimateIDR +
    parkingEstimateIDR +
    tollEstimateIDR +
    fastBoatTotalIDR +
    destinationTicketsTotalIDR;

  const serviceFeeIDR = Math.round(subtotalBeforeExtrasIDR * 0.02);

  const totalIDR =
    subtotalBeforeExtrasIDR +
    pickupSurchargeIDR +
    insuranceTotalIDR +
    serviceFeeIDR;

  const perVehicleIDR = Math.round(totalIDR / vehicleCount);
  const perPersonIDR = Math.round(totalIDR / safePassengers);
  const priceRangeLowIDR = Math.round(totalIDR * 0.92);
  const priceRangeHighIDR = Math.round(totalIDR * 1.12);

  return {
    vehicleCount,
    vehicleRentalIDR,
    driverTotalIDR,
    fuelEstimateIDR,
    parkingEstimateIDR,
    tollEstimateIDR,
    fastBoatTotalIDR,
    destinationTicketsTotalIDR,
    pickupSurchargeIDR,
    insuranceTotalIDR,
    serviceFeeIDR,
    subtotalBeforeExtrasIDR,
    totalIDR,
    perVehicleIDR,
    perPersonIDR,
    priceRangeLowIDR,
    priceRangeHighIDR,
    includedItemsId: [
      `${vehicleCount}x ${vehicle.nameId} (${safeDays} hari)`,
      vehicle.includesDriver || input.includeDriver
        ? 'Jasa sopir lokal berpengalaman'
        : 'Kendaraan lepas kunci (self-drive)',
      vehicle.includesFuel
        ? 'BBM termasuk dalam paket harian'
        : `Estimasi BBM untuk ~${Math.round(input.estimatedDistanceKm)} km`,
      'Estimasi parkir kawasan wisata & tiket objek wisata terpilih',
    ],
    includedItemsEn: [
      `${vehicleCount}x ${vehicle.nameEn} (${safeDays} day(s))`,
      vehicle.includesDriver || input.includeDriver
        ? 'Experienced local driver service'
        : 'Self-drive vehicle rental',
      vehicle.includesFuel
        ? 'Fuel included in daily package'
        : `Estimated fuel for ~${Math.round(input.estimatedDistanceKm)} km`,
      'Estimated attraction parking & selected entry tickets',
    ],
    excludedItemsId: [
      'Makan siang/malam pribadi dan pengeluaran belanja oleh-oleh',
      'Tip sukarela untuk sopir/pemandu',
      'Biaya overtime bila melebihi 10 jam operasional per hari (~10%/jam)',
    ],
    excludedItemsEn: [
      'Personal meals and souvenir shopping expenses',
      'Voluntary driver/guide gratuity',
      'Overtime surcharge beyond 10 hours/day (~10%/hour)',
    ],
    assumptionsId: [
      `Perhitungan menggunakan kapasitas ${vehicle.capacityPassengers} penumpang/unit (${vehicleCount} unit dibutuhkan untuk ${safePassengers} wisatawan).`,
      `Tarif mengacu pada harga pasar rata-rata koperasi transportasi wisata Bali (diperbarui ${vehicle.lastUpdated}).`,
    ],
    assumptionsEn: [
      `Calculated using ${vehicle.capacityPassengers} pax/vehicle capacity (${vehicleCount} vehicle(s) needed for ${safePassengers} traveler(s)).`,
      `Rates reflect standard Bali tourism transport cooperative reference pricing (updated ${vehicle.lastUpdated}).`,
    ],
  };
}
