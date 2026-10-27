import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  WifiOff,
  Compass,
  CameraOff,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';
import {
  Destination,
  DestinationPhotoBundle,
  DestinationPhotoMetadata,
  PhotoLoadState,
} from '../types';
import {
  resolveDestinationPhotoBundle,
  validatePhotoMatchesDestination,
} from '../services/destinationPhotoService';
import { usePWAInstall } from '../services/apiClient';
import { useTranslation } from '../i18n/useTranslation';

export function useDestinationPhotoBundle(destination?: Destination | null) {
  const [bundle, setBundle] = useState<DestinationPhotoBundle | null>(null);
  const [loadState, setLoadState] = useState<PhotoLoadState>('idle');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const loadPhotos = useCallback(
    async (forceRefresh = false, isAutoRefresh = false) => {
      if (!destination) {
        setBundle(null);
        setLoadState('idle');
        return;
      }

      const controller = new AbortController();
      setLoadState(isAutoRefresh ? 'refreshing' : 'loading');
      setActivePhotoIndex(0);

      try {
        const result = await resolveDestinationPhotoBundle(destination, {
          forceRefresh,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (
          result.status === 'ok' &&
          result.galleryPhotos.length > 0 &&
          validatePhotoMatchesDestination(result.galleryPhotos[0], destination)
            .valid
        ) {
          setBundle(result);
          setLoadState('loaded');
        } else {
          setBundle(result);
          setLoadState(result.status === 'error' ? 'failed' : 'unavailable');
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        setLoadState('unavailable');
      }

      return () => controller.abort();
    },
    [destination?.id, destination?.placeId]
  );

  useEffect(() => {
    if (!destination) {
      setBundle(null);
      setLoadState('idle');
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLoadState('loading');
    setActivePhotoIndex(0);
    setRetryCount(0);

    resolveDestinationPhotoBundle(destination, {
      forceRefresh: false,
      signal: controller.signal,
    })
      .then((result) => {
        if (cancelled) return;
        if (
          result.status === 'ok' &&
          result.galleryPhotos.length > 0 &&
          validatePhotoMatchesDestination(result.galleryPhotos[0], destination)
            .valid
        ) {
          setBundle(result);
          setLoadState('loaded');
        } else {
          setBundle(result);
          setLoadState(result.status === 'error' ? 'failed' : 'unavailable');
        }
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        setLoadState('unavailable');
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [destination?.id, destination?.placeId]);

  const handleImageError = useCallback(() => {
    if (!destination || !bundle) {
      setLoadState('unavailable');
      return;
    }

    // Try next verified photo of the SAME destination Place ID first
    if (activePhotoIndex + 1 < bundle.galleryPhotos.length) {
      setActivePhotoIndex((prev) => prev + 1);
      return;
    }

    setLoadState('unavailable');
  }, [destination, bundle, activePhotoIndex]);

  const handleManualRetry = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setRetryCount(0);
      loadPhotos(true, false);
    },
    [loadPhotos]
  );

  const currentPhoto: DestinationPhotoMetadata | null =
    bundle?.galleryPhotos?.[activePhotoIndex] || bundle?.heroPhoto || null;

  return {
    bundle,
    currentPhoto,
    galleryPhotos: bundle?.galleryPhotos || [],
    loadState,
    setLoadState,
    handleImageError,
    handleManualRetry,
  };
}

export const DestinationVisual: React.FC<{
  destination?: Destination | null;
  theme?:
    | 'coastal'
    | 'temple'
    | 'waterfall'
    | 'terrace'
    | 'mountain'
    | 'island'
    | 'village';
  className?: string;
  label?: string;
  eager?: boolean;
  showAttribution?: boolean;
  onOpenLightbox?: () => void;
}> = ({
  destination,
  className = 'h-48 w-full',
  label,
  eager = false,
  showAttribution = true,
  onOpenLightbox,
}) => {
  const { lang } = useTranslation();
  const {
    currentPhoto,
    loadState,
    handleImageError,
    handleManualRetry,
  } = useDestinationPhotoBundle(destination);
  const [imgRendered, setImgRendered] = useState(false);

  useEffect(() => {
    setImgRendered(false);
  }, [currentPhoto?.photoSourceUrl, destination?.id]);

  const isVerifiedPhoto =
    destination &&
    currentPhoto &&
    validatePhotoMatchesDestination(currentPhoto, destination).valid;

  const altText =
    currentPhoto
      ? lang === 'en'
        ? currentPhoto.altTextEn
        : currentPhoto.altTextId
      : destination
        ? lang === 'en'
          ? destination.altTextEn
          : destination.altTextId
        : 'Destinasi Wisata Bali';

  return (
    <div
      data-testid={
        destination ? `destination-visual-${destination.id}` : 'destination-visual'
      }
      data-photo-state={loadState}
      data-place-id={destination?.placeId || ''}
      className={`relative overflow-hidden bg-stone-900 ${className} select-none`}
    >
      {/* Loading / Refreshing Skeleton */}
      {(loadState === 'loading' ||
        loadState === 'refreshing' ||
        (loadState === 'loaded' && !imgRendered)) && (
        <div
          data-testid="photo-loading-skeleton"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-stone-800 via-stone-900 to-emerald-950 animate-pulse p-4 text-center"
        >
          <Compass className="h-6 w-6 text-amber-300/80 animate-spin mb-1.5" />
          <span className="text-[11px] font-medium text-stone-300">
            {loadState === 'refreshing'
              ? lang === 'id'
                ? 'Memperbarui referensi foto resmi...'
                : 'Refreshing verified photo reference...'
              : lang === 'id'
                ? 'Memuat foto lokasi terverifikasi...'
                : 'Loading verified location photo...'}
          </span>
        </div>
      )}

      {/* Loaded Verified Real Location Photo */}
      {loadState === 'loaded' && isVerifiedPhoto && currentPhoto && (
        <>
          <img
            key={`${destination.id}-${currentPhoto.id}`}
            src={currentPhoto.photoSourceUrl}
            alt={altText}
            loading={eager ? 'eager' : 'lazy'}
            decoding="sync"
            onLoad={(e) => {
              const imgEl = e.currentTarget;
              if (imgEl.naturalWidth > 0 && imgEl.naturalHeight > 0) {
                setImgRendered(true);
              } else {
                handleImageError();
              }
            }}
            onError={handleImageError}
            className="h-full w-full object-cover object-center"
          />

          {/* Subtle gradient legibility scrim */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* Verified Source & Photographer Attribution */}
          {showAttribution && imgRendered && (
            <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 max-w-[72%]">
              <span
                title={`${currentPhoto.photoLicense} — © ${currentPhoto.photoAuthor}`}
                className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-medium text-amber-100 backdrop-blur-xs truncate"
              >
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  {currentPhoto.photoProvider === 'google_places'
                    ? `Google Places • © ${currentPhoto.photoAuthor}`
                    : `Wikimedia (${currentPhoto.photoLicense}) • © ${currentPhoto.photoAuthor}`}
                </span>
              </span>
            </div>
          )}

          {onOpenLightbox && imgRendered && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox();
              }}
              aria-label={
                lang === 'id'
                  ? 'Perbesar foto di galeri'
                  : 'Open full photo in lightbox'
              }
              className="absolute bottom-2.5 right-2.5 z-20 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[10px] font-semibold text-white hover:bg-black/80 backdrop-blur-xs"
            >
              <Maximize2 className="h-3 w-3 text-amber-300" />
              <span>{lang === 'id' ? 'Perbesar' : 'Expand'}</span>
            </button>
          )}
        </>
      )}

      {/* Priority 4: Honest Safe Fallback when photo is unavailable or fails verification */}
      {(loadState === 'unavailable' ||
        loadState === 'failed' ||
        (!destination && loadState === 'idle')) && (
        <div
          data-testid="photo-safe-fallback"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-stone-900 via-[#103828] to-stone-900 p-4 text-center text-stone-100"
        >
          <CameraOff className="h-6 w-6 text-amber-300 mb-1.5 shrink-0" />
          <p className="text-xs font-bold text-amber-100">
            Foto destinasi belum tersedia.
          </p>
          {destination && (
            <p className="text-[10px] text-stone-300 mt-0.5 line-clamp-1">
              {lang === 'en' ? destination.nameEn : destination.nameId} ({destination.regency})
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            {destination?.googleMapsUrl && (
              <a
                href={destination.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-stone-950 hover:bg-amber-400 transition"
              >
                <ExternalLink className="h-3 w-3" />
                <span>
                  {lang === 'id'
                    ? 'Lihat di Google Maps'
                    : 'View on Google Maps'}
                </span>
              </a>
            )}
            {destination && (
              <button
                type="button"
                onClick={handleManualRetry}
                className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-white/20 transition"
              >
                <RefreshCw className="h-3 w-3" />
                <span>{lang === 'id' ? 'Coba Lagi' : 'Retry'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Location Label Badge */}
      {label && (
        <span className="pointer-events-none absolute bottom-2.5 left-3 z-20 inline-flex items-center gap-1 rounded bg-black/55 px-2 py-0.5 text-[11px] font-medium tracking-wide text-amber-100 backdrop-blur-xs">
          <Compass className="h-3 w-3 text-amber-300" />
          {label}
        </span>
      )}
    </div>
  );
};

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, promptInstall } = usePWAInstall();
  const { lang } = useTranslation();

  if (!isInstallable) return null;

  return (
    <button
      onClick={promptInstall}
      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-700/30 bg-emerald-900 px-3 py-1.5 text-xs font-medium text-amber-50 transition hover:bg-emerald-800"
      title={lang === 'id' ? 'Instal Aplikasi PWA' : 'Install PWA App'}
    >
      <Download className="h-3.5 w-3.5" />
      <span>{lang === 'id' ? 'Instal Aplikasi' : 'Install App'}</span>
    </button>
  );
};

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { lang } = useTranslation();

  useEffect(() => {
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-900 px-4 py-1.5 text-center text-xs font-medium text-amber-50 flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>
        {lang === 'id'
          ? 'Mode Luring (Offline) Aktif — Menampilkan katalog destinasi & rencana perjalanan tersimpan.'
          : 'Offline Mode Active — Showing cached Bali destination catalog & saved itineraries.'}
      </span>
    </div>
  );
};
