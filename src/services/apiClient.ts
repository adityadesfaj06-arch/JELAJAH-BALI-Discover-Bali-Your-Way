import { useState, useEffect } from 'react';
import { WeatherSnapshot, SystemHealthTelemetry, Language } from '../types';

const clientWeatherCache = new Map<string, { data: WeatherSnapshot; expiresAt: number }>();

export function buildFallbackWeatherSnapshot(
  lat: number,
  lng: number,
  lang: Language = 'id'
): WeatherSnapshot {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}::${lang}`;
  const cached = clientWeatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const isHighland = lat > -8.38 && lng > 115.12 && lng < 115.45;
  const baseMax = isHighland ? 24 : 31;
  const baseMin = isHighland ? 17 : 25;
  const baseHumidity = isHighland ? 82 : 74;
  const baseRain = isHighland ? 35 : 20;
  const seed = Math.abs(Math.round((lat * 100 + lng * 100) % 7));

  const daysId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyForecast = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(Date.now() + idx * 86400000);
    const dayName = lang === 'en' ? daysEn[d.getDay()] : daysId[d.getDay()];
    const wave = ((idx + seed) % 3) - 1;
    const rainChancePercent = Math.min(
      85,
      Math.max(10, baseRain + wave * 12 + (idx % 2 === 0 ? 5 : -5))
    );
    return {
      date: d.toISOString().slice(0, 10),
      dayLabel:
        idx === 0
          ? lang === 'en'
            ? `Today (${dayName})`
            : `Hari Ini (${dayName})`
          : `${dayName}, ${d.getDate()}/${d.getMonth() + 1}`,
      minTempC: baseMin + (idx % 2 === 0 ? 0 : 1),
      maxTempC: baseMax + (wave === 1 ? 1 : wave === -1 ? -1 : 0),
      humidityPercent: Math.min(
        94,
        Math.max(62, baseHumidity + (rainChancePercent > 40 ? 6 : -3))
      ),
      rainChancePercent,
      condition:
        rainChancePercent >= 45
          ? lang === 'en'
            ? 'Passing Tropical Showers'
            : 'Hujan Ringan Sore'
          : isHighland
            ? lang === 'en'
              ? 'Partly Cloudy & Cool'
              : 'Berawan Sejuk'
            : lang === 'en'
              ? 'Sunny & Tropical Breeze'
              : 'Cerah Berawan',
      uvIndex: isHighland ? 7 : 9,
    };
  });

  return {
    tempC: isHighland ? 22 : 29,
    feelsLikeC: isHighland ? 23 : 32,
    condition:
      lang === 'id'
        ? isHighland
          ? 'Sejuk Berawan Pegunungan'
          : 'Cerah Berawan Tropis'
        : isHighland
          ? 'Cool Highland Breeze'
          : 'Tropical Partly Cloudy',
    humidity: isHighland ? 82 : 76,
    windKmh: isHighland ? 16 : 14,
    uvIndex: isHighland ? 7 : 8,
    rainChancePercent: isHighland ? 35 : 20,
    bestTimeNote:
      lang === 'id'
        ? 'Pagi hari (07:30–10:30) atau sore menjelang matahari terbenam (16:00–18:15).'
        : 'Early morning (07:30–10:30) or late afternoon before sunset (16:00–18:15).',
    isLiveApi: false,
    updatedAt: new Date().toISOString(),
    dailyForecast,
  };
}

export async function fetchDestinationWeather(
  lat: number,
  lng: number,
  lang: Language = 'id'
): Promise<WeatherSnapshot> {
  const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}::${lang}`;
  const cached = clientWeatherCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const res = await fetch(
      `/api/weather?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&lang=${lang}`
    );
    if (!res.ok) {
      throw new Error(`Weather request failed with ${res.status}`);
    }
    const data = (await res.json()) as WeatherSnapshot;
    clientWeatherCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    return data;
  } catch {
    return buildFallbackWeatherSnapshot(lat, lng, lang);
  }
}

export interface LivePlaceSearchResult {
  id: string;
  name: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
  googleMapsUri?: string;
}

export async function searchLiveGooglePlaces(
  queryText: string,
  lang: Language = 'id'
): Promise<{ places: LivePlaceSearchResult[]; isLiveApi: boolean }> {
  try {
    const res = await fetch('/api/places/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText, languageCode: lang }),
    });
    if (!res.ok) {
      return { places: [], isLiveApi: false };
    }
    return await res.json();
  } catch {
    return { places: [], isLiveApi: false };
  }
}

export interface ComputedRouteResult {
  distanceKm: number;
  durationMinutes: number;
  encodedPolyline?: string;
  isLiveApi: boolean;
}

export async function computeMultiStopRoute(
  waypoints: Array<{ lat: number; lng: number }>,
  travelMode: 'DRIVE' | 'TWO_WHEELER' = 'DRIVE'
): Promise<ComputedRouteResult> {
  try {
    const res = await fetch('/api/routes/compute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints, travelMode }),
    });
    if (!res.ok) {
      throw new Error(`Route API status ${res.status}`);
    }
    return await res.json();
  } catch {
    return {
      distanceKm: 0,
      durationMinutes: 0,
      isLiveApi: false,
    };
  }
}

export interface AiTravelAssistantResponse {
  reply: string;
  recommendedDestinationIds: string[];
  recommendedVehicleId?: string;
  estimatedTotalBudgetIDR?: number;
  isLiveGemini: boolean;
}

export async function askGeminiTravelAssistant(params: {
  prompt: string;
  lang: Language;
  durationDays?: number;
  travelerCount?: number;
  startArea?: string;
  interests?: string[];
}): Promise<AiTravelAssistantResponse> {
  const res = await fetch('/api/gemini/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`Assistant HTTP ${res.status}`);
  }
  return await res.json();
}

export async function fetchSystemTelemetry(): Promise<SystemHealthTelemetry> {
  const res = await fetch('/api/admin/telemetry');
  if (!res.ok) {
    throw new Error(`Telemetry HTTP ${res.status}`);
  }
  return await res.json();
}

export async function triggerCatalogRefresh24h(): Promise<{
  status: string;
  lastScheduledSync: string;
  nextScheduledSync: string;
  verifiedCount: number;
}> {
  const res = await fetch('/api/admin/refresh-24h', { method: 'POST' });
  return await res.json();
}

export async function triggerSystemAutoRecovery(): Promise<{
  status: string;
  recoveredAt: string;
  message: string;
}> {
  const res = await fetch('/api/admin/recover', { method: 'POST' });
  return await res.json();
}

export async function sendAnomalyAlertNotification(payload: {
  channel: 'slack' | 'email';
  target: string;
  subject: string;
  metricSummary: string;
}): Promise<{ delivered: boolean; mode: string; timestamp: string }> {
  const res = await fetch('/api/admin/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  return { isInstallable, promptInstall };
}
