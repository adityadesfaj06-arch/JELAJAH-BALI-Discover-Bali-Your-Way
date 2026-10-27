import React, { useState } from 'react';
import {
  Sparkles,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Download,
  Calendar,
  CloudRain,
  Printer,
  Save,
  AlertTriangle,
  Route as RouteIcon,
} from 'lucide-react';
import { Destination, TripPlan } from '../types';
import {
  TRIP_TEMPLATES,
  optimizeStopOrder,
  buildTripStops,
  createTripFromTemplate,
} from '../services/itineraryService';
import { VEHICLE_OPTIONS, calculateTripCosts } from '../services/pricingService';
import { useTranslation } from '../i18n/useTranslation';
import { DestinationVisual } from './DestinationVisual';

interface TripPlannerViewProps {
  destinations: Destination[];
  activeTrip: TripPlan;
  onUpdateTrip: (updated: TripPlan) => void;
  onSaveTripCloud: (trip: TripPlan) => Promise<void>;
  onSelectDestination: (dest: Destination) => void;
  onOpenAiAssistant: () => void;
}

export const TripPlannerView: React.FC<TripPlannerViewProps> = ({
  destinations,
  activeTrip,
  onUpdateTrip,
  onSaveTripCloud,
  onSelectDestination,
  onOpenAiAssistant,
}) => {
  const { lang, formatMoney } = useTranslation();
  const [selectedAddId, setSelectedAddId] = useState<string>(destinations[0]?.id || '');
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const [routeWarnings, setRouteWarnings] = useState<string[]>([]);

  const currentStopDestinations = activeTrip.stops
    .map((s) => destinations.find((d) => d.id === s.destinationId))
    .filter((d): d is Destination => Boolean(d));

  const rebuildWithDestinations = (destList: Destination[], overrides?: Partial<TripPlan>) => {
    const base = { ...activeTrip, ...overrides };
    const built = buildTripStops(base.originCoords, destList, base.days, base.departureTime, base.pace);
    setRouteWarnings(lang === 'en' ? built.warningsEn : built.warningsId);

    const ticketPerPerson = destList.reduce(
      (sum, d) => sum + (base.isInternational ? d.ticketIDR.international : d.ticketIDR.domestic),
      0
    );
    const hasIsland = destList.some((d) => d.subIsland !== 'Mainland Bali' && d.subIsland !== 'Pulau Serangan');

    const cost = calculateTripCosts({
      vehicleId: base.vehicleId,
      days: base.days,
      passengers: base.travelers,
      estimatedDistanceKm: built.totalDistanceKm,
      includeDriver: true,
      useTollRoad: false,
      tollCrossings: 0,
      includeFastBoat: hasIsland,
      fastBoatRoundTripCount: 1,
      destinationTicketTotalIDRPerPerson: ticketPerPerson,
      isInternationalTourist: base.isInternational,
      pickupAreaSurchargeIDR: 0,
      includeOptionalInsurance: false,
    });

    onUpdateTrip({
      ...base,
      stops: built.stops,
      totalDistanceKm: built.totalDistanceKm,
      totalDurationMinutes: built.totalDurationMinutes,
      totalEstimatedCostIDR: cost.totalIDR,
    });
  };

  const handleMoveStop = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= currentStopDestinations.length) return;
    const copy = [...currentStopDestinations];
    const [moved] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, moved);
    rebuildWithDestinations(copy);
  };

  const downloadBlob = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const rows = activeTrip.stops.map((s) => {
      const d = destinations.find((x) => x.id === s.destinationId);
      return `${s.order},${s.dayNumber},"${(lang === 'en' ? d?.nameEn : d?.nameId) || s.destinationId}",${s.plannedArrival},${s.plannedDeparture},${s.distanceKmFromPrev},${s.travelMinutesFromPrev}`;
    });
    downloadBlob(['Order,Day,Destination,Arrival,Departure,DistanceKm,TravelMin', ...rows].join('\n'), 'Jelajah_Bali_Itinerary.csv', 'text/csv;charset=utf-8;');
  };

  const handleExportICS = () => {
    const datePart = (activeTrip.startDate || '2026-11-01').replace(/-/g, '');
    const events = activeTrip.stops.map((s) => {
      const d = destinations.find((x) => x.id === s.destinationId);
      return [
        'BEGIN:VEVENT',
        `SUMMARY:${(lang === 'en' ? d?.nameEn : d?.nameId) || s.destinationId}`,
        `DTSTART:${datePart}T${s.plannedArrival.replace(':', '')}00`,
        `DTEND:${datePart}T${s.plannedDeparture.replace(':', '')}00`,
        `DESCRIPTION:${s.notes}`,
        'END:VEVENT',
      ].join('\r\n');
    });
    downloadBlob(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Jelajah Bali//ID', ...events, 'END:VCALENDAR'].join('\r\n'), 'Jelajah_Bali_Schedule.ics', 'text/calendar;charset=utf-8;');
  };

  const handleCloudSave = async () => {
    setSavingStatus(lang === 'id' ? 'Menyimpan...' : 'Saving...');
    await onSaveTripCloud(activeTrip);
    setSavingStatus(lang === 'id' ? 'Tersimpan di Cloud & Lokal ✓' : 'Saved to Cloud & Local ✓');
    setTimeout(() => setSavingStatus(null), 3000);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
            {lang === 'id' ? 'Mesin Optimasi Rute Geografis & Jadwal Multi-Perhentian' : 'Geographic Route Optimizer & Multi-Stop Itinerary Engine'}
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">
            {lang === 'id' ? 'Smart Trip Planner & Ekspor Jadwal' : 'Smart Trip Planner & Schedule Exporter'}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>{lang === 'id' ? 'Susun Rute dengan AI' : 'Generate with AI'}</span>
          </button>
          <button
            onClick={() => rebuildWithDestinations(optimizeStopOrder(activeTrip.originCoords, currentStopDestinations))}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#103828] px-4 py-2.5 text-xs font-semibold text-amber-50 hover:bg-[#174d38] transition"
          >
            <RouteIcon className="h-4 w-4" />
            <span>{lang === 'id' ? 'Optimalkan Urutan Terdekat' : 'Optimize Nearest Route'}</span>
          </button>
        </div>
      </div>

      {/* 12 Ready-to-Use Templates */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
          {lang === 'id' ? '12 Template Itinerary Siap Pakai (Klik untuk Memuat)' : '12 Curated Bali Itinerary Templates (Click to Load)'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {TRIP_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => onUpdateTrip(createTripFromTemplate(tpl.id, activeTrip.travelers, activeTrip.isInternational))}
              className="text-left rounded-xl border border-stone-200 dark:border-stone-800 p-3 hover:border-emerald-700 hover:bg-emerald-950/5 transition"
            >
              <p className="text-xs font-bold text-emerald-950 dark:text-amber-200 line-clamp-1">
                {lang === 'en' ? tpl.titleEn : tpl.titleId}
              </p>
              <p className="mt-1 text-[11px] text-stone-500 line-clamp-2">
                {lang === 'en' ? tpl.summaryEn : tpl.summaryId}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4 h-fit">
          <h2 className="font-serif text-lg font-bold">{lang === 'id' ? 'Parameter Perjalanan' : 'Trip Parameters'}</h2>
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">{lang === 'id' ? 'Nama Rencana' : 'Trip Title'}</label>
              <input
                type="text"
                value={activeTrip.tripName}
                onChange={(e) => onUpdateTrip({ ...activeTrip, tripName: e.target.value })}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block font-semibold mb-1">{lang === 'id' ? 'Durasi (Hari)' : 'Days'}</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={activeTrip.days}
                  onChange={(e) => rebuildWithDestinations(currentStopDestinations, { days: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">{lang === 'id' ? 'Wisatawan' : 'Travelers'}</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={activeTrip.travelers}
                  onChange={(e) => rebuildWithDestinations(currentStopDestinations, { travelers: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2 font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">{lang === 'id' ? 'Kendaraan' : 'Vehicle'}</label>
              <select
                value={activeTrip.vehicleId}
                onChange={(e) => rebuildWithDestinations(currentStopDestinations, { vehicleId: e.target.value })}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2"
              >
                {VEHICLE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>{lang === 'en' ? v.nameEn : v.nameId}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-[#103828] p-4 text-amber-50 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-amber-200/80">{lang === 'id' ? 'Total Jarak:' : 'Total Distance:'}</span>
              <span className="font-mono font-bold">{activeTrip.totalDistanceKm} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-200/80">{lang === 'id' ? 'Total Estimasi:' : 'Est. Total:'}</span>
              <span className="font-mono text-base font-bold text-amber-300">{formatMoney(activeTrip.totalEstimatedCostIDR)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-amber-200/75 border-t border-emerald-800 pt-1">
              <span>{lang === 'id' ? 'Per Orang:' : 'Per Person:'}</span>
              <span className="font-mono font-semibold">{formatMoney(activeTrip.totalEstimatedCostIDR / Math.max(1, activeTrip.travelers))}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={handleCloudSave} className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700">
              <Save className="h-4 w-4" />
              <span>{savingStatus || (lang === 'id' ? 'Simpan ke Cloud' : 'Save to Cloud')}</span>
            </button>
            <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-medium">
              <Printer className="h-3.5 w-3.5" />
              <span>PDF / Print</span>
            </button>
            <button onClick={handleExportICS} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>Calendar (.ics)</span>
            </button>
            <button onClick={handleExportCSV} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-medium">
              <Download className="h-3.5 w-3.5" />
              <span>CSV Excel</span>
            </button>
            <button onClick={() => downloadBlob(JSON.stringify(activeTrip, null, 2), 'Jelajah_Bali_Trip.json', 'application/json')} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-medium">
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-4">
          {routeWarnings.length > 0 && (
            <div className="rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-950 dark:text-amber-200 space-y-1">
              {routeWarnings.map((w, i) => (
                <p key={i} className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4">
            <select
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              aria-label="Pilih destinasi"
              className="flex-1 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs"
            >
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {lang === 'en' ? d.nameEn : d.nameId} ({d.regency})
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const dest = destinations.find((d) => d.id === selectedAddId);
                if (dest) rebuildWithDestinations([...currentStopDestinations, dest]);
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#103828] px-4 py-2 text-xs font-semibold text-amber-50"
            >
              <Plus className="h-4 w-4" />
              <span>{lang === 'id' ? 'Tambah Perhentian' : 'Add Stop'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeTrip.stops.map((stop, index) => {
              const dest = destinations.find((d) => d.id === stop.destinationId);
              if (!dest) return null;
              return (
                <div
                  key={`${stop.destinationId}-${index}`}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3.5 min-w-0">
                    <div
                      onClick={() => onSelectDestination(dest)}
                      className="cursor-pointer shrink-0 overflow-hidden rounded-xl w-full sm:w-36 h-24"
                    >
                      <DestinationVisual
                        destination={dest}
                        theme={dest.visualTheme}
                        showAttribution={false}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#103828] px-2 py-0.5 font-mono text-xs font-bold text-amber-200">
                        {lang === 'id' ? `Hari ${stop.dayNumber}` : `Day ${stop.dayNumber}`} • #{stop.order}
                      </span>
                      <span className="font-mono text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                        {stop.plannedArrival} – {stop.plannedDeparture} WITA
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        (+{stop.distanceKmFromPrev} km / ~{stop.travelMinutesFromPrev}m)
                      </span>
                    </div>
                    <button
                      onClick={() => onSelectDestination(dest)}
                      className="font-serif text-lg font-bold hover:text-emerald-800 text-left"
                    >
                      {lang === 'en' ? dest.nameEn : dest.nameId}
                    </button>
                    <p className="text-[11px] text-sky-800 dark:text-sky-300 flex items-center gap-1">
                      <CloudRain className="h-3 w-3 shrink-0" />
                      <span>{lang === 'en' ? stop.weatherRainFallbackEn : stop.weatherRainFallbackId}</span>
                    </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button onClick={() => handleMoveStop(index, -1)} disabled={index === 0} className="rounded-lg border p-2 disabled:opacity-35">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleMoveStop(index, 1)} disabled={index === activeTrip.stops.length - 1} className="rounded-lg border p-2 disabled:opacity-35">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => rebuildWithDestinations(currentStopDestinations.filter((_, i) => i !== index))} className="rounded-lg border border-rose-200 p-2 text-rose-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
