import React, { useState } from 'react';
import {
  Car,
  Compass,
  CheckCircle2,
  ShieldCheck,
  Utensils,
  Zap,
  Building2,
  Phone,
  Info,
} from 'lucide-react';
import { TripPlan } from '../types';
import { BALI_DESTINATIONS } from '../data/baliCatalog';
import { VEHICLE_OPTIONS, calculateTripCosts } from '../services/pricingService';
import {
  TOUR_PACKAGES,
  recommendToursForStops,
  PRACTICAL_PLACES,
} from '../services/tourService';
import { useTranslation } from '../i18n/useTranslation';
import { DestinationVisual } from './DestinationVisual';

interface TransportAndToursViewProps {
  activeTrip: TripPlan;
  initialSubTab?: 'transport' | 'tours' | 'practical';
}

export const TransportAndToursView: React.FC<TransportAndToursViewProps> = ({
  activeTrip,
  initialSubTab = 'transport',
}) => {
  const { lang, formatMoney } = useTranslation();
  const [subTab, setSubTab] = useState<'transport' | 'tours' | 'practical'>(
    initialSubTab
  );

  // Calculator state
  const [vehicleId, setVehicleId] = useState(activeTrip.vehicleId || 'car-with-driver-avanza');
  const [days, setDays] = useState(activeTrip.days || 2);
  const [passengers, setPassengers] = useState(activeTrip.travelers || 2);
  const [distanceKm, setDistanceKm] = useState(activeTrip.totalDistanceKm || 95);
  const [includeDriver, setIncludeDriver] = useState(true);
  const [useToll, setUseToll] = useState(true);
  const [includeBoat, setIncludeBoat] = useState(false);
  const [isIntl, setIsIntl] = useState(activeTrip.isInternational);
  const [inquirySentId, setInquirySentId] = useState<string | null>(null);
  const [practicalFilter, setPracticalFilter] = useState<string>('ALL');

  const breakdown = calculateTripCosts({
    vehicleId,
    days,
    passengers,
    estimatedDistanceKm: distanceKm,
    includeDriver,
    useTollRoad: useToll,
    tollCrossings: 2,
    includeFastBoat: includeBoat,
    fastBoatRoundTripCount: 1,
    destinationTicketTotalIDRPerPerson: isIntl ? 150000 : 75000,
    isInternationalTourist: isIntl,
    pickupAreaSurchargeIDR: 0,
    includeOptionalInsurance: false,
  });

  const recommendedTours = recommendToursForStops(
    activeTrip.stops.map((s) => s.destinationId)
  );

  const filteredPractical = PRACTICAL_PLACES.filter(
    (p) => practicalFilter === 'ALL' || p.category === practicalFilter
  );

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
            {lang === 'id'
              ? 'Kalkulator Biaya Transparan, Paket Tur Lokal & Fasilitas Praktis'
              : 'Transparent Cost Calculator, Local Tour Packages & Practical Guide'}
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            {lang === 'id'
              ? 'Transportasi, Tur & Kebutuhan Wisatawan'
              : 'Transport, Tours & Traveler Essentials'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSubTab('transport')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              subTab === 'transport'
                ? 'bg-[#103828] text-amber-50'
                : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
            }`}
          >
            <Car className="h-3.5 w-3.5" />
            <span>
              {lang === 'id' ? '12 Kendaraan & Kalkulator' : '12 Vehicles & Calculator'}
            </span>
          </button>
          <button
            onClick={() => setSubTab('tours')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              subTab === 'tours'
                ? 'bg-[#103828] text-amber-50'
                : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>
              {lang === 'id' ? 'Paket Tur & Pemandu Lokal' : 'Local Tours & Guides'}
            </span>
          </button>
          <button
            onClick={() => setSubTab('practical')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              subTab === 'practical'
                ? 'bg-[#103828] text-amber-50'
                : 'border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
            }`}
          >
            <Utensils className="h-3.5 w-3.5" />
            <span>
              {lang === 'id' ? 'Kuliner, Fasilitas & Etika Bali' : 'Culinary, Facilities & Etiquette'}
            </span>
          </button>
        </div>
      </div>

      {subTab === 'transport' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Calculator Form & Itemized Receipt */}
          <div className="lg:col-span-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4 h-fit">
            <h2 className="font-serif text-xl font-bold">
              {lang === 'id'
                ? 'Kalkulator Biaya Transportasi & Tiket'
                : 'Transport & Ticket Cost Calculator'}
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  {lang === 'id' ? 'Pilih Jenis Kendaraan' : 'Select Vehicle Category'}
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2"
                >
                  {VEHICLE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {lang === 'en' ? v.nameEn : v.nameId} ({formatMoney(v.baseRateIDRPerDay)}/hari)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1">
                    {lang === 'id' ? 'Durasi (Hari)' : 'Days'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {lang === 'id' ? 'Penumpang' : 'Passengers'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={passengers}
                    onChange={(e) => setPassengers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">
                    {lang === 'id' ? 'Est. Jarak (km)' : 'Distance (km)'}
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={1500}
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Math.max(10, parseInt(e.target.value, 10) || 10))}
                    className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-800 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDriver}
                    onChange={(e) => setIncludeDriver(e.target.checked)}
                  />
                  <span>{lang === 'id' ? 'Dengan Sopir Lokal' : 'Include Local Driver'}</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-800 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useToll}
                    onChange={(e) => setUseToll(e.target.checked)}
                  />
                  <span>{lang === 'id' ? 'Tol Bali Mandara' : 'Bali Mandara Toll'}</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-800 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBoat}
                    onChange={(e) => setIncludeBoat(e.target.checked)}
                  />
                  <span>{lang === 'id' ? 'Fast Boat Nusa PP' : 'Nusa Fast Boat RT'}</span>
                </label>
                <label className="flex items-center gap-2 rounded-lg border border-stone-200 dark:border-stone-800 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isIntl}
                    onChange={(e) => setIsIntl(e.target.checked)}
                  />
                  <span>{lang === 'id' ? 'Tarif Tiket WNA' : 'International Ticket'}</span>
                </label>
              </div>
            </div>

            {/* Itemized Breakdown */}
            <div className="rounded-xl bg-stone-100 dark:bg-stone-800/80 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>
                  {lang === 'id'
                    ? `Sewa Kendaraan (${breakdown.vehicleCount} unit × ${days} hari)`
                    : `Vehicle Rental (${breakdown.vehicleCount} unit × ${days}d)`}
                </span>
                <span className="font-mono font-semibold">{formatMoney(breakdown.vehicleRentalIDR)}</span>
              </div>
              {breakdown.driverTotalIDR > 0 && (
                <div className="flex justify-between">
                  <span>{lang === 'id' ? 'Biaya Sopir Tambahan' : 'Driver Service Fee'}</span>
                  <span className="font-mono font-semibold">{formatMoney(breakdown.driverTotalIDR)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{lang === 'id' ? 'Estimasi BBM' : 'Estimated Fuel'}</span>
                <span className="font-mono font-semibold">
                  {breakdown.fuelEstimateIDR === 0
                    ? lang === 'id'
                      ? 'Termasuk Paket'
                      : 'Included'
                    : formatMoney(breakdown.fuelEstimateIDR)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'id' ? 'Parkir & Tol Bali Mandara' : 'Parking & Bali Mandara Toll'}</span>
                <span className="font-mono font-semibold">
                  {formatMoney(breakdown.parkingEstimateIDR + breakdown.tollEstimateIDR)}
                </span>
              </div>
              {breakdown.fastBoatTotalIDR > 0 && (
                <div className="flex justify-between">
                  <span>{lang === 'id' ? 'Kapal Cepat Sanur–Nusa PP' : 'Round-Trip Fast Boat'}</span>
                  <span className="font-mono font-semibold">{formatMoney(breakdown.fastBoatTotalIDR)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>{lang === 'id' ? 'Estimasi Tiket Destinasi' : 'Est. Attraction Tickets'}</span>
                <span className="font-mono font-semibold">{formatMoney(breakdown.destinationTicketsTotalIDR)}</span>
              </div>

              <div className="border-t border-stone-300 dark:border-stone-700 pt-2.5 flex justify-between items-baseline">
                <span className="font-bold text-sm">
                  {lang === 'id' ? 'Total Estimasi Biaya' : 'Total Estimated Cost'}
                </span>
                <span className="font-mono text-lg font-bold text-emerald-900 dark:text-amber-300">
                  {formatMoney(breakdown.totalIDR)}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-stone-600 dark:text-stone-400">
                <span>{lang === 'id' ? 'Patungan per Orang:' : 'Split per Person:'}</span>
                <span className="font-mono font-bold">{formatMoney(breakdown.perPersonIDR)} / pax</span>
              </div>
            </div>
          </div>

          {/* 12 Vehicle Comparison Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {VEHICLE_OPTIONS.map((v) => (
              <div
                key={v.id}
                onClick={() => setVehicleId(v.id)}
                className={`cursor-pointer rounded-2xl border p-4 transition space-y-2 ${
                  vehicleId === v.id
                    ? 'border-emerald-700 bg-emerald-950/5 dark:bg-emerald-950/30 ring-1 ring-emerald-700'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-400'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif text-base font-bold leading-snug">
                    {lang === 'en' ? v.nameEn : v.nameId}
                  </h3>
                  <span className="font-mono text-xs font-bold text-emerald-800 dark:text-amber-300 shrink-0">
                    {formatMoney(v.baseRateIDRPerDay)}
                  </span>
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  {lang === 'en' ? v.notesEn : v.notesId}
                </p>
                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100 dark:border-stone-800 font-mono">
                  <span>👤 Max {v.capacityPassengers} pax</span>
                  <span>🧳 {v.capacityLuggage} bags</span>
                  <span>{v.includesDriver ? '✓ Driver+BBM' : 'Self-Drive'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'tours' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendedTours.map((tour) => (
            <div
              key={tour.id}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-col justify-between gap-4 shadow-xs"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    {tour.category} • {tour.durationHours}h
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {tour.providerName}
                  </span>
                </div>

                <h2 className="font-serif text-xl font-bold">
                  {lang === 'en' ? tour.titleEn : tour.titleId}
                </h2>

                {/* Verified Route Stop Photo Collage (Known Source per Stop) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {tour.routeStopIds.slice(0, 3).map((stopId) => {
                    const stopDest = BALI_DESTINATIONS.find(
                      (d) => d.id === stopId
                    );
                    if (!stopDest) return null;
                    return (
                      <div
                        key={stopDest.id}
                        className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800"
                      >
                        <DestinationVisual
                          destination={stopDest}
                          theme={stopDest.visualTheme}
                          showAttribution={false}
                          className="h-20 w-full"
                          label={stopDest.regency}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <p className="font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
                      {lang === 'id' ? 'Termasuk (Inclusions):' : 'Included:'}
                    </p>
                    <ul className="space-y-0.5 text-stone-600 dark:text-stone-300">
                      {(lang === 'en' ? tour.inclusionsEn : tour.inclusionsId).map((inc, i) => (
                        <li key={i} className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                          <span>{inc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800 dark:text-amber-400 mb-1">
                      {lang === 'id' ? 'Catatan Keselamatan:' : 'Safety & Policy:'}
                    </p>
                    <p className="text-stone-600 dark:text-stone-400 text-[11px]">
                      {lang === 'en' ? tour.safetyNotesEn : tour.safetyNotesId}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-200 dark:border-stone-800 pt-3.5">
                <div>
                  <span className="text-[11px] text-stone-500 block">
                    {lang === 'id' ? 'Estimasi Tarif Resmi' : 'Published Package Rate'}
                  </span>
                  <span className="font-mono text-lg font-bold text-emerald-950 dark:text-amber-300">
                    {formatMoney(tour.pricePerPersonIDR)}{' '}
                    <span className="text-xs font-normal">/ pax</span>
                  </span>
                </div>

                <button
                  onClick={() => setInquirySentId(tour.id)}
                  className="rounded-xl bg-[#103828] px-4 py-2.5 text-xs font-semibold text-amber-50 hover:bg-[#174d38] transition"
                >
                  {inquirySentId === tour.id
                    ? lang === 'id'
                      ? 'Permintaan Terkirim ✓'
                      : 'Inquiry Logged ✓'
                    : lang === 'id'
                      ? 'Tanya Jadwal & Pemandu'
                      : 'Request Local Guide'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'practical' && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: lang === 'id' ? 'Semua Fasilitas' : 'All Essentials' },
              { id: 'hospital', label: lang === 'id' ? 'Rumah Sakit 24 Jam' : '24h Hospitals' },
              { id: 'harbor', label: lang === 'id' ? 'Pelabuhan & Bandara' : 'Harbors & Airport' },
              { id: 'ev_charging', label: 'SPKLU EV Charging' },
              { id: 'warung', label: lang === 'id' ? 'Kuliner & Warung' : 'Local Culinary' },
              { id: 'vegan', label: 'Vegan & Plant-Based' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setPracticalFilter(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  practicalFilter === f.id
                    ? 'bg-amber-500 text-stone-950'
                    : 'border border-stone-300 dark:border-stone-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPractical.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-emerald-800 dark:text-emerald-400">
                      {item.regency} • {item.openingHoursStatus}
                    </span>
                    <h3 className="font-serif text-lg font-bold">{item.name}</h3>
                  </div>
                  {item.category === 'ev_charging' ? (
                    <Zap className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Building2 className="h-5 w-5 text-emerald-700" />
                  )}
                </div>
                <p className="text-xs text-stone-600 dark:text-stone-300">
                  {lang === 'en' ? item.notesEn : item.notesId}
                </p>
                <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                  <span>{item.address}</span>
                  {item.phone && (
                    <a
                      href={`tel:${item.phone}`}
                      className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 dark:text-amber-300"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {item.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bali Cultural Etiquette Box */}
          <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/20 p-5 space-y-2">
            <h3 className="font-serif text-lg font-bold flex items-center gap-2 text-amber-950 dark:text-amber-200">
              <Info className="h-5 w-5 text-amber-700" />
              <span>
                {lang === 'id'
                  ? 'Panduan Etika Budaya & Kehormatan Adat Bali'
                  : 'Bali Cultural Etiquette & Sacred Custom Guide'}
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-700 dark:text-stone-300 pt-1">
              <div>
                <strong>1. {lang === 'id' ? 'Tata Krama Pura:' : 'Temple Dress Code:'}</strong>{' '}
                {lang === 'id'
                  ? 'Selalu kenakan kain kamen (sarung) dan selendang pinggang saat memasuki area pura. Jangan menginjak sesajen Canang Sari di jalan.'
                  : 'Always wear a sarong (kamen) and waist sash when entering temples. Never step over or on floral Canang Sari offerings on the ground.'}
              </div>
              <div>
                <strong>2. {lang === 'id' ? 'Hari Suci Nyepi:' : 'Nyepi Day of Silence:'}</strong>{' '}
                {lang === 'id'
                  ? 'Saat Hari Raya Nyepi (24 jam penuh), seluruh pulau termasuk Bandara Ngurah Rai tutup total: dilarang keluar penginapan dan menyalakan lampu luar.'
                  : 'During Nyepi (24 hours), the entire island including the airport observes total silence: stay inside your hotel and keep lights dimmed.'}
              </div>
              <div>
                <strong>3. {lang === 'id' ? 'Keamanan Pantai & Satwa:' : 'Ocean & Wildlife Safety:'}</strong>{' '}
                {lang === 'id'
                  ? 'Berenanglah hanya di antara bendera merah-kuning penjaga pantai (Balawista), dan jangan memberi makan atau menyentuh kera liar di pura.'
                  : 'Swim only between red-and-yellow lifeguard flags, and avoid touching or feeding macaques at forest sanctuaries.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
