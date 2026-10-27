import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  CloudSun,
  Eye,
  Plus,
  Heart,
  ShieldAlert,
  Navigation,
  Sparkles,
  CheckCircle2,
  Droplets,
  CloudRain,
  Thermometer,
  Camera,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Car,
  Compass,
  BookOpen,
  Map as MapIcon,
  ArrowUpRight,
} from 'lucide-react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Destination, WeatherSnapshot } from '../types';
import { BALI_DESTINATIONS } from '../data/baliCatalog';
import {
  calculateHaversineKm,
  estimateTravelMinutes,
} from '../services/itineraryService';
import { useTranslation } from '../i18n/useTranslation';
import {
  buildFallbackWeatherSnapshot,
  fetchDestinationWeather,
} from '../services/apiClient';
import {
  DestinationVisual,
  useDestinationPhotoBundle,
} from './DestinationVisual';

interface DestinationModalProps {
  destination: Destination | null;
  onClose: () => void;
  onAddToTrip: (dest: Destination) => void;
  onToggleFavorite: (dest: Destination) => void;
  isFavorite: boolean;
  initialTab?: 'details' | '360';
  onSelectDestination?: (dest: Destination) => void;
}

export const DestinationModal: React.FC<DestinationModalProps> = ({
  destination,
  onClose,
  onAddToTrip,
  onToggleFavorite,
  isFavorite,
  initialTab = 'details',
  onSelectDestination,
}) => {
  const { lang, formatMoney } = useTranslation();
  const [activeTab, setActiveTab] = useState<'details' | '360'>(initialTab);
  const [weather, setWeather] = useState<WeatherSnapshot | null>(() =>
    destination
      ? buildFallbackWeatherSnapshot(
          destination.coordinates.lat,
          destination.coordinates.lng,
          lang
        )
      : null
  );
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Single unified vertical scroll container ref
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    galleryPhotos,
    loadState: photoLoadState,
    handleManualRetry: retryPhotos,
  } = useDestinationPhotoBundle(destination);

  const streetViewLib = useMapsLibrary('streetView');
  const panoContainerRef = useRef<HTMLDivElement | null>(null);
  const [panoStatus, setPanoStatus] = useState<
    'loading' | 'available' | 'unavailable'
  >('loading');

  // Lock body scroll while modal is open and restore cleanly on close/unmount
  useEffect(() => {
    if (!destination) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow || '';
    };
  }, [destination]);

  // Reset tab, lightbox, and scroll position to top when destination changes
  useEffect(() => {
    setActiveTab(initialTab);
    setLightboxIndex(null);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      scrollContainerRef.current.focus({ preventScroll: true });
    }
  }, [initialTab, destination?.id]);

  // Keyboard support for Modal Escape & Lightbox navigation
  useEffect(() => {
    if (!destination) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== null && galleryPhotos.length > 0) {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setLightboxIndex(null);
        } else if (e.key === 'ArrowRight') {
          setLightboxIndex((prev) =>
            prev === null ? 0 : (prev + 1) % galleryPhotos.length
          );
        } else if (e.key === 'ArrowLeft') {
          setLightboxIndex((prev) =>
            prev === null
              ? 0
              : (prev - 1 + galleryPhotos.length) % galleryPhotos.length
          );
        }
        return;
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [destination, lightboxIndex, galleryPhotos.length, onClose]);

  useEffect(() => {
    if (!destination) return;
    let cancelled = false;
    setWeather(
      buildFallbackWeatherSnapshot(
        destination.coordinates.lat,
        destination.coordinates.lng,
        lang
      )
    );
    setLoadingWeather(false);
    fetchDestinationWeather(
      destination.coordinates.lat,
      destination.coordinates.lng,
      lang
    ).then((data) => {
      if (!cancelled) setWeather(data);
    });
    return () => {
      cancelled = true;
    };
  }, [destination, lang]);

  useEffect(() => {
    if (!destination || activeTab !== '360') return;
    if (!streetViewLib || !panoContainerRef.current) {
      setPanoStatus('unavailable');
      return;
    }

    setPanoStatus('loading');
    const svService = new streetViewLib.StreetViewService();
    const targetLatLng = {
      lat: destination.streetViewConfig.lat,
      lng: destination.streetViewConfig.lng,
    };

    svService.getPanorama(
      {
        location: targetLatLng,
        radius: 350,
        source: google.maps.StreetViewSource.DEFAULT,
      },
      (data, status) => {
        if (
          status === google.maps.StreetViewStatus.OK &&
          data?.location?.latLng &&
          panoContainerRef.current
        ) {
          setPanoStatus('available');
          new streetViewLib.StreetViewPanorama(panoContainerRef.current, {
            position: data.location.latLng,
            pov: {
              heading: destination.streetViewConfig.heading || 180,
              pitch: destination.streetViewConfig.pitch || 0,
            },
            zoom: 1,
            addressControl: true,
            fullscreenControl: true,
            motionTrackingControl: true,
          });
        } else {
          setPanoStatus('unavailable');
        }
      }
    );
  }, [destination, activeTab, streetViewLib]);

  // Compute nearby destinations sorted by real geographic distance
  const nearbyDestinations = useMemo(() => {
    if (!destination) return [];
    return BALI_DESTINATIONS.filter((d) => d.id !== destination.id)
      .map((d) => ({
        dest: d,
        distanceKm: calculateHaversineKm(
          destination.coordinates,
          d.coordinates
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [destination]);

  // Compute distance from main hubs (Denpasar / Kuta & Ubud)
  const hubDistances = useMemo(() => {
    if (!destination) return { kutaKm: 0, ubudKm: 0, kutaMin: 0, ubudMin: 0 };
    const kutaCoords = { lat: -8.7233, lng: 115.1723 };
    const ubudCoords = { lat: -8.5069, lng: 115.2625 };
    const crossesIsland = destination.subIsland !== 'Mainland Bali';
    const kutaKm = Math.round(
      calculateHaversineKm(kutaCoords, destination.coordinates)
    );
    const ubudKm = Math.round(
      calculateHaversineKm(ubudCoords, destination.coordinates)
    );
    return {
      kutaKm,
      ubudKm,
      kutaMin: estimateTravelMinutes(kutaKm, crossesIsland),
      ubudMin: estimateTravelMinutes(ubudKm, crossesIsland),
    };
  }, [destination]);

  if (!destination) return null;

  const desc =
    lang === 'en' ? destination.descriptionEn : destination.descriptionId;
  const title = lang === 'en' ? destination.nameEn : destination.nameId;
  const activeLightboxPhoto =
    lightboxIndex !== null ? galleryPhotos[lightboxIndex] || null : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-0 sm:p-4 md:p-6 backdrop-blur-xs overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destination-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Full-Screen Interactive Photo Lightbox */}
      {activeLightboxPhoto && lightboxIndex !== null && (
        <div
          data-testid="destination-lightbox"
          role="dialog"
          aria-label={
            lang === 'id'
              ? `Galeri Foto ${destination.nameId}`
              : `${destination.nameEn} Photo Lightbox`
          }
          className="fixed inset-0 z-[70] flex flex-col items-center justify-between bg-black/95 p-4 sm:p-6 text-white"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-6xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-300 truncate">
                {title} ({lightboxIndex + 1} / {galleryPhotos.length})
              </p>
              <p className="text-[11px] text-stone-300 truncate">
                {activeLightboxPhoto.photoCaption}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label={
                lang === 'id' ? 'Tutup galeri foto' : 'Close photo lightbox'
              }
              className="rounded-full bg-white/15 p-2 text-white hover:bg-white/30 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-3 overflow-hidden">
            {galleryPhotos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex(
                    (lightboxIndex - 1 + galleryPhotos.length) %
                      galleryPhotos.length
                  )
                }
                aria-label={
                  lang === 'id' ? 'Foto sebelumnya' : 'Previous photo'
                }
                className="absolute left-2 z-20 rounded-full bg-black/65 p-2.5 text-white hover:bg-black/90 transition"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img
              src={activeLightboxPhoto.photoSourceUrl}
              alt={
                lang === 'en'
                  ? activeLightboxPhoto.altTextEn
                  : activeLightboxPhoto.altTextId
              }
              className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-2xl"
            />

            {galleryPhotos.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxIndex((lightboxIndex + 1) % galleryPhotos.length)
                }
                aria-label={lang === 'id' ? 'Foto berikutnya' : 'Next photo'}
                className="absolute right-2 z-20 rounded-full bg-black/65 p-2.5 text-white hover:bg-black/90 transition"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-3 text-xs text-stone-300">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-emerald-900/70 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                <CheckCircle2 className="h-3 w-3" />
                {activeLightboxPhoto.validationStatus === 'verified_place_id'
                  ? `Terverifikasi Place ID (${activeLightboxPhoto.placeId})`
                  : 'Wikimedia Commons (Tinjauan Metadata)'}
              </span>
              <span>
                {lang === 'id'
                  ? 'Sumber & Fotografer:'
                  : 'Source & Photographer:'}{' '}
                <strong>© {activeLightboxPhoto.photoAuthor}</strong> (
                {activeLightboxPhoto.photoLicense})
              </span>
            </div>
            {activeLightboxPhoto.photoAuthorUrl && (
              <a
                href={activeLightboxPhoto.photoAuthorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-amber-300 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>
                  {lang === 'id'
                    ? 'Tautan Atribusi Resmi'
                    : 'Official Attribution Link'}
                </span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONTAINER USING h-full AND flex flex-col TO PREVENT CONTENT CLIPPING */}
      <div
        data-testid="destination-modal-container"
        className="relative w-full max-w-5xl h-full max-h-[100dvh] sm:max-h-[92dvh] flex flex-col overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border border-stone-200 dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xl"
      >
        {/* Top Navigation Bar — Always accessible above the unified scroll body */}
        <div className="shrink-0 z-40 flex items-center justify-between gap-2 bg-[#070708]/95 px-4 sm:px-6 py-2.5 text-stone-100 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 shrink-0">
              <MapPin className="h-3 w-3" />
              {destination.regency}
            </span>
            <span className="font-serif text-sm sm:text-base font-bold text-white truncate">
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'details'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              {lang === 'id' ? 'Full Guide' : 'Full Guide'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('360')}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === '360'
                  ? 'bg-emerald-500 text-stone-950'
                  : 'bg-white/10 text-stone-200 hover:bg-white/20'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">Explore in 360°</span>
              <span className="xs:hidden">360°</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-full bg-white/15 p-1.5 text-white hover:bg-rose-600 transition ml-1"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>

        {/* UNIFIED VERTICAL SCROLL CONTAINER ON MAIN MODAL BODY WRAPPER */}
        <div
          ref={scrollContainerRef}
          tabIndex={-1}
          data-testid="destination-modal-scroll-container"
          className="flex-1 min-h-0 h-full overflow-y-auto overflow-x-hidden overscroll-contain scroll-smooth flex flex-col focus:outline-none"
        >
          {/* Hero Section — Shares the unified vertical scroll flow */}
          <div
            data-testid="destination-hero-section"
            className="relative shrink-0 h-[265px] sm:h-[290px] lg:h-[330px] w-full overflow-hidden bg-stone-950"
          >
            <DestinationVisual
              destination={destination}
              theme={destination.visualTheme}
              className="h-full w-full"
              eager={true}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 z-20 p-4 sm:p-6 flex flex-col md:flex-row md:items-end justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-amber-300">
                  {destination.area} — {destination.regency} •{' '}
                  {destination.subIsland}
                </p>
                <h2
                  id="destination-modal-title"
                  className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight"
                >
                  {title}
                </h2>
                <p className="text-xs text-stone-300 line-clamp-1">
                  {destination.address}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {galleryPhotos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-black/60 border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-black/80 transition backdrop-blur-xs"
                  >
                    <Camera className="h-3.5 w-3.5 text-amber-300" />
                    <span>{lang === 'id' ? 'Layar Penuh' : 'Fullscreen'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                    activeTab === 'details'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'bg-black/60 border border-white/20 text-white hover:bg-black/80'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>
                    {lang === 'id' ? 'Panduan & Galeri' : 'Guide & Gallery'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('360')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
                    activeTab === '360'
                      ? 'bg-emerald-500 text-stone-950 shadow-sm'
                      : 'bg-black/60 border border-white/20 text-white hover:bg-black/80'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Explore in 360°</span>
                </button>
              </div>
            </div>
          </div>

          {/* Details and Cards — Shares the same unified scroll flow */}
          <div className="shrink-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === '360' ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-800/20 bg-emerald-950/5 dark:bg-emerald-950/30 p-4 text-xs">
                <div>
                  <span className="font-semibold text-emerald-900 dark:text-emerald-300">
                    {lang === 'id'
                      ? 'Mode Eksplorasi Panorama 360° Interaktif (Terpisah dari Foto Biasa)'
                      : 'Interactive 360° Street View Panorama (Distinct from Standard Photos)'}
                  </span>
                  <p className="text-stone-600 dark:text-stone-400 mt-0.5">
                    {lang === 'id'
                      ? 'Gunakan mouse atau sentuhan jari untuk memutar pandangan 360° di lokasi sesungguhnya.'
                      : 'Drag or swipe to look around 360° at the verified destination coordinates.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('details')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 hover:bg-amber-400"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'id' ? 'Kembali ke Panduan' : 'Back to Guide'}
                    </span>
                  </button>
                  <a
                    href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${destination.coordinates.lat},${destination.coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'id'
                        ? 'Buka Street View di Google Maps'
                        : 'Open Street View in Google Maps'}
                    </span>
                  </a>
                </div>
              </div>

              <div className="relative h-[340px] sm:h-[440px] w-full rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-stone-900">
                <div ref={panoContainerRef} className="h-full w-full" />
                {panoStatus === 'unavailable' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-stone-900/95 text-stone-200 space-y-3">
                    <Eye className="h-8 w-8 text-amber-300" />
                    <p className="text-sm font-bold text-amber-300">
                      {lang === 'id'
                        ? 'Panorama 360° interaktif belum tersedia langsung pada titik koordinat ini.'
                        : 'Interactive 360° panorama is not directly available at this coordinate point.'}
                    </p>
                    <p className="max-w-md text-xs text-stone-400">
                      {lang === 'id'
                        ? 'Sesuai standar akurasi Jelajah Bali, kami tidak menampilkan foto datar biasa sebagai pengganti panorama 360°. Silakan buka Galeri Foto Terverifikasi atau tautan Google Maps.'
                        : 'To preserve visual honesty, we never substitute a flat photo as a 360° panorama. View the Verified Photo Gallery or open Google Maps directly.'}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-stone-950 hover:bg-amber-400"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>
                          {lang === 'id'
                            ? 'Lihat Galeri Foto Terverifikasi'
                            : 'View Verified Photo Gallery'}
                        </span>
                      </button>
                      <a
                        href={destination.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Google Maps</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 1. Core Info Cards: Opening Hours & Stay, Verified Ticket Price, Current Weather */}
              <div
                data-testid="destination-key-info-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-800/70 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>
                        {lang === 'id'
                          ? 'Jam Operasional & Durasi'
                          : 'Opening Hours & Stay'}
                      </span>
                    </div>
                    <p className="mt-2 font-mono text-sm font-bold text-stone-900 dark:text-stone-100">
                      {destination.openingHours}
                    </p>
                    <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                      {lang === 'id'
                        ? 'Rekomendasi durasi:'
                        : 'Recommended stay:'}{' '}
                      <strong>
                        {destination.recommendedDurationMinutes} min
                      </strong>
                    </p>
                  </div>
                  <p className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-700/70 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                    {lang === 'id' ? 'Waktu Terbaik:' : 'Best Time:'}{' '}
                    {destination.bestTimeWindow}
                  </p>
                </div>

                <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-800/70 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      <span>
                        {lang === 'id'
                          ? 'Harga Tiket Resmi'
                          : 'Verified Ticket Price'}
                      </span>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    </div>
                    <div className="mt-2 space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="text-stone-600 dark:text-stone-400">
                          {lang === 'id'
                            ? 'Wisatawan Domestik:'
                            : 'Domestic Visitor:'}
                        </span>
                        <span className="font-mono font-bold">
                          {destination.ticketIDR.domestic === 0
                            ? lang === 'id'
                              ? 'Gratis'
                              : 'Free'
                            : formatMoney(destination.ticketIDR.domestic)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-stone-600 dark:text-stone-400">
                          {lang === 'id'
                            ? 'Wisatawan Mancanegara:'
                            : 'International:'}
                        </span>
                        <span className="font-mono font-bold">
                          {destination.ticketIDR.international === 0
                            ? lang === 'id'
                              ? 'Gratis'
                              : 'Free'
                            : formatMoney(destination.ticketIDR.international)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-[11px] text-stone-500 mt-2 pt-2 border-t border-stone-100 dark:border-stone-700/70">
                    <span>
                      {lang === 'id' ? 'Parkir Motor / Mobil:' : 'Parking:'}
                    </span>
                    <span className="font-mono">
                      {formatMoney(destination.ticketIDR.parkingMotorIDR)} /{' '}
                      {formatMoney(destination.ticketIDR.parkingCarIDR)}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-800/70 p-4 flex flex-col justify-between md:col-span-2 lg:col-span-1">
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-sky-800 dark:text-sky-400">
                      <span className="inline-flex items-center gap-1.5">
                        <CloudSun className="h-4 w-4 shrink-0" />
                        {lang === 'id' ? 'Cuaca Saat Ini' : 'Current Weather'}
                      </span>
                      <span className="text-[10px] font-normal text-stone-500">
                        {weather?.isLiveApi
                          ? 'Google Weather API'
                          : 'Regional Met'}
                      </span>
                    </div>
                    {loadingWeather || !weather ? (
                      <p className="mt-2 text-xs text-stone-500">
                        {lang === 'id'
                          ? 'Memuat data cuaca...'
                          : 'Loading weather...'}
                      </p>
                    ) : (
                      <div className="mt-2">
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono text-2xl font-bold">
                            {weather.tempC}°C
                          </span>
                          <span className="text-xs font-medium text-stone-600 dark:text-stone-300">
                            {weather.condition}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {weather && !loadingWeather && (
                    <p className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-700/70 text-[11px] text-stone-500">
                      {lang === 'id' ? 'Peluang Hujan:' : 'Rain Chance:'}{' '}
                      <strong>{weather.rainChancePercent}%</strong> • UV{' '}
                      <strong>{weather.uvIndex}</strong> • {weather.humidity}%
                      RH
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Verified Multi-Angle Destination Photo Gallery */}
              <div
                data-testid="destination-photo-gallery"
                className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-800/70 p-4 sm:p-5 space-y-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300">
                      <Camera className="h-4 w-4 text-emerald-700 dark:text-amber-400" />
                      <span>
                        {lang === 'id'
                          ? `Galeri Foto Lokasi Terverifikasi (${galleryPhotos.length})`
                          : `Verified Location Photo Gallery (${galleryPhotos.length})`}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      Place ID:{' '}
                      <code className="font-mono">{destination.placeId}</code> •{' '}
                      {lang === 'id'
                        ? 'Klik foto untuk membuka tampilan penuh & atribusi fotografer'
                        : 'Click any photo for full-screen lightbox & photographer attribution'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={destination.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Google Maps</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => retryPhotos()}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 px-2.5 py-1.5 text-[11px] font-semibold hover:bg-stone-100 dark:hover:bg-stone-700"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>{lang === 'id' ? 'Segarkan Foto' : 'Refresh'}</span>
                    </button>
                  </div>
                </div>

                {galleryPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                    {galleryPhotos.map((photo, idx) => (
                      <button
                        key={photo.id}
                        type="button"
                        data-testid={`gallery-thumb-${idx}`}
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative aspect-video overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-900 text-left focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      >
                        <img
                          src={photo.photoSourceUrl}
                          alt={
                            lang === 'en' ? photo.altTextEn : photo.altTextId
                          }
                          loading="eager"
                          decoding="sync"
                          onError={(e) => {
                            const fallbackSrc = galleryPhotos[0]?.photoSourceUrl;
                            if (
                              fallbackSrc &&
                              e.currentTarget.src !==
                                new URL(fallbackSrc, window.location.origin).href
                            ) {
                              e.currentTarget.src = fallbackSrc;
                            }
                          }}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent absolute" />
                        <span className="absolute bottom-1 left-1.5 right-1.5 truncate text-[10px] font-medium text-amber-100">
                          © {photo.photoAuthor}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-stone-300 dark:border-stone-700 p-4 text-center text-xs text-stone-500">
                    {photoLoadState === 'loading' ||
                    photoLoadState === 'refreshing'
                      ? lang === 'id'
                        ? 'Sedang memuat galeri foto terverifikasi...'
                        : 'Loading verified photo gallery...'
                      : 'Foto destinasi belum tersedia.'}
                  </div>
                )}
              </div>

              {/* 3. 7-Day Daily Weather Forecast Widget */}
              <div
                data-testid="daily-weather-forecast-widget"
                className="rounded-xl border border-sky-200/80 dark:border-sky-900/50 bg-white dark:bg-stone-800/70 p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-700/70 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-900 dark:text-sky-300">
                      <CloudSun className="h-4 w-4 text-sky-600" />
                      <span>
                        {lang === 'id'
                          ? 'Daily Weather Forecast — Prakiraan 7 Hari ke Depan'
                          : 'Daily Weather Forecast — 7-Day Area Outlook'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                      {destination.area}, {destination.regency} (
                      {destination.coordinates.lat.toFixed(4)},{' '}
                      {destination.coordinates.lng.toFixed(4)})
                    </p>
                  </div>
                  <span className="rounded-md bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 text-[11px] font-mono font-semibold text-sky-800 dark:text-sky-300">
                    {weather?.isLiveApi
                      ? 'Google Maps Weather API (7-Day)'
                      : lang === 'id'
                        ? 'Estimasi Meteorologi Regional (7 Hari)'
                        : 'Regional Meteorological Model (7-Day)'}
                  </span>
                </div>

                {loadingWeather || !weather?.dailyForecast ? (
                  <p className="text-xs text-stone-500 py-3">
                    {lang === 'id'
                      ? 'Memuat prakiraan cuaca 7 hari...'
                      : 'Loading 7-day weather forecast...'}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                      {weather.dailyForecast.slice(0, 7).map((day) => (
                        <div
                          key={day.date}
                          className="rounded-xl border border-stone-200/70 dark:border-stone-700/80 bg-[#FAF7F2]/70 dark:bg-stone-900/60 p-2.5 flex flex-col justify-between gap-2 text-xs"
                        >
                          <div>
                            <p className="font-bold text-stone-900 dark:text-stone-100 truncate">
                              {day.dayLabel}
                            </p>
                            <p
                              className="text-[10px] text-stone-500 line-clamp-1 mt-0.5"
                              title={day.condition}
                            >
                              {day.condition}
                            </p>
                          </div>

                          <div className="space-y-1.5 pt-1 border-t border-stone-200/60 dark:border-stone-800">
                            <div
                              className="flex items-center justify-between font-mono"
                              title={
                                lang === 'id'
                                  ? 'Suhu Maks / Min'
                                  : 'Max / Min Temperature'
                              }
                            >
                              <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                                <Thermometer className="h-3 w-3 text-amber-600" />
                                {lang === 'id' ? 'Suhu' : 'Temp'}
                              </span>
                              <span className="font-bold text-stone-900 dark:text-amber-200">
                                {day.maxTempC}°/{day.minTempC}°C
                              </span>
                            </div>

                            <div
                              className="flex items-center justify-between font-mono"
                              title={
                                lang === 'id'
                                  ? 'Kelembapan Udara'
                                  : 'Relative Humidity'
                              }
                            >
                              <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                                <Droplets className="h-3 w-3 text-sky-600" />
                                {lang === 'id' ? 'Lembap' : 'Humidity'}
                              </span>
                              <span className="font-semibold text-stone-700 dark:text-stone-300">
                                {day.humidityPercent}%
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div
                                className="flex items-center justify-between font-mono"
                                title={
                                  lang === 'id'
                                    ? 'Peluang Hujan'
                                    : 'Chance of Rain'
                                }
                              >
                                <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
                                  <CloudRain className="h-3 w-3 text-indigo-600" />
                                  {lang === 'id' ? 'Hujan' : 'Rain'}
                                </span>
                                <span
                                  className={`font-bold ${
                                    day.rainChancePercent >= 45
                                      ? 'text-indigo-700 dark:text-indigo-300'
                                      : 'text-emerald-800 dark:text-emerald-400'
                                  }`}
                                >
                                  {day.rainChancePercent}%
                                </span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    day.rainChancePercent >= 45
                                      ? 'bg-indigo-600'
                                      : 'bg-sky-500'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, Math.max(5, day.rainChancePercent))}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 pt-0.5">
                      Google Maps
                    </p>
                  </>
                )}
              </div>

              {/* 4. Comprehensive Destination Guide (Description, Activities, Practical Tips, Etiquette & Safety) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-white dark:bg-stone-800/60 p-4 sm:p-5 border border-stone-200/70 dark:border-stone-800 space-y-2.5">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-emerald-950 dark:text-amber-200">
                    1.{' '}
                    {lang === 'id'
                      ? 'Deskripsi & Keunikan Destinasi'
                      : 'Overview & Uniqueness'}
                  </h3>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-xs sm:text-sm">
                    {desc.overview}
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400 pt-1">
                    <strong>
                      {lang === 'id'
                        ? 'Daya Tarik Khas:'
                        : 'What Makes It Unique:'}
                    </strong>{' '}
                    {desc.uniqueness}
                  </p>
                </div>

                <div className="rounded-xl bg-white dark:bg-stone-800/60 p-4 sm:p-5 border border-stone-200/70 dark:border-stone-800 space-y-2.5">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-emerald-950 dark:text-amber-200">
                    2.{' '}
                    {lang === 'id'
                      ? 'Aktivitas Wisata & Alasan Berkunjung'
                      : 'Activities & Why Visit'}
                  </h3>
                  <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                    {desc.activities.map((act, idx) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-stone-600 dark:text-stone-400 pt-1">
                    <strong>
                      {lang === 'id'
                        ? 'Mengapa Layak Dikunjungi:'
                        : 'Why Visit:'}
                    </strong>{' '}
                    {desc.whyVisit}
                  </p>
                </div>

                <div className="rounded-xl bg-white dark:bg-stone-800/60 p-4 sm:p-5 border border-stone-200/70 dark:border-stone-800 space-y-2.5">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-emerald-950 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>
                      3.{' '}
                      {lang === 'id'
                        ? 'Tips Perjalanan & Aksesibilitas'
                        : 'Travel Tips & Accessibility'}
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
                    {desc.practicalTips}
                  </p>
                  <p className="text-xs text-stone-500 pt-1">
                    <strong>
                      {lang === 'id' ? 'Aksesibilitas:' : 'Accessibility:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? destination.accessibilityNotesEn
                      : destination.accessibilityNotesId}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/20 p-4 sm:p-5 border border-amber-300/60 dark:border-amber-800/50 space-y-2.5">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-700 shrink-0" />
                    <span>
                      4.{' '}
                      {lang === 'id'
                        ? 'Etika Budaya & Keselamatan'
                        : 'Cultural Etiquette & Safety'}
                    </span>
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-950/90 dark:text-amber-100/90 leading-relaxed">
                    {desc.etiquetteAndSafety}
                  </p>
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 pt-1">
                    <strong>
                      {lang === 'id' ? 'Catatan Tiket:' : 'Ticket Notes:'}
                    </strong>{' '}
                    {lang === 'en'
                      ? destination.ticketIDR.notesEn
                      : destination.ticketIDR.notesId}
                  </p>
                </div>
              </div>

              {/* 5. Map, Coordinates & Transport Access Section */}
              <div
                data-testid="destination-map-transport-section"
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-800/70 p-4 sm:p-5"
              >
                <div className="lg:col-span-6 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300">
                    <MapIcon className="h-4 w-4 text-emerald-700 dark:text-amber-400" />
                    <span>
                      {lang === 'id'
                        ? 'Peta Lokasi & Navigasi GPS'
                        : 'Location Map & GPS Navigation'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    <strong>{lang === 'id' ? 'Alamat:' : 'Address:'}</strong>{' '}
                    {destination.address}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
                    <span className="rounded-md bg-stone-100 dark:bg-stone-900 px-2.5 py-1">
                      Lat: {destination.coordinates.lat.toFixed(4)}
                    </span>
                    <span className="rounded-md bg-stone-100 dark:bg-stone-900 px-2.5 py-1">
                      Lng: {destination.coordinates.lng.toFixed(4)}
                    </span>
                    <span className="rounded-md bg-stone-100 dark:bg-stone-900 px-2.5 py-1">
                      {destination.subIsland}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={destination.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#103828] px-3.5 py-2 text-xs font-semibold text-amber-50 hover:bg-[#174d38] transition"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>
                        {lang === 'id'
                          ? 'Petunjuk Arah di Google Maps'
                          : 'Directions in Google Maps'}
                      </span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setActiveTab('360')}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-700 transition"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-700 dark:text-amber-300" />
                      <span>
                        {lang === 'id'
                          ? 'Lihat Street View 360°'
                          : 'View 360° Street View'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-6 space-y-3 border-t lg:border-t-0 lg:border-l border-stone-200/70 dark:border-stone-700/70 pt-3 lg:pt-0 lg:pl-5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300">
                    <Car className="h-4 w-4 text-emerald-700 dark:text-amber-400" />
                    <span>
                      {lang === 'id'
                        ? 'Informasi Transportasi & Estimasi Jarak'
                        : 'Transport & Access Information'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg bg-[#FAF7F2] dark:bg-stone-900/70 p-2.5 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[11px] text-stone-500 block">
                        {lang === 'id'
                          ? 'Dari Kuta / Bandara:'
                          : 'From Kuta / Airport:'}
                      </span>
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                        ~{hubDistances.kutaKm} km ({hubDistances.kutaMin} min)
                      </span>
                    </div>
                    <div className="rounded-lg bg-[#FAF7F2] dark:bg-stone-900/70 p-2.5 border border-stone-200/60 dark:border-stone-800">
                      <span className="text-[11px] text-stone-500 block">
                        {lang === 'id'
                          ? 'Dari Pusat Ubud:'
                          : 'From Central Ubud:'}
                      </span>
                      <span className="font-mono font-bold text-stone-900 dark:text-stone-100">
                        ~{hubDistances.ubudKm} km ({hubDistances.ubudMin} min)
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                    {destination.subIsland !== 'Mainland Bali'
                      ? lang === 'id'
                        ? `Destinasi ini berada di ${destination.subIsland}. Memerlukan penyeberangan fast boat dari Pelabuhan Sanur atau Kusamba (~35–45 menit) dilanjutkan sewa motor/mobil lokal.`
                        : `Located on ${destination.subIsland}. Requires a fast boat crossing from Sanur or Kusamba harbor (~35–45 mins) followed by local car/scooter transfer.`
                      : lang === 'id'
                        ? 'Dapat diakses dengan sepeda motor maupun mobil pribadi/sewa dengan sopir. Gunakan fitur Smart Trip Planner untuk menggabungkan destinasi searah dan menghitung BBM.'
                        : 'Accessible by scooter or private car with driver. Add to Smart Trip Planner to optimize multi-stop routing and fuel estimates.'}
                  </p>
                </div>
              </div>

              {/* 6. Nearby Destinations Recommendations */}
              {nearbyDestinations.length > 0 && (
                <div
                  data-testid="destination-nearby-section"
                  className="rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-800/70 p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-amber-300">
                      <Compass className="h-4 w-4 text-emerald-700 dark:text-amber-400" />
                      <span>
                        {lang === 'id'
                          ? 'Rekomendasi Destinasi Sekitar (Searah)'
                          : 'Nearby Destinations to Combine'}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      {lang === 'id'
                        ? 'Diurutkan berdasarkan jarak terdekat'
                        : 'Sorted by closest distance'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {nearbyDestinations.map(({ dest, distanceKm }) => (
                      <div
                        key={dest.id}
                        className="rounded-xl border border-stone-200/70 dark:border-stone-700/80 bg-[#FAF7F2]/60 dark:bg-stone-900/60 p-3 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span className="truncate">{dest.regency}</span>
                            <span className="font-mono font-semibold text-emerald-700 dark:text-amber-300 shrink-0">
                              {distanceKm.toFixed(1)} km
                            </span>
                          </div>
                          <h4 className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 mt-0.5 line-clamp-1">
                            {lang === 'en' ? dest.nameEn : dest.nameId}
                          </h4>
                          <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 mt-1">
                            {lang === 'en'
                              ? dest.descriptionEn.overview
                              : dest.descriptionId.overview}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800">
                          {onSelectDestination ? (
                            <button
                              type="button"
                              onClick={() => onSelectDestination(dest)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-amber-300 hover:underline"
                            >
                              <span>
                                {lang === 'id' ? 'Lihat Detail' : 'View Detail'}
                              </span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-stone-500">
                              {formatMoney(dest.ticketIDR.domestic)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => onAddToTrip(dest)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#103828] px-2.5 py-1 text-[11px] font-semibold text-amber-50 hover:bg-[#174d38]"
                          >
                            <Plus className="h-3 w-3" />
                            <span>{lang === 'id' ? 'Rute' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Verification Metadata Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-stone-100 dark:bg-stone-800/40 px-4 py-3 text-xs text-stone-600 dark:text-stone-400">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span>{destination.address}</span>
                </div>
                <span className="font-mono text-[11px]">
                  {destination.dataSource} ({destination.lastChecked})
                </span>
              </div>
            </>
          )}

          {/* Action Bar — Inside the unified vertical scroll container with comfortable bottom spacing */}
          <div
            data-testid="destination-modal-footer-actions"
            className="border-t border-stone-200 dark:border-stone-800 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3"
          >
            <button
              type="button"
              onClick={() => onToggleFavorite(destination)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition ${
                isFavorite
                  ? 'border-rose-300 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  : 'border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700'
              }`}
            >
              <Heart
                className={`h-4 w-4 ${
                  isFavorite ? 'fill-rose-600 text-rose-600' : ''
                }`}
              />
              <span>
                {isFavorite
                  ? lang === 'id'
                    ? 'Tersimpan di Favorit'
                    : 'Saved in Favorites'
                  : lang === 'id'
                    ? 'Simpan ke Favorit'
                    : 'Save to Favorites'}
              </span>
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
              >
                {lang === 'id' ? 'Tutup' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onAddToTrip(destination);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#103828] px-5 py-2.5 text-xs font-semibold text-amber-50 hover:bg-[#174d38] transition shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>
                  {lang === 'id'
                    ? 'Tambahkan ke Rencana Perjalanan'
                    : 'Add to Trip Planner'}
                </span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
