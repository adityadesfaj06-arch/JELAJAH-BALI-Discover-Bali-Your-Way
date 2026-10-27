import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateTripCosts, VEHICLE_OPTIONS } from './pricingService';
import {
  calculateHaversineKm,
  optimizeStopOrder,
  buildTripStops,
  createTripFromTemplate,
} from './itineraryService';
import { recommendToursForStops } from './tourService';
import { buildEmergencyShareMessage } from './sosService';
import { BALI_DESTINATIONS } from '../data/baliCatalog';
import {
  VERIFIED_PLACE_IDENTITY_RULES,
  buildDisambiguatedPlaceQuery,
  validatePhotoMatchesDestination,
  selectAndDeduplicateGalleryPhotos,
  resolveDestinationPhotoBundle,
  clearPhotoBundleCache,
} from './destinationPhotoService';
import { DestinationPhotoMetadata } from '../types';

describe('Jelajah Bali Pure Logic Suite', () => {
  it('calculates deterministic trip costs including vehicle count, fuel, toll, fast boat, and tickets', () => {
    const result = calculateTripCosts({
      vehicleId: 'car-with-driver-avanza',
      days: 2,
      passengers: 4,
      estimatedDistanceKm: 120,
      includeDriver: true,
      useTollRoad: true,
      tollCrossings: 2,
      includeFastBoat: true,
      fastBoatRoundTripCount: 1,
      destinationTicketTotalIDRPerPerson: 75000,
      isInternationalTourist: false,
      pickupAreaSurchargeIDR: 0,
      includeOptionalInsurance: false,
    });

    assert.equal(result.vehicleCount, 1);
    assert.equal(result.vehicleRentalIDR, 650000 * 2);
    assert.equal(result.fuelEstimateIDR, 0);
    assert.equal(result.parkingEstimateIDR, 25000 * 2);
    assert.equal(result.tollEstimateIDR, 14000 * 2);
    assert.equal(result.fastBoatTotalIDR, 225000 * 4);
    assert.equal(result.destinationTicketsTotalIDR, 75000 * 4);
    assert.equal(result.perPersonIDR, Math.round(result.totalIDR / 4));
  });

  it('computes accurate road-adjusted Haversine distance between Ubud and Uluwatu', () => {
    const ubud = BALI_DESTINATIONS.find(
      (d) => d.id === 'tegallalang-rice-terraces'
    )!;
    const uluwatu = BALI_DESTINATIONS.find((d) => d.id === 'pura-uluwatu')!;
    const distKm = calculateHaversineKm(ubud.coordinates, uluwatu.coordinates);
    assert.ok(distKm > 45 && distKm < 80, `Expected ~68km road-adjusted, got ${distKm}`);
  });

  it('optimizes stop order geographically and groups mainland before island crossings', () => {
    const uluwatu = BALI_DESTINATIONS.find((d) => d.id === 'pura-uluwatu')!;
    const tirtaEmpul = BALI_DESTINATIONS.find((d) => d.id === 'pura-tirta-empul')!;
    const melasti = BALI_DESTINATIONS.find((d) => d.id === 'pantai-melasti')!;
    const penida = BALI_DESTINATIONS.find(
      (d) => d.id === 'kelingking-beach-nusa-penida'
    )!;

    const ordered = optimizeStopOrder(uluwatu.coordinates, [
      penida,
      tirtaEmpul,
      melasti,
    ]);
    assert.deepEqual(
      ordered.map((d) => d.id),
      ['pantai-melasti', 'pura-tirta-empul', 'kelingking-beach-nusa-penida']
    );
  });

  it('builds chronological trip stops with arrival/departure times and cross-island warnings', () => {
    const uluwatu = BALI_DESTINATIONS.find((d) => d.id === 'pura-uluwatu')!;
    const melasti = BALI_DESTINATIONS.find((d) => d.id === 'pantai-melasti')!;
    const penida = BALI_DESTINATIONS.find(
      (d) => d.id === 'kelingking-beach-nusa-penida'
    )!;

    const built = buildTripStops(
      { lat: -8.7482, lng: 115.1675 },
      [uluwatu, melasti, penida],
      1,
      '08:00',
      'packed'
    );
    assert.equal(built.stops.length, 3);
    assert.ok(built.totalDistanceKm > 20);
    assert.ok(built.warningsId.length >= 1, 'Should emit cross-island warning');
  });

  it('recommends matching local tour packages for selected stops', () => {
    const recommended = recommendToursForStops([
      'kelingking-beach-nusa-penida',
      'broken-beach-angels-billabong',
    ]);
    assert.ok(recommended.length >= 1);
    assert.equal(recommended[0].id, 'tour-nusa-penida-day');
  });

  it('formats bilingual SOS emergency message with Google Maps link', () => {
    const msgId = buildEmergencyShareMessage(
      'id',
      { lat: -8.65, lng: 115.2167 },
      'Dekat Lapangan Puputan'
    );
    assert.ok(msgId.text.includes('DARURAT SOS'));
    assert.equal(
      msgId.mapsUrl,
      'https://www.google.com/maps?q=-8.650000,115.216700'
    );

    const msgEn = buildEmergencyShareMessage(
      'en',
      { lat: -8.65, lng: 115.2167 },
      'Near Puputan Square'
    );
    assert.ok(msgEn.text.includes('SOS EMERGENCY'));
  });

  it('includes all 9 Bali regencies and Nusa Islands in BALI_DESTINATIONS catalog and builds template trips', () => {
    const regencies = new Set(BALI_DESTINATIONS.map((d) => d.regency));
    const expected = [
      'Badung',
      'Denpasar',
      'Gianyar',
      'Tabanan',
      'Bangli',
      'Karangasem',
      'Klungkung',
      'Buleleng',
      'Jembrana',
    ];
    for (const reg of expected) {
      assert.ok(regencies.has(reg as any), `Missing regency ${reg}`);
    }
    assert.equal(VEHICLE_OPTIONS.length, 12);

    const tplTrip = createTripFromTemplate('tpl-1d-highlights', 2, false);
    assert.ok(tplTrip.stops.length >= 3);
    assert.ok(tplTrip.totalEstimatedCostIDR > 0);
  });

  it('verifies all 15 mandatory destinations from Section 13 have unique verified Place IDs and non-generic alt text', () => {
    const mandatoryIds = [
      'kelingking-beach-nusa-penida',
      'pura-uluwatu',
      'pura-tanah-lot',
      'tegallalang-rice-terraces',
      'jatiluwih-rice-terraces',
      'tirta-gangga-karangasem',
      'pura-ulun-danu-beratan',
      'pantai-melasti',
      'air-terjun-sekumpul-fiji',
      'gunung-danau-batur-kintamani',
      'pantai-lovina-buleleng',
      'pantai-medewi-jembrana',
      'pantai-sanur',
      'nusa-lembongan-devils-tear-mangrove',
      'diamond-beach-nusa-penida',
    ];

    const seenPlaceIds = new Set<string>();
    for (const id of mandatoryIds) {
      const dest = BALI_DESTINATIONS.find((d) => d.id === id);
      assert.ok(dest, `Mandatory destination ${id} must exist in catalog`);
      assert.ok(
        dest.placeId && dest.placeId.startsWith('ChIJ'),
        `Destination ${id} must have a verified Google Place ID`
      );
      assert.ok(
        !seenPlaceIds.has(dest.placeId),
        `Duplicate Place ID ${dest.placeId} found on ${id}`
      );
      seenPlaceIds.add(dest.placeId);
      assert.equal(
        dest.placeId,
        VERIFIED_PLACE_IDENTITY_RULES[id]?.verifiedPlaceId
      );
      assert.ok(dest.altTextId.length > 25 && !dest.altTextId.toLowerCase().includes('bali beautiful photo'));
      assert.ok(dest.altTextEn.length > 25 && !dest.altTextEn.toLowerCase().includes('bali beautiful photo'));

      const disambiguated = buildDisambiguatedPlaceQuery(dest);
      assert.ok(disambiguated.includes(dest.regency));
      assert.ok(disambiguated.includes('Bali, Indonesia'));
    }
  });

  it('strictly prevents cross-destination photo mix-ups (Kelingking vs Melasti, Tanah Lot vs Ulun Danu, Tegallalang vs Jatiluwih, Penida vs Lembongan)', () => {
    const kelingking = BALI_DESTINATIONS.find((d) => d.id === 'kelingking-beach-nusa-penida')!;
    const melasti = BALI_DESTINATIONS.find((d) => d.id === 'pantai-melasti')!;
    const tanahLot = BALI_DESTINATIONS.find((d) => d.id === 'pura-tanah-lot')!;
    const ulunDanu = BALI_DESTINATIONS.find((d) => d.id === 'pura-ulun-danu-beratan')!;
    const tegallalang = BALI_DESTINATIONS.find((d) => d.id === 'tegallalang-rice-terraces')!;
    const jatiluwih = BALI_DESTINATIONS.find((d) => d.id === 'jatiluwih-rice-terraces')!;
    const lembongan = BALI_DESTINATIONS.find((d) => d.id === 'nusa-lembongan-devils-tear-mangrove')!;
    const sekumpul = BALI_DESTINATIONS.find((d) => d.id === 'air-terjun-sekumpul-fiji')!;

    const kelingkingPhoto: DestinationPhotoMetadata = {
      id: 'kelingking-gp-1',
      destinationId: kelingking.id,
      placeId: kelingking.placeId,
      photoProvider: 'google_places',
      photoSourceUrl: `/api/photos/google-media?placeId=${kelingking.placeId}&photoName=places/${kelingking.placeId}/photos/abc&maxWidthPx=1280`,
      photoAuthor: 'Test Photographer',
      photoLicense: 'Google Places Photo Service',
      photoCaption: 'Pantai Kelingking Nusa Penida',
      altTextId: kelingking.altTextId,
      altTextEn: kelingking.altTextEn,
      photoAspectRatio: 1.77,
      widthPx: 1280,
      heightPx: 720,
      attributionRequired: true,
      validationStatus: 'verified_place_id',
      lastVerifiedAt: '2026-10-27T00:00:00Z',
    };

    // Valid for Kelingking
    assert.equal(validatePhotoMatchesDestination(kelingkingPhoto, kelingking).valid, true);

    // Must be REJECTED if assigned to Pantai Melasti (Place ID mismatch)
    assert.equal(validatePhotoMatchesDestination(kelingkingPhoto, melasti).valid, false);

    // Even if someone spoofs destinationId and placeId on Melasti, forbidden token "Kelingking" or "Nusa Penida" must reject it
    const spoofedMelastiPhoto: DestinationPhotoMetadata = {
      ...kelingkingPhoto,
      destinationId: melasti.id,
      placeId: melasti.placeId,
      photoSourceUrl: 'https://commons.wikimedia.org/Kelingking_Nusa_Penida.jpg',
      photoProvider: 'wikimedia_commons',
      validationStatus: 'needs_manual_review',
    };
    assert.equal(validatePhotoMatchesDestination(spoofedMelastiPhoto, melasti).valid, false);

    // Tanah Lot photo must be rejected on Ulun Danu Beratan
    const spoofedUlunDanu: DestinationPhotoMetadata = {
      ...kelingkingPhoto,
      destinationId: ulunDanu.id,
      placeId: ulunDanu.placeId,
      photoCaption: 'Sunset at Tanah Lot Temple',
      photoSourceUrl: `/api/photos/google-media?placeId=${ulunDanu.placeId}&photoName=places/${ulunDanu.placeId}/photos/xyz`,
    };
    assert.equal(validatePhotoMatchesDestination(spoofedUlunDanu, ulunDanu).valid, false);
    assert.ok(tanahLot.placeId !== ulunDanu.placeId);

    // Tegallalang photo must be rejected on Jatiluwih
    const spoofedJatiluwih: DestinationPhotoMetadata = {
      ...kelingkingPhoto,
      destinationId: jatiluwih.id,
      placeId: jatiluwih.placeId,
      photoCaption: 'Tegallalang Ceking Rice Terrace Ubud',
      photoSourceUrl: `/api/photos/google-media?placeId=${jatiluwih.placeId}&photoName=places/${jatiluwih.placeId}/photos/xyz`,
    };
    assert.equal(validatePhotoMatchesDestination(spoofedJatiluwih, jatiluwih).valid, false);
    assert.ok(tegallalang.placeId !== jatiluwih.placeId);

    // Nusa Penida Kelingking photo must be rejected on Nusa Lembongan
    const spoofedLembongan: DestinationPhotoMetadata = {
      ...kelingkingPhoto,
      destinationId: lembongan.id,
      placeId: lembongan.placeId,
      photoCaption: 'Diamond Beach and Kelingking Cliff',
      photoSourceUrl: `/api/photos/google-media?placeId=${lembongan.placeId}&photoName=places/${lembongan.placeId}/photos/xyz`,
    };
    assert.equal(validatePhotoMatchesDestination(spoofedLembongan, lembongan).valid, false);

    // Unnamed/other waterfall (e.g. Gitgit or Tegenungan) must be rejected on Air Terjun Sekumpul
    const spoofedSekumpul: DestinationPhotoMetadata = {
      ...kelingkingPhoto,
      destinationId: sekumpul.id,
      placeId: sekumpul.placeId,
      photoCaption: 'Tegenungan Waterfall in Gianyar',
      photoSourceUrl: `/api/photos/google-media?placeId=${sekumpul.placeId}&photoName=places/${sekumpul.placeId}/photos/xyz`,
    };
    assert.equal(validatePhotoMatchesDestination(spoofedSekumpul, sekumpul).valid, false);
  });

  it('deduplicates gallery photos, enforces attribution, and handles offline/quota/expired edge cases', async () => {
    const uluwatu = BALI_DESTINATIONS.find((d) => d.id === 'pura-uluwatu')!;
    const basePhoto: DestinationPhotoMetadata = {
      id: 'pura-uluwatu-gp-1',
      destinationId: uluwatu.id,
      placeId: uluwatu.placeId,
      photoProvider: 'google_places',
      photoSourceUrl: `/api/photos/google-media?placeId=${uluwatu.placeId}&photoName=places/${uluwatu.placeId}/photos/p1`,
      photoAuthor: 'Wayang Adi',
      photoLicense: 'Google Places Photo Service',
      photoCaption: 'Pura Luhur Uluwatu Cliff',
      altTextId: uluwatu.altTextId,
      altTextEn: uluwatu.altTextEn,
      photoAspectRatio: 1.78,
      widthPx: 1600,
      heightPx: 900,
      attributionRequired: true,
      validationStatus: 'verified_place_id',
      lastVerifiedAt: '2026-10-27T00:00:00Z',
    };

    const duplicateUrlPhoto: DestinationPhotoMetadata = {
      ...basePhoto,
      id: 'pura-uluwatu-gp-2',
    };

    const missingAuthorPhoto: DestinationPhotoMetadata = {
      ...basePhoto,
      id: 'pura-uluwatu-gp-3',
      photoSourceUrl: `/api/photos/google-media?placeId=${uluwatu.placeId}&photoName=places/${uluwatu.placeId}/photos/p3`,
      photoAuthor: '',
      attributionRequired: true,
    };

    const deduplicated = selectAndDeduplicateGalleryPhotos(
      [basePhoto, duplicateUrlPhoto, missingAuthorPhoto],
      uluwatu
    );
    assert.equal(deduplicated.length, 1);

    // Test simulated edge cases (offline, invalid_key, quota_exceeded, unavailable)
    clearPhotoBundleCache();
    const offlineBundle = await resolveDestinationPhotoBundle(uluwatu, {
      simulateScenario: 'offline',
    });
    assert.equal(offlineBundle.status, 'unavailable');
    assert.equal(offlineBundle.errorReason, 'network_offline');

    const invalidKeyBundle = await resolveDestinationPhotoBundle(uluwatu, {
      simulateScenario: 'invalid_key',
    });
    assert.equal(invalidKeyBundle.status, 'error');
    assert.equal(invalidKeyBundle.errorReason, 'invalid_key');

    const quotaBundle = await resolveDestinationPhotoBundle(uluwatu, {
      simulateScenario: 'quota_exceeded',
    });
    assert.equal(quotaBundle.status, 'error');
    assert.equal(quotaBundle.errorReason, 'quota_exceeded');
  });
});

