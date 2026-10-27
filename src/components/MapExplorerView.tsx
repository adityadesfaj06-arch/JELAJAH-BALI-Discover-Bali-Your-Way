import React, { useState, useEffect } from 'react';
import {
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Search,
  Navigation,
  Eye,
  Plus,
  Route as RouteIcon,
  Compass,
  MapPin,
} from 'lucide-react';
import { Destination, TripPlan } from '../types';
import { ALL_REGENCIES, ALL_CATEGORIES } from '../data/baliCatalog';
import { useTranslation } from '../i18n/useTranslation';
import {
  searchLiveGooglePlaces,
  LivePlaceSearchResult,
  computeMultiStopRoute,
} from '../services/apiClient';
import { DestinationVisual } from './DestinationVisual';

interface MapExplorerViewProps {
  destinations: Destination[];
  activeTrip: TripPlan;
  onSelectDestination: (dest: Destination, initialTab?: 'details' | '360') => void;
  onAddToTrip: (dest: Destination) => void;
}

const RoutePolylineOverlay: React.FC<{
  waypoints: Array<{ lat: number; lng: number }>;
}> = ({ waypoints }) => {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib || waypoints.length < 2) return;
    const polyline = new mapsLib.Polyline({
      path: waypoints,
      geodesic: true,
      strokeColor: '#C87D55',
      strokeOpacity: 0.9,
      strokeWeight: 4,
      map,
    });

    return () => {
      polyline.setMap(null);
    };
  }, [map, mapsLib, waypoints]);

  return null;
};

export const MapExplorerView: React.FC<MapExplorerViewProps> = ({
  destinations,
  activeTrip,
  onSelectDestination,
  onAddToTrip,
}) => {
  const { lang, formatMoney } = useTranslation();
  const [selectedRegency, setSelectedRegency] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [focusedDest, setFocusedDest] = useState<Destination | null>(
    destinations[0] || null
  );
  const [liveQuery, setLiveQuery] = useState('');
  const [livePlaces, setLivePlaces] = useState<LivePlaceSearchResult[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [showTripRoute, setShowTripRoute] = useState(true);
  const [routeMetrics, setRouteMetrics] = useState<{
    distanceKm: number;
    durationMinutes: number;
    isLiveApi: boolean;
  } | null>(null);

  const filteredDestinations = destinations.filter((d) => {
    const matchReg = selectedRegency === 'ALL' || d.regency === selectedRegency;
    const matchCat =
      selectedCategory === 'ALL' ||
      d.category === selectedCategory ||
      d.secondaryCategories.includes(selectedCategory as any);
    return matchReg && matchCat;
  });

  const tripWaypoints = activeTrip.stops
    .map((s) => destinations.find((d) => d.id === s.destinationId)?.coordinates)
    .filter((c): c is { lat: number; lng: number } => Boolean(c));

  useEffect(() => {
    if (tripWaypoints.length < 2) {
      setRouteMetrics(null);
      return;
    }
    computeMultiStopRoute(tripWaypoints, 'DRIVE').then((res) => {
      if (res.distanceKm > 0) {
        setRouteMetrics(res);
      } else {
        setRouteMetrics({
          distanceKm: activeTrip.totalDistanceKm,
          durationMinutes: activeTrip.totalDurationMinutes,
          isLiveApi: false,
        });
      }
    });
  }, [activeTrip.stops.length, activeTrip.totalDistanceKm]);

  const handlePlacesSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveQuery.trim()) return;
    setSearchingPlaces(true);
    try {
      const res = await searchLiveGooglePlaces(liveQuery.trim(), lang);
      setLivePlaces(res.places);
    } finally {
      setSearchingPlaces(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
      {/* Header & Filter Bar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
            {lang === 'id'
              ? 'Pemetaan Geospasial & Navigasi Pulau Bali'
              : 'Bali Geospatial Mapping & Multi-Stop Navigation'}
          </p>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
            {lang === 'id'
              ? 'Jelajahi Peta Interaktif & Rute Perjalanan'
              : 'Interactive Map Explorer & Route Visualizer'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedRegency}
            onChange={(e) => setSelectedRegency(e.target.value)}
            aria-label="Filter Kabupaten/Kota"
            className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs font-medium"
          >
            <option value="ALL">
              {lang === 'id' ? 'Semua 9 Kabupaten/Kota' : 'All 9 Regencies'}
            </option>
            {ALL_REGENCIES.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter Kategori"
            className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs font-medium"
          >
            <option value="ALL">
              {lang === 'id' ? 'Semua Kategori' : 'All Categories'}
            </option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {lang === 'en' ? cat.labelEn : cat.labelId}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowTripRoute(!showTripRoute)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              showTripRoute
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800'
            }`}
          >
            <RouteIcon className="h-3.5 w-3.5" />
            <span>
              {lang === 'id' ? 'Garis Rute Aktif' : 'Active Trip Polyline'} (
              {activeTrip.stops.length})
            </span>
          </button>
        </div>
      </div>

      {/* Live Google Places API (New) Search Bar */}
      <form
        onSubmit={handlePlacesSearch}
        className="flex flex-col sm:flex-row gap-2.5"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={liveQuery}
            onChange={(e) => setLiveQuery(e.target.value)}
            placeholder={
              lang === 'id'
                ? 'Cari tempat spesifik via Google Places API (contoh: Cafe Kintamani, Beach Club Canggu, RS terdekat)...'
                : 'Search live places via Google Places API (e.g., Kintamani Cafe, Canggu Beach Club, ATM)...'
            }
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
          />
        </div>
        <button
          type="submit"
          disabled={searchingPlaces}
          className="rounded-xl bg-[#103828] px-5 py-2 text-xs font-semibold text-amber-50 hover:bg-[#174d38] transition"
        >
          {searchingPlaces
            ? lang === 'id'
              ? 'Mencari...'
              : 'Searching...'
            : lang === 'id'
              ? 'Cari di Google Places'
              : 'Search Places API'}
        </button>
      </form>

      {livePlaces.length > 0 && (
        <div className="rounded-xl border border-emerald-800/20 bg-emerald-950/5 dark:bg-emerald-950/20 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
              {lang === 'id'
                ? `Hasil Pencarian Google Places (${livePlaces.length})`
                : `Google Places Live Results (${livePlaces.length})`}
            </span>
            <button
              onClick={() => setLivePlaces([])}
              className="text-[11px] text-stone-500 hover:underline"
            >
              {lang === 'id' ? 'Tutup hasil' : 'Clear'}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {livePlaces.map((lp) => (
              <div
                key={lp.id}
                className="rounded-lg bg-white dark:bg-stone-800 p-2.5 border border-stone-200 dark:border-stone-700 text-xs"
              >
                <p className="font-semibold truncate">{lp.name}</p>
                <p className="text-[11px] text-stone-500 truncate">
                  {lp.formattedAddress}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-amber-700 dark:text-amber-400">
                    {lp.rating ? `★ ${lp.rating}` : 'Google Place'}
                  </span>
                  {lp.googleMapsUri && (
                    <a
                      href={lp.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline"
                    >
                      Maps ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split Map & Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 h-[480px] sm:h-[560px] rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-md relative bg-stone-200 dark:bg-stone-800">
          <Map
            defaultCenter={{ lat: -8.45, lng: 115.22 }}
            defaultZoom={10}
            gestureHandling="greedy"
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            className="h-full w-full"
          >
            {showTripRoute && tripWaypoints.length >= 2 && (
              <RoutePolylineOverlay waypoints={tripWaypoints} />
            )}

            {filteredDestinations.map((dest) => {
              const stopIndex = activeTrip.stops.findIndex(
                (s) => s.destinationId === dest.id
              );
              const isSelected = focusedDest?.id === dest.id;

              return (
                <AdvancedMarker
                  key={dest.id}
                  position={dest.coordinates}
                  onClick={() => setFocusedDest(dest)}
                  title={lang === 'en' ? dest.nameEn : dest.nameId}
                >
                  <div
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold shadow-md transition transform ${
                      isSelected
                        ? 'scale-110 bg-amber-500 text-stone-950 ring-2 ring-white'
                        : stopIndex >= 0
                          ? 'bg-[#C87D55] text-white ring-2 ring-amber-200'
                          : 'bg-[#103828] text-amber-50 hover:bg-[#19533c]'
                    }`}
                  >
                    {stopIndex >= 0 ? (
                      <span className="font-mono">#{stopIndex + 1}</span>
                    ) : (
                      <MapPin className="h-3 w-3 text-amber-300" />
                    )}
                    <span className="max-w-[115px] truncate">
                      {(lang === 'en' ? dest.nameEn : dest.nameId).split(' (')[0]}
                    </span>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>

          {routeMetrics && showTripRoute && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto rounded-xl bg-stone-900/90 px-4 py-2.5 text-xs text-amber-50 backdrop-blur-xs shadow-lg flex items-center gap-4">
              <div>
                <span className="text-stone-400 block text-[10px] uppercase">
                  {lang === 'id' ? 'Total Jarak Rute' : 'Total Route Distance'}
                </span>
                <span className="font-mono font-bold text-sm">
                  {routeMetrics.distanceKm} km
                </span>
              </div>
              <div className="border-l border-stone-700 pl-4">
                <span className="text-stone-400 block text-[10px] uppercase">
                  {lang === 'id' ? 'Estimasi Waktu' : 'Est. Duration'}
                </span>
                <span className="font-mono font-bold text-sm">
                  {Math.round(routeMetrics.durationMinutes / 60)}h{' '}
                  {routeMetrics.durationMinutes % 60}m
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right-Hand Destination Inspector & Directory */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {focusedDest && (
            <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-sm space-y-3">
              <DestinationVisual
                destination={focusedDest}
                theme={focusedDest.visualTheme}
                className="h-36 w-full rounded-xl"
                label={focusedDest.regency}
              />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                    {focusedDest.regency} • {focusedDest.subIsland}
                  </span>
                  <h2 className="font-serif text-lg font-bold leading-snug">
                    {lang === 'en' ? focusedDest.nameEn : focusedDest.nameId}
                  </h2>
                </div>
                <span className="font-mono text-xs font-semibold text-amber-800 dark:text-amber-300 shrink-0">
                  {focusedDest.ticketIDR.domestic === 0
                    ? lang === 'id'
                      ? 'Gratis'
                      : 'Free'
                    : formatMoney(focusedDest.ticketIDR.domestic)}
                </span>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3">
                {lang === 'en'
                  ? focusedDest.descriptionEn.overview
                  : focusedDest.descriptionId.overview}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => onSelectDestination(focusedDest, '360')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-800/30 bg-emerald-950/5 dark:bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-900 dark:text-emerald-300 hover:bg-emerald-950/10"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Explore 360°</span>
                </button>
                <button
                  onClick={() => onSelectDestination(focusedDest, 'details')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>{lang === 'id' ? 'Detail & Cuaca' : 'Guide & Weather'}</span>
                </button>
              </div>

              <button
                onClick={() => onAddToTrip(focusedDest)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#103828] px-4 py-2.5 text-xs font-semibold text-amber-50 hover:bg-[#174d38] transition"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {lang === 'id'
                    ? 'Tambahkan ke Urutan Rute'
                    : 'Add Stop to Active Route'}
                </span>
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 flex-1 max-h-[290px] overflow-y-auto space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              {lang === 'id'
                ? `Daftar Pin di Peta (${filteredDestinations.length})`
                : `Pinned Destinations (${filteredDestinations.length})`}
            </h3>
            {filteredDestinations.map((d) => (
              <button
                key={d.id}
                onClick={() => setFocusedDest(d)}
                className={`w-full text-left rounded-xl p-2.5 text-xs transition flex items-center justify-between gap-2 ${
                  focusedDest?.id === d.id
                    ? 'bg-emerald-950/10 dark:bg-emerald-950/40 font-semibold text-emerald-950 dark:text-amber-200'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <div className="truncate">
                  <p className="truncate">
                    {lang === 'en' ? d.nameEn : d.nameId}
                  </p>
                  <p className="text-[11px] text-stone-500">
                    {d.regency} • {d.openingHours}
                  </p>
                </div>
                <Navigation className="h-3.5 w-3.5 shrink-0 text-emerald-700" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
