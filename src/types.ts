export type Language = 'id' | 'en';
export type CurrencyCode = 'IDR' | 'USD' | 'AUD' | 'EUR' | 'SGD';

export type BaliRegency =
  | 'Badung'
  | 'Denpasar'
  | 'Gianyar'
  | 'Tabanan'
  | 'Bangli'
  | 'Karangasem'
  | 'Klungkung'
  | 'Buleleng'
  | 'Jembrana';

export type Regency = BaliRegency;

export type SubIsland =
  | 'Mainland Bali'
  | 'Nusa Penida'
  | 'Nusa Lembongan'
  | 'Nusa Ceningan'
  | 'Pulau Menjangan'
  | 'Pulau Serangan';

export type DestinationCategory =
  | 'beach'
  | 'temple_culture'
  | 'waterfall'
  | 'mountain'
  | 'rice_terrace_nature'
  | 'culinary'
  | 'snorkeling_diving'
  | 'surfing'
  | 'family'
  | 'adventure'
  | 'wellness_spa'
  | 'hidden_gem'
  | 'traditional_village'
  | 'sunset_spot'
  | 'sunrise_spot';

export interface StructuredDescription {
  overview: string;
  uniqueness: string;
  activities: string[];
  whyVisit: string;
  bestTime: string;
  practicalTips: string;
  etiquetteAndSafety: string;
  nearbySuggestions: string[];
}

export type PhotoLoadState =
  | 'idle'
  | 'loading'
  | 'loaded'
  | 'failed'
  | 'refreshing'
  | 'unavailable';

export type PhotoProviderType =
  | 'google_places'
  | 'official_source'
  | 'wikimedia_commons'
  | 'unavailable';

export type PhotoValidationStatus =
  | 'verified_place_id'
  | 'needs_manual_review'
  | 'unavailable';

export interface DestinationPhotoMetadata {
  id: string;
  destinationId: string;
  placeId: string;
  photoProvider: PhotoProviderType;
  photoSourceUrl: string;
  photoPageUrl?: string;
  photoAuthor: string;
  photoAuthorUrl?: string;
  photoLicense: string;
  photoCaption: string;
  altTextId: string;
  altTextEn: string;
  photoAspectRatio: number;
  widthPx: number;
  heightPx: number;
  attributionRequired: boolean;
  validationStatus: PhotoValidationStatus;
  lastVerifiedAt: string;
}

export interface DestinationPhotoBundle {
  destinationId: string;
  placeId: string;
  status: 'ok' | 'unavailable' | 'error';
  provider: PhotoProviderType;
  validationStatus: PhotoValidationStatus;
  heroPhoto: DestinationPhotoMetadata | null;
  galleryPhotos: DestinationPhotoMetadata[];
  googleMapsUrl: string;
  fetchedAt: string;
  errorReason?: string;
}

export interface Destination {
  id: string;
  placeId: string;
  nameId: string;
  nameEn: string;
  regency: BaliRegency;
  subIsland: SubIsland;
  area: string;
  district?: string;
  category: DestinationCategory;
  secondaryCategories: DestinationCategory[];
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  googleMapsUrl: string;
  altTextId: string;
  altTextEn: string;
  photoProvider: PhotoProviderType;
  photoStatus: PhotoValidationStatus;
  lastPhotoValidation: string;
  openingHours: string;
  hoursVerification: 'verified_official' | 'estimated_local';
  ticketIDR: {
    domestic: number;
    international: number;
    parkingMotorIDR: number;
    parkingCarIDR: number;
    verification: 'verified' | 'estimated';
    notesId: string;
    notesEn: string;
  };
  recommendedDurationMinutes: number;
  bestTimeWindow: string;
  facilities: string[];
  accessibilityNotesId: string;
  accessibilityNotesEn: string;
  streetViewConfig: {
    lat: number;
    lng: number;
    heading: number;
    pitch: number;
    hasKnownCoverage: boolean;
    sourceLabel: string;
  };
  visualTheme:
    | 'coastal'
    | 'temple'
    | 'waterfall'
    | 'terrace'
    | 'mountain'
    | 'island'
    | 'village';
  descriptionId: StructuredDescription;
  descriptionEn: StructuredDescription;
  dataSource: string;
  lastChecked: string;
  officialWebsite?: string;
  contactPhone?: string;
}

export type BaliDestination = Destination;

export interface VehicleOption {
  id: string;
  nameId: string;
  nameEn: string;
  category:
    | 'scooter'
    | 'compact_car'
    | 'family_car'
    | 'mpv'
    | 'suv'
    | 'van'
    | 'minibus'
    | 'premium'
    | 'car_with_driver'
    | 'port_transfer'
    | 'fast_boat'
    | 'ride_hailing';
  capacityPassengers: number;
  capacityLuggage: number;
  baseRateIDRPerDay: number;
  hourlyRateIDR?: number;
  driverFeeIDRPerDay: number;
  includesDriver: boolean;
  includesFuel: boolean;
  fuelKmPerLiter: number;
  fuelPriceIDRPerLiter: number;
  supportedAreas: string[];
  notesId: string;
  notesEn: string;
  priceSource: 'configured_reference' | 'vendor_estimate';
  lastUpdated: string;
}

export interface CostBreakdownInput {
  vehicleId: string;
  days: number;
  passengers: number;
  estimatedDistanceKm: number;
  includeDriver: boolean;
  useTollRoad: boolean;
  tollCrossings: number;
  includeFastBoat: boolean;
  fastBoatRoundTripCount: number;
  destinationTicketTotalIDRPerPerson: number;
  isInternationalTourist: boolean;
  pickupAreaSurchargeIDR: number;
  includeOptionalInsurance: boolean;
}

export interface CostBreakdownResult {
  vehicleCount: number;
  vehicleRentalIDR: number;
  driverTotalIDR: number;
  fuelEstimateIDR: number;
  parkingEstimateIDR: number;
  tollEstimateIDR: number;
  fastBoatTotalIDR: number;
  destinationTicketsTotalIDR: number;
  pickupSurchargeIDR: number;
  insuranceTotalIDR: number;
  serviceFeeIDR: number;
  subtotalBeforeExtrasIDR: number;
  totalIDR: number;
  perVehicleIDR: number;
  perPersonIDR: number;
  priceRangeLowIDR: number;
  priceRangeHighIDR: number;
  includedItemsId: string[];
  includedItemsEn: string[];
  excludedItemsId: string[];
  excludedItemsEn: string[];
  assumptionsId: string[];
  assumptionsEn: string[];
}

export interface TourPackage {
  id: string;
  titleId: string;
  titleEn: string;
  category: string;
  durationHours: number;
  routeStopIds: string[];
  pickupTime: string;
  pickupAreas: string[];
  minParticipants: number;
  maxParticipants: number;
  pricePerPersonIDR: number;
  priceType: 'estimated_market' | 'vendor_published';
  inclusionsId: string[];
  inclusionsEn: string[];
  exclusionsId: string[];
  exclusionsEn: string[];
  vehicleName: string;
  guideLanguages: string[];
  providerName: string;
  licenseStatus: 'verified_hpi_association' | 'registered_local_operator';
  cancellationPolicyId: string;
  cancellationPolicyEn: string;
  safetyNotesId: string;
  safetyNotesEn: string;
  contactWhatsapp: string;
  availabilityStatus: 'inquiry_required' | 'available_daily';
  lastUpdated: string;
}

export interface TripStop {
  destinationId: string;
  dayNumber: number;
  order: number;
  plannedArrival: string;
  plannedDeparture: string;
  travelMinutesFromPrev: number;
  distanceKmFromPrev: number;
  notes: string;
  weatherRainFallbackId: string;
  weatherRainFallbackEn: string;
}

export interface TripPlan {
  id: string;
  uid?: string;
  tripName: string;
  startDate: string;
  endDate: string;
  departureTime: string;
  days: number;
  originName: string;
  originCoords: { lat: number; lng: number };
  travelers: number;
  pace: 'relaxed' | 'balanced' | 'packed';
  vehicleId: string;
  budgetIDR: number;
  isInternational: boolean;
  interests: DestinationCategory[];
  stops: TripStop[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
  totalEstimatedCostIDR: number;
  visibility: 'private' | 'shared';
  status: 'draft' | 'planned' | 'archived';
  notes: string;
  encryptedNotes?: string;
  updatedAt?: string;
}

export interface SavedPlaceItem {
  id: string;
  uid: string;
  placeId: string;
  name: string;
  regency: string;
  category: string;
  notes?: string;
  encryptedNote?: string;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  uid: string;
  name: string;
  relation: string;
  phone: string;
  createdAt: string;
}

export interface DailyForecastDay {
  date: string;
  dayLabel: string;
  minTempC: number;
  maxTempC: number;
  humidityPercent: number;
  rainChancePercent: number;
  condition: string;
  uvIndex: number;
}

export interface WeatherSnapshot {
  tempC: number;
  feelsLikeC: number;
  condition: string;
  humidity: number;
  windKmh: number;
  uvIndex: number;
  rainChancePercent: number;
  bestTimeNote: string;
  isLiveApi: boolean;
  updatedAt: string;
  dailyForecast: DailyForecastDay[];
}

export interface SystemHealthTelemetry {
  status: 'healthy' | 'warning' | 'degraded';
  uptimeSeconds: number;
  cpuUsagePercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  memoryUsagePercent: number;
  apiLatencyMs: number;
  lastScheduledSync: string;
  nextScheduledSync: string;
  verifiedDestinationsCount: number;
  recentMetrics: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    latencyMs: number;
  }>;
  incidentLogs: Array<{
    id: string;
    timestamp: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
    resolved: boolean;
  }>;
}

export interface PracticalPlace {
  id: string;
  name: string;
  category:
    | 'restaurant'
    | 'warung'
    | 'vegan'
    | 'cafe'
    | 'family_dining'
    | 'market'
    | 'souvenir'
    | 'atm'
    | 'minimarket'
    | 'gas_station'
    | 'ev_charging'
    | 'restroom'
    | 'pharmacy'
    | 'clinic'
    | 'hospital'
    | 'worship'
    | 'harbor'
    | 'airport'
    | 'parking'
    | 'pickup_point';
  regency: BaliRegency;
  area: string;
  address: string;
  coordinates: { lat: number; lng: number };
  openingHoursStatus: string;
  accessibilityFeatures: string[];
  notesId: string;
  notesEn: string;
  phone?: string;
}
