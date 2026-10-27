import {
  Destination,
  DestinationPhotoBundle,
  DestinationPhotoMetadata,
} from '../types';

export interface PlaceIdentityRule {
  destinationId: string;
  verifiedPlaceId: string;
  regency: string;
  subIsland: string;
  forbiddenTokens: string[];
  requiredTokens: string[];
}

export const VERIFIED_PLACE_IDENTITY_RULES: Record<string, PlaceIdentityRule> = {
  'pura-uluwatu': {
    destinationId: 'pura-uluwatu',
    verifiedPlaceId: 'ChIJkYHLIPxP0i0RlQTbpxuNuQw',
    regency: 'Badung',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tanah lot', 'ulun danu', 'beratan', 'besakih', 'tirta empul', 'kelingking'],
    requiredTokens: ['uluwatu', 'pecatu', 'badung'],
  },
  'pantai-melasti': {
    destinationId: 'pantai-melasti',
    verifiedPlaceId: 'ChIJf6d0f5Nb0i0Rq_tEZeZB_Nc',
    regency: 'Badung',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['kelingking', 'nusa penida', 'diamond beach', 'lembongan', 'lovina', 'medewi'],
    requiredTokens: ['melasti', 'ungasan', 'badung'],
  },
  'pantai-jimbaran': {
    destinationId: 'pantai-jimbaran',
    verifiedPlaceId: 'ChIJBV2KW_NE0i0ROKlKpKZNLdQ',
    regency: 'Badung',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['kelingking', 'sanur', 'lovina', 'medewi', 'amed'],
    requiredTokens: ['jimbaran', 'kedonganan', 'badung'],
  },
  'pantai-sanur': {
    destinationId: 'pantai-sanur',
    verifiedPlaceId: 'ChIJIQtf07dB0i0RQA6DyvsLAwU',
    regency: 'Denpasar',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['kelingking', 'melasti', 'lovina', 'medewi', 'jimbaran'],
    requiredTokens: ['sanur', 'denpasar'],
  },
  'tegallalang-rice-terraces': {
    destinationId: 'tegallalang-rice-terraces',
    verifiedPlaceId: 'ChIJ4wD5Iwsi0i0R7QRsOGmJGo0',
    regency: 'Gianyar',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['jatiluwih', 'tabanan', 'batukaru', 'penebel'],
    requiredTokens: ['tegallalang', 'tegalalang', 'ceking', 'gianyar'],
  },
  'pura-tirta-empul': {
    destinationId: 'pura-tirta-empul',
    verifiedPlaceId: 'ChIJtTFh4PQY0i0RwewUdwFaolM',
    regency: 'Gianyar',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tirta gangga', 'karangasem', 'tanah lot', 'uluwatu', 'ulun danu'],
    requiredTokens: ['tirta empul', 'tampaksiring', 'gianyar'],
  },
  'sacred-monkey-forest-ubud': {
    destinationId: 'sacred-monkey-forest-ubud',
    verifiedPlaceId: 'ChIJZ5sY9kM90i0RVsPvSxZD7LY',
    regency: 'Gianyar',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['uluwatu', 'sangeh', 'pulaki'],
    requiredTokens: ['monkey forest', 'ubud', 'wenara wana', 'padangtegal'],
  },
  'pura-tanah-lot': {
    destinationId: 'pura-tanah-lot',
    verifiedPlaceId: 'ChIJq95xT4I30i0RaU3j93Diq8o',
    regency: 'Tabanan',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['ulun danu', 'beratan', 'bratan', 'bedugul', 'uluwatu', 'besakih'],
    requiredTokens: ['tanah lot', 'beraban', 'tabanan'],
  },
  'pura-ulun-danu-beratan': {
    destinationId: 'pura-ulun-danu-beratan',
    verifiedPlaceId: 'ChIJVwisn2yJ0S0RUxvb5GhlJBg',
    regency: 'Tabanan',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tanah lot', 'uluwatu', 'pecatu', 'besakih', 'tirta gangga'],
    requiredTokens: ['ulun danu', 'beratan', 'bratan', 'bedugul', 'tabanan'],
  },
  'gunung-danau-batur-kintamani': {
    destinationId: 'gunung-danau-batur-kintamani',
    verifiedPlaceId: 'ChIJP-7oyAP00S0RtHCGoa9FgNM',
    regency: 'Bangli',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['batukaru', 'ijen', 'bromo', 'rinjani'],
    requiredTokens: ['batur', 'kintamani', 'bangli'],
  },
  'desa-penglipuran-bangli': {
    destinationId: 'desa-penglipuran-bangli',
    verifiedPlaceId: 'ChIJqfTkrG4Z0i0RGTQM35oWGTM',
    regency: 'Bangli',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tenganan', 'trunyan', 'ubud'],
    requiredTokens: ['penglipuran', 'bangli'],
  },
  'tirta-gangga-karangasem': {
    destinationId: 'tirta-gangga-karangasem',
    verifiedPlaceId: 'ChIJ0Zo39DZH0i0R0acI0bADr2U',
    regency: 'Karangasem',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tirta empul', 'tampaksiring', 'ulun danu', 'tanah lot'],
    requiredTokens: ['tirta gangga', 'karangasem', 'abang'],
  },
  'kelingking-beach-nusa-penida': {
    destinationId: 'kelingking-beach-nusa-penida',
    verifiedPlaceId: 'ChIJy3kHnSpu0i0Rbu3sQlSDkLM',
    regency: 'Klungkung',
    subIsland: 'Nusa Penida',
    forbiddenTokens: ['melasti', 'ungasan', 'lembongan', 'devil', 'sanur', 'lovina', 'medewi', 'diamond beach'],
    requiredTokens: ['kelingking', 'nusa penida', 'karang dawa'],
  },
  'broken-beach-angels-billabong': {
    destinationId: 'broken-beach-angels-billabong',
    verifiedPlaceId: 'ChIJyy2nId9v0i0RpUc5EjA_2y8',
    regency: 'Klungkung',
    subIsland: 'Nusa Penida',
    forbiddenTokens: ['lembongan', 'melasti', 'diamond beach', 'sanur'],
    requiredTokens: ['broken beach', 'pasih uug', 'billabong', 'nusa penida'],
  },
  'air-terjun-sekumpul-fiji': {
    destinationId: 'air-terjun-sekumpul-fiji',
    verifiedPlaceId: 'ChIJ7yfO4n2P0S0RiKUeI1xVpyg',
    regency: 'Buleleng',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tegenungan', 'gitgit', 'kanto lampo', 'tibumana', 'banyumala', 'nungnung', 'leke-leke'],
    requiredTokens: ['sekumpul', 'fiji', 'sawan', 'buleleng'],
  },
  'pemuteran-pulau-menjangan': {
    destinationId: 'pemuteran-pulau-menjangan',
    verifiedPlaceId: 'ChIJZ6RQfWVD0S0RstBUppm878Y',
    regency: 'Jembrana',
    subIsland: 'Pulau Menjangan',
    forbiddenTokens: ['nusa penida', 'lembongan', 'amed', 'sanur'],
    requiredTokens: ['menjangan', 'bali barat', 'west bali', 'pemuteran'],
  },
  'nusa-lembongan-devils-tear-mangrove': {
    destinationId: 'nusa-lembongan-devils-tear-mangrove',
    verifiedPlaceId: 'ChIJNXQYfLRt0i0RALc3MIMT6QA',
    regency: 'Klungkung',
    subIsland: 'Nusa Lembongan',
    forbiddenTokens: ['kelingking', 'diamond beach', 'broken beach', 'pasih uug', 'bunga mekar', 'pejukutan'],
    requiredTokens: ['lembongan', 'devil', 'jungutbatu'],
  },
  'pura-agung-besakih': {
    destinationId: 'pura-agung-besakih',
    verifiedPlaceId: 'ChIJt7JIN74c0i0RSrvRjHk5_As',
    regency: 'Karangasem',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tanah lot', 'uluwatu', 'ulun danu', 'tirta empul'],
    requiredTokens: ['besakih', 'rendang', 'karangasem', 'agung'],
  },
  'jatiluwih-rice-terraces': {
    destinationId: 'jatiluwih-rice-terraces',
    verifiedPlaceId: 'ChIJ-9cMAqsn0i0RmoPm81-HDy8',
    regency: 'Tabanan',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['tegallalang', 'tegalalang', 'ceking', 'ubud', 'gianyar'],
    requiredTokens: ['jatiluwih', 'penebel', 'tabanan', 'batukaru'],
  },
  'pantai-amed-jemeluk-tulamben': {
    destinationId: 'pantai-amed-jemeluk-tulamben',
    verifiedPlaceId: 'ChIJ0Y1znn7_zS0RswAdludqIBA',
    regency: 'Karangasem',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['kelingking', 'melasti', 'sanur', 'lovina', 'medewi'],
    requiredTokens: ['amed', 'jemeluk', 'tulamben', 'karangasem'],
  },
  'pantai-lovina-buleleng': {
    destinationId: 'pantai-lovina-buleleng',
    verifiedPlaceId: 'ChIJq2UHzD2b0S0RUAdyDHdHbKs',
    regency: 'Buleleng',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['kelingking', 'melasti', 'sanur', 'medewi', 'jimbaran', 'nusa penida'],
    requiredTokens: ['lovina', 'kalibukbuk', 'buleleng', 'binaria'],
  },
  'pantai-medewi-jembrana': {
    destinationId: 'pantai-medewi-jembrana',
    verifiedPlaceId: 'ChIJ1SYZN6HW0y0RTsSZh4dDH-E',
    regency: 'Jembrana',
    subIsland: 'Mainland Bali',
    forbiddenTokens: ['kelingking', 'melasti', 'sanur', 'lovina', 'uluwatu', 'nusa penida'],
    requiredTokens: ['medewi', 'pekutatan', 'jembrana'],
  },
  'diamond-beach-nusa-penida': {
    destinationId: 'diamond-beach-nusa-penida',
    verifiedPlaceId: 'ChIJMa53HxZ30i0RjT02sEeHrQ0',
    regency: 'Klungkung',
    subIsland: 'Nusa Penida',
    forbiddenTokens: ['kelingking', 'melasti', 'lembongan', 'devil', 'sanur', 'lovina', 'medewi'],
    requiredTokens: ['diamond beach', 'pejukutan', 'atuh', 'nusa penida'],
  },
};

export function buildDisambiguatedPlaceQuery(dest: Destination): string {
  const districtPart = dest.district ? `${dest.district}, ` : '';
  const islandPart =
    dest.subIsland !== 'Mainland Bali' ? `${dest.subIsland}, ` : '';
  return `${dest.nameId}, ${dest.area}, ${districtPart}${islandPart}Kabupaten ${dest.regency}, Bali, Indonesia`;
}

export function validatePhotoMatchesDestination(
  photo: DestinationPhotoMetadata | null | undefined,
  dest: Destination
): { valid: boolean; reason?: string } {
  if (!photo) {
    return { valid: false, reason: 'missing_photo_metadata' };
  }
  if (!photo.photoSourceUrl || !photo.photoSourceUrl.trim()) {
    return { valid: false, reason: 'empty_photo_source_url' };
  }
  if (photo.destinationId !== dest.id) {
    return {
      valid: false,
      reason: `destination_id_mismatch:${photo.destinationId}!==${dest.id}`,
    };
  }
  if (!dest.placeId || photo.placeId !== dest.placeId) {
    return {
      valid: false,
      reason: `place_id_mismatch:${photo.placeId}!==${dest.placeId}`,
    };
  }

  const rule = VERIFIED_PLACE_IDENTITY_RULES[dest.id];
  if (rule && rule.verifiedPlaceId !== dest.placeId) {
    return {
      valid: false,
      reason: `unverified_catalog_place_id:${dest.placeId}`,
    };
  }

  // Ensure Google Places proxy URLs never reference a foreign Place ID
  if (
    photo.photoSourceUrl.includes('/api/photos/google-media') &&
    !photo.photoSourceUrl.includes(encodeURIComponent(dest.placeId)) &&
    !photo.photoSourceUrl.includes(dest.placeId)
  ) {
    return {
      valid: false,
      reason: 'google_media_url_place_id_mismatch',
    };
  }

  const combinedText = `${photo.photoCaption || ''} ${photo.photoSourceUrl || ''} ${photo.altTextId || ''} ${photo.altTextEn || ''}`.toLowerCase();

  if (rule) {
    for (const forbidden of rule.forbiddenTokens) {
      if (combinedText.includes(forbidden.toLowerCase())) {
        return {
          valid: false,
          reason: `forbidden_cross_location_token:${forbidden}`,
        };
      }
    }
  }

  if (photo.attributionRequired && (!photo.photoAuthor || !photo.photoAuthor.trim())) {
    return { valid: false, reason: 'missing_required_author_attribution' };
  }

  // Non-Google fallback repositories must not claim verified_place_id visual verification
  if (
    photo.photoProvider === 'wikimedia_commons' &&
    photo.validationStatus === 'verified_place_id'
  ) {
    return {
      valid: false,
      reason: 'unverified_provider_cannot_claim_verified_place_id',
    };
  }

  return { valid: true };
}

export function selectAndDeduplicateGalleryPhotos(
  candidates: DestinationPhotoMetadata[],
  dest: Destination,
  maxCount = 5
): DestinationPhotoMetadata[] {
  const validPhotos = candidates.filter(
    (p) => validatePhotoMatchesDestination(p, dest).valid
  );

  const seenUrls = new Set<string>();
  const seenSignatures = new Set<string>();
  const unique: DestinationPhotoMetadata[] = [];

  for (const photo of validPhotos) {
    const cleanUrl = photo.photoSourceUrl.split('&t=')[0].trim();
    const sig = `${photo.photoAuthor.toLowerCase().trim()}_${photo.widthPx}x${photo.heightPx}_${photo.id}`;
    if (seenUrls.has(cleanUrl) || seenSignatures.has(sig)) {
      continue;
    }
    seenUrls.add(cleanUrl);
    seenSignatures.add(sig);
    unique.push(photo);
  }

  // Sort landscape & higher-resolution photos first for crisp 16:9 hero presentation
  unique.sort((a, b) => {
    const aLandscape = a.photoAspectRatio >= 1.2 && a.photoAspectRatio <= 2.3 ? 1 : 0;
    const bLandscape = b.photoAspectRatio >= 1.2 && b.photoAspectRatio <= 2.3 ? 1 : 0;
    if (aLandscape !== bLandscape) return bLandscape - aLandscape;
    return b.widthPx - a.widthPx;
  });

  return unique.slice(0, maxCount);
}

// Short-lived in-memory cache (15 minutes TTL) to comply with Google Places caching rules
const CACHE_TTL_MS = 15 * 60 * 1000;
const bundleMemoryCache = new Map<
  string,
  { bundle: DestinationPhotoBundle; expiresAt: number }
>();

export function clearPhotoBundleCache(): void {
  bundleMemoryCache.clear();
}

export async function resolveDestinationPhotoBundle(
  dest: Destination,
  options?: {
    forceRefresh?: boolean;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
    simulateScenario?:
      | 'normal'
      | 'unavailable'
      | 'expired_token'
      | 'invalid_key'
      | 'quota_exceeded'
      | 'offline';
  }
): Promise<DestinationPhotoBundle> {
  const cacheKey = `${dest.id}::${dest.placeId}`;
  const now = Date.now();
  const scenario = options?.simulateScenario || 'normal';

  if (
    !options?.forceRefresh &&
    scenario === 'normal' &&
    bundleMemoryCache.has(cacheKey)
  ) {
    const cached = bundleMemoryCache.get(cacheKey)!;
    if (cached.expiresAt > now) {
      return cached.bundle;
    }
    bundleMemoryCache.delete(cacheKey);
  }

  if (scenario === 'offline') {
    return {
      destinationId: dest.id,
      placeId: dest.placeId,
      status: 'unavailable',
      provider: 'unavailable',
      validationStatus: 'unavailable',
      heroPhoto: null,
      galleryPhotos: [],
      googleMapsUrl: dest.googleMapsUrl,
      fetchedAt: new Date().toISOString(),
      errorReason: 'network_offline',
    };
  }

  if (scenario === 'invalid_key' || scenario === 'quota_exceeded') {
    return {
      destinationId: dest.id,
      placeId: dest.placeId,
      status: 'error',
      provider: 'unavailable',
      validationStatus: 'unavailable',
      heroPhoto: null,
      galleryPhotos: [],
      googleMapsUrl: dest.googleMapsUrl,
      fetchedAt: new Date().toISOString(),
      errorReason: scenario,
    };
  }

  if (scenario === 'unavailable') {
    return {
      destinationId: dest.id,
      placeId: dest.placeId,
      status: 'unavailable',
      provider: 'unavailable',
      validationStatus: 'unavailable',
      heroPhoto: null,
      galleryPhotos: [],
      googleMapsUrl: dest.googleMapsUrl,
      fetchedAt: new Date().toISOString(),
      errorReason: 'photo_unavailable',
    };
  }

  const fetcher = options?.fetchImpl || fetch;
  const queryParams = new URLSearchParams({
    placeId: dest.placeId,
    nameId: dest.nameId,
    nameEn: dest.nameEn,
    area: dest.area,
    regency: dest.regency,
    subIsland: dest.subIsland,
    lat: String(dest.coordinates.lat),
    lng: String(dest.coordinates.lng),
    altId: dest.altTextId,
    altEn: dest.altTextEn,
    forceRefresh: options?.forceRefresh ? '1' : '0',
  });

  try {
    const res = await fetcher(
      `/api/photos/destination/${encodeURIComponent(dest.id)}?${queryParams.toString()}`,
      { signal: options?.signal }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const rawBundle = (await res.json()) as DestinationPhotoBundle;
    const deduplicated = selectAndDeduplicateGalleryPhotos(
      rawBundle.galleryPhotos || (rawBundle.heroPhoto ? [rawBundle.heroPhoto] : []),
      dest,
      5
    );

    if (deduplicated.length === 0) {
      return {
        destinationId: dest.id,
        placeId: dest.placeId,
        status: 'unavailable',
        provider: 'unavailable',
        validationStatus: 'unavailable',
        heroPhoto: null,
        galleryPhotos: [],
        googleMapsUrl: dest.googleMapsUrl,
        fetchedAt: new Date().toISOString(),
        errorReason: rawBundle.errorReason || 'no_verified_photos',
      };
    }

    const verifiedBundle: DestinationPhotoBundle = {
      destinationId: dest.id,
      placeId: dest.placeId,
      status: 'ok',
      provider: deduplicated[0].photoProvider,
      validationStatus: deduplicated[0].validationStatus,
      heroPhoto: deduplicated[0],
      galleryPhotos: deduplicated,
      googleMapsUrl: rawBundle.googleMapsUrl || dest.googleMapsUrl,
      fetchedAt: new Date().toISOString(),
    };

    bundleMemoryCache.set(cacheKey, {
      bundle: verifiedBundle,
      expiresAt: now + CACHE_TTL_MS,
    });

    return verifiedBundle;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    return {
      destinationId: dest.id,
      placeId: dest.placeId,
      status: 'unavailable',
      provider: 'unavailable',
      validationStatus: 'unavailable',
      heroPhoto: null,
      galleryPhotos: [],
      googleMapsUrl: dest.googleMapsUrl,
      fetchedAt: new Date().toISOString(),
      errorReason: err?.message || 'fetch_failed',
    };
  }
}
