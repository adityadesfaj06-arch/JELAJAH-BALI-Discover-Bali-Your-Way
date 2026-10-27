import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Map as MapIcon,
  MapPin,
  Calendar,
  Car,
  Heart,
  ShieldAlert,
  AlertTriangle,
  User as UserIcon,
  Sparkles,
  Search,
  Eye,
  Plus,
  Sun,
  Moon,
  Clock,
  Globe,
  Home,
  ChevronDown,
  Briefcase,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  Destination,
  TripPlan,
  SavedPlaceItem,
  EmergencyContact,
  CurrencyCode,
} from './types';
import {
  BALI_DESTINATIONS,
  ALL_REGENCIES,
  ALL_CATEGORIES,
} from './data/baliCatalog';
import {
  createTripFromTemplate,
  buildTripStops,
} from './services/itineraryService';
import { calculateTripCosts } from './services/pricingService';
import { useTranslation } from './i18n/useTranslation';
import {
  auth,
  onAuthStateChanged,
  signInWithGoogle,
  signOutUser,
  savePlaceToCloud,
  removeSavedPlaceFromCloud,
  saveTripToCloud,
  deleteTripFromCloud,
  saveEmergencyContactToCloud,
  deleteEmergencyContactFromCloud,
  subscribeUserSavedPlaces,
  subscribeUserTrips,
  subscribeUserEmergencyContacts,
} from './firebase';
import {
  DestinationVisual,
  PWAInstallButton,
  OfflineIndicator,
} from './components/DestinationVisual';
import { DestinationModal } from './components/DestinationModal';
import { MapExplorerView } from './components/MapExplorerView';
import { TripPlannerView } from './components/TripPlannerView';
import { TransportAndToursView } from './components/TransportAndToursView';
import { SafetyAndAdminView } from './components/SafetyAndAdminView';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';

type NavTab =
  | 'home'
  | 'destinations'
  | 'map'
  | 'planner'
  | 'tours'
  | 'transport'
  | 'favorites'
  | 'sos'
  | 'profile';

export default function App() {
  const {
    lang,
    setLang,
    currency,
    setCurrency,
    darkMode,
    setDarkMode,
    formatMoney,
  } = useTranslation();

  const [activeNav, setActiveNav] = useState<NavTab>('home');
  const [quotaExceeded, setQuotaExceeded] = useState(
    () => Boolean((window as any).__gmpQuotaExceeded)
  );

  // Header dropdown states
  const [servicesMenuOpen, setServicesMenuOpen] = useState(false);
  const [localeMenuOpen, setLocaleMenuOpen] = useState(false);
  const servicesDropdownRef = useRef<HTMLDivElement | null>(null);
  const localeDropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Catalog filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [regencyFilter, setRegencyFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modal & Drawer state
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'details' | '360'>(
    'details'
  );
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Active Trip & Persisted State
  const [activeTrip, setActiveTrip] = useState<TripPlan>(() => {
    const saved = localStorage.getItem('jb_active_trip');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return createTripFromTemplate('tpl-1d-highlights', 2, false);
  });

  const [user, setUser] = useState<User | null>(null);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jb_saved_places') || '[]');
    } catch {
      return [];
    }
  });
  const [savedTrips, setSavedTrips] = useState<TripPlan[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('jb_saved_trips') || '[]');
    } catch {
      return [createTripFromTemplate('tpl-1d-highlights', 2, false)];
    }
  });
  const [emergencyContacts, setEmergencyContacts] = useState<
    EmergencyContact[]
  >([]);

  // Close header dropdowns on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        servicesDropdownRef.current &&
        !servicesDropdownRef.current.contains(e.target as Node)
      ) {
        setServicesMenuOpen(false);
      }
      if (
        localeDropdownRef.current &&
        !localeDropdownRef.current.contains(e.target as Node)
      ) {
        setLocaleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // GMP Demo Key Quota Listener (Tier 1 Mandatory Banner)
  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  useEffect(() => {
    localStorage.setItem('jb_active_trip', JSON.stringify(activeTrip));
  }, [activeTrip]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubPlaces = subscribeUserSavedPlaces(user.uid, setSavedPlaces);
    const unsubTrips = subscribeUserTrips(user.uid, (cloudTrips) => {
      if (cloudTrips.length > 0) setSavedTrips(cloudTrips);
    });
    const unsubContacts = subscribeUserEmergencyContacts(
      user.uid,
      setEmergencyContacts
    );
    return () => {
      unsubPlaces();
      unsubTrips();
      unsubContacts();
    };
  }, [user]);

  const handleAddToTrip = (dest: Destination) => {
    const currentDests = activeTrip.stops
      .map((s) => BALI_DESTINATIONS.find((d) => d.id === s.destinationId))
      .filter((d): d is Destination => Boolean(d));
    const nextDests = [...currentDests, dest];
    const built = buildTripStops(
      activeTrip.originCoords,
      nextDests,
      activeTrip.days,
      activeTrip.departureTime,
      activeTrip.pace
    );
    const ticketPerPerson = nextDests.reduce(
      (sum, d) =>
        sum +
        (activeTrip.isInternational
          ? d.ticketIDR.international
          : d.ticketIDR.domestic),
      0
    );
    const cost = calculateTripCosts({
      vehicleId: activeTrip.vehicleId,
      days: activeTrip.days,
      passengers: activeTrip.travelers,
      estimatedDistanceKm: built.totalDistanceKm,
      includeDriver: true,
      useTollRoad: false,
      tollCrossings: 0,
      includeFastBoat: nextDests.some((d) => d.subIsland !== 'Mainland Bali'),
      fastBoatRoundTripCount: 1,
      destinationTicketTotalIDRPerPerson: ticketPerPerson,
      isInternationalTourist: activeTrip.isInternational,
      pickupAreaSurchargeIDR: 0,
      includeOptionalInsurance: false,
    });
    setActiveTrip({
      ...activeTrip,
      stops: built.stops,
      totalDistanceKm: built.totalDistanceKm,
      totalDurationMinutes: built.totalDurationMinutes,
      totalEstimatedCostIDR: cost.totalIDR,
    });
  };

  const handleToggleFavorite = async (dest: Destination) => {
    const existing = savedPlaces.find((p) => p.placeId === dest.id);
    if (existing) {
      const next = savedPlaces.filter((p) => p.id !== existing.id);
      setSavedPlaces(next);
      localStorage.setItem('jb_saved_places', JSON.stringify(next));
      if (user) await removeSavedPlaceFromCloud(existing.id);
    } else {
      const item: SavedPlaceItem = {
        id: `fav_${dest.id}_${Date.now()}`,
        uid: user?.uid || 'local-guest',
        placeId: dest.id,
        name: lang === 'en' ? dest.nameEn : dest.nameId,
        regency: dest.regency,
        category: dest.category,
        createdAt: new Date().toISOString(),
      };
      const next = [item, ...savedPlaces];
      setSavedPlaces(next);
      localStorage.setItem('jb_saved_places', JSON.stringify(next));
      if (user) await savePlaceToCloud(item);
    }
  };

  const handleSaveTripCloud = async (trip: TripPlan) => {
    const withMeta: TripPlan = {
      ...trip,
      uid: user?.uid || 'local-guest',
      updatedAt: new Date().toISOString(),
    };
    const next = [
      withMeta,
      ...savedTrips.filter((t) => t.id !== withMeta.id),
    ];
    setSavedTrips(next);
    localStorage.setItem('jb_saved_trips', JSON.stringify(next));
    if (user) {
      await saveTripToCloud(withMeta);
    }
  };

  const filteredDestinations = BALI_DESTINATIONS.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchQ =
      !q ||
      d.nameId.toLowerCase().includes(q) ||
      d.nameEn.toLowerCase().includes(q) ||
      d.area.toLowerCase().includes(q) ||
      d.regency.toLowerCase().includes(q);
    const matchReg = regencyFilter === 'ALL' || d.regency === regencyFilter;
    const matchCat =
      categoryFilter === 'ALL' ||
      d.category === categoryFilter ||
      d.secondaryCategories.includes(categoryFilter as any);
    return matchQ && matchReg && matchCat;
  });

  const isServicesActive = activeNav === 'tours' || activeNav === 'transport';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-stone-950 text-stone-900 dark:text-stone-100 pb-16 lg:pb-0 overflow-x-hidden">
      {/* Tier 1 Google Maps Demo Key Quota Exceeded Banner */}
      {quotaExceeded && (
        <div
          role="alert"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            background: '#fffbeb',
            borderBottom: '1px solid #f59e0b',
            padding: '10px 16px',
            fontSize: '14px',
            color: '#78350f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <span>
            <strong>Google Maps:</strong> Free demo quota reached. To restore
            maps, open <strong>Settings &rarr; Secrets</strong> and set{' '}
            <code>VITE_GOOGLE_MAPS_API_KEY</code> to a key from your own Google
            Cloud project (
            <a
              href="https://console.cloud.google.com/google/maps-apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#b45309', textDecoration: 'underline' }}
            >
              Get a key
            </a>
            ).
          </span>
          <button
            onClick={() => setQuotaExceeded(false)}
            aria-label="Dismiss"
            style={{
              background: 'none',
              border: 'none',
              color: '#78350f',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>
      )}

      <OfflineIndicator />

      {/* Top Navigation Bar — World-Class Travel Discovery Floating Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070708]/95 text-stone-100 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* 1. Left: Brand Identity */}
          <button
            type="button"
            onClick={() => setActiveNav('home')}
            className="flex items-center gap-2.5 text-left shrink-0 group focus:outline-none"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#103828] to-[#0B291D] border border-[#E5B869]/40 text-[#E5B869] shadow-xs group-hover:border-[#E5B869] transition">
              <Compass className="h-4 w-4 text-[#E5B869]" />
            </div>
            <div className="leading-tight">
              <span className="font-serif text-base sm:text-lg font-bold tracking-wider text-[#E5B869] block whitespace-nowrap">
                JELAJAH BALI
              </span>
              <span className="hidden sm:block text-[9px] uppercase tracking-[0.2em] text-stone-400 font-semibold whitespace-nowrap">
                PERJALANANMU
              </span>
            </div>
          </button>

          {/* 2. Center: Streamlined Navigation Menu with Micro-Icons & Active Gold Indicator */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-[13px] font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveNav('home')}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 whitespace-nowrap transition ${
                activeNav === 'home'
                  ? 'text-[#E5B869] font-semibold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Home className="h-3.5 w-3.5 opacity-80" />
              <span>{lang === 'en' ? 'Home' : 'Beranda'}</span>
              {activeNav === 'home' && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full bg-[#E5B869]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('destinations')}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 whitespace-nowrap transition ${
                activeNav === 'destinations'
                  ? 'text-[#E5B869] font-semibold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <MapPin className="h-3.5 w-3.5 opacity-80" />
              <span>{lang === 'en' ? 'Destinations' : 'Destinasi'}</span>
              {activeNav === 'destinations' && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full bg-[#E5B869]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('map')}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 whitespace-nowrap transition ${
                activeNav === 'map'
                  ? 'text-[#E5B869] font-semibold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5 opacity-80" />
              <span>{lang === 'en' ? 'Explore Map' : 'Eksplor Peta'}</span>
              {activeNav === 'map' && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full bg-[#E5B869]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('planner')}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 whitespace-nowrap transition ${
                activeNav === 'planner'
                  ? 'text-[#E5B869] font-semibold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5 opacity-80" />
              <span>Trip Planner</span>
              {activeNav === 'planner' && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full bg-[#E5B869]" />
              )}
            </button>

            {/* Layanan ▾ Dropdown (Combines Tur & Aktivitas + Transportasi) */}
            <div ref={servicesDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setServicesMenuOpen((prev) => !prev)}
                aria-expanded={servicesMenuOpen}
                className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 whitespace-nowrap transition ${
                  isServicesActive
                    ? 'text-[#E5B869] font-semibold'
                    : 'text-stone-300 hover:text-white'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5 opacity-80" />
                <span>{lang === 'en' ? 'Services' : 'Layanan'}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    servicesMenuOpen ? 'rotate-180' : ''
                  }`}
                />
                {isServicesActive && (
                  <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full bg-[#E5B869]" />
                )}
              </button>

              {servicesMenuOpen && (
                <div className="absolute left-0 mt-1.5 w-52 rounded-xl border border-white/15 bg-[#0F1114] p-1.5 shadow-2xl z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav('tours');
                      setServicesMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-left transition ${
                      activeNav === 'tours'
                        ? 'bg-[#103828] text-[#E5B869] font-semibold'
                        : 'text-stone-200 hover:bg-white/10'
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5 text-[#E5B869]" />
                    <div>
                      <span className="block font-semibold">
                        {lang === 'en' ? 'Tours & Guides' : 'Tur & Aktivitas'}
                      </span>
                      <span className="block text-[10px] text-stone-400">
                        {lang === 'en'
                          ? 'Verified local guides & packages'
                          : 'Pemandu wisata & paket tur'}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveNav('transport');
                      setServicesMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-left transition mt-0.5 ${
                      activeNav === 'transport'
                        ? 'bg-[#103828] text-[#E5B869] font-semibold'
                        : 'text-stone-200 hover:bg-white/10'
                    }`}
                  >
                    <Car className="h-3.5 w-3.5 text-emerald-400" />
                    <div>
                      <span className="block font-semibold">
                        {lang === 'en' ? 'Transport & Fleet' : 'Transportasi'}
                      </span>
                      <span className="block text-[10px] text-stone-400">
                        {lang === 'en'
                          ? 'Car charter, scooter & fast boat'
                          : 'Sewa mobil, motor & fast boat'}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveNav('favorites')}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 whitespace-nowrap transition ${
                activeNav === 'favorites'
                  ? 'text-[#E5B869] font-semibold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Heart className="h-3.5 w-3.5 opacity-80" />
              <span>{lang === 'en' ? 'Favorites' : 'Favorit'}</span>
              {savedPlaces.length > 0 && (
                <span className="rounded-full bg-[#E5B869]/20 px-1.5 py-0.2 text-[10px] font-mono font-bold text-[#E5B869]">
                  {savedPlaces.length}
                </span>
              )}
              {activeNav === 'favorites' && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full bg-[#E5B869]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveNav('sos')}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 whitespace-nowrap transition ${
                activeNav === 'sos'
                  ? 'text-rose-400 font-semibold'
                  : 'text-stone-300 hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>{lang === 'en' ? 'Safety' : 'Bantuan'}</span>
              {activeNav === 'sos' && (
                <span className="absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full bg-rose-500" />
              )}
            </button>
          </nav>

          {/* 3. Right: Compact Actions, Unified Locale Selector, Search, Theme & User Avatar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />

            {/* Primary AI Planner Button */}
            <button
              type="button"
              onClick={() => setAiDrawerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#E5B869] to-amber-500 px-3 py-1.5 text-xs font-bold text-stone-950 hover:brightness-105 transition shadow-xs whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Planner</span>
            </button>

            {/* Unified Language & Currency Dropdown (🌐 ID · IDR ▾) */}
            <div ref={localeDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setLocaleMenuOpen((prev) => !prev)}
                aria-label="Toggle Language and Currency"
                aria-expanded={localeMenuOpen}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-stone-200 hover:bg-white/10 transition whitespace-nowrap"
              >
                <Globe className="h-3.5 w-3.5 text-[#E5B869]" />
                <span className="uppercase">{lang}</span>
                <span className="text-stone-500">·</span>
                <span className="font-mono text-[11px] text-[#E5B869]">
                  {currency}
                </span>
                <ChevronDown className="h-3 w-3 text-stone-400" />
              </button>

              {localeMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-white/15 bg-[#0F1114] p-3 shadow-2xl z-50 space-y-3 text-xs text-stone-200">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      {lang === 'id' ? 'Bahasa / Language' : 'Language'}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLang('id')}
                        className={`rounded-lg py-1.5 font-semibold transition ${
                          lang === 'id'
                            ? 'bg-[#E5B869] text-stone-950'
                            : 'bg-white/5 text-stone-300 hover:bg-white/10'
                        }`}
                      >
                        🇮🇩 ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        className={`rounded-lg py-1.5 font-semibold transition ${
                          lang === 'en'
                            ? 'bg-[#E5B869] text-stone-950'
                            : 'bg-white/5 text-stone-300 hover:bg-white/10'
                        }`}
                      >
                        🇬🇧 EN
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-white/10 pt-2.5">
                    <label
                      htmlFor="header-currency-select"
                      className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block"
                    >
                      {lang === 'id' ? 'Mata Uang / Currency' : 'Currency'}
                    </label>
                    <select
                      id="header-currency-select"
                      value={currency}
                      onChange={(e) => {
                        setCurrency(e.target.value as CurrencyCode);
                        setLocaleMenuOpen(false);
                      }}
                      aria-label="Currency selector"
                      className="w-full rounded-lg border border-white/15 bg-stone-900 px-2.5 py-1.5 text-xs font-mono font-bold text-stone-100"
                    >
                      {(
                        ['IDR', 'USD', 'AUD', 'EUR', 'SGD'] as CurrencyCode[]
                      ).map((c) => (
                        <option key={c} value={c} className="text-stone-100">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Search Icon Button */}
            <button
              type="button"
              onClick={() => {
                setActiveNav('destinations');
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 80);
              }}
              aria-label={
                lang === 'id' ? 'Cari destinasi' : 'Search destinations'
              }
              title={lang === 'id' ? 'Cari destinasi' : 'Search destinations'}
              className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-stone-300 hover:bg-white/10 hover:text-white transition"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle Dark Mode"
              className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-stone-300 hover:bg-white/10 hover:text-white transition"
            >
              {darkMode ? (
                <Sun className="h-4 w-4 text-[#E5B869]" />
              ) : (
                <Moon className="h-4 w-4 text-stone-300" />
              )}
            </button>

            {/* Circular User Profile Avatar with Active Status Indicator */}
            <button
              type="button"
              onClick={() => setActiveNav('profile')}
              aria-label={
                lang === 'id' ? 'Profil & Sistem' : 'Profile & Settings'
              }
              title={lang === 'id' ? 'Profil & Sistem' : 'Profile & Settings'}
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                activeNav === 'profile'
                  ? 'border-[#E5B869] bg-[#103828] text-[#E5B869]'
                  : 'border-white/20 bg-stone-800 text-stone-200 hover:border-[#E5B869]/60'
              }`}
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="h-full w-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="h-4 w-4" />
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070708]"
                title={user ? 'Cloud Synced' : 'Active Session'}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main View Content */}
      <main className="flex-1">
        {activeNav === 'home' && (
          <div className="space-y-10 pb-12">
            {/* Editorial Asymmetric Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#0B291D] via-[#103828] to-[#1D4E3B] text-amber-50 py-12 sm:py-16">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-5">
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-amber-300">
                    <Compass className="h-3.5 w-3.5" />
                    {lang === 'id'
                      ? '9 Kabupaten/Kota Bali • Nusa Penida, Lembongan & Menjangan'
                      : 'All 9 Bali Regencies • Nusa Penida, Lembongan & Menjangan'}
                  </span>
                  <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight">
                    {lang === 'id'
                      ? 'Jelajahi Bali, Rencanakan Perjalananmu Secara Cerdas.'
                      : 'Your Bali Journey, Beautifully Planned.'}
                  </h1>
                  <p className="text-sm sm:text-base text-amber-100/85 max-w-2xl leading-relaxed">
                    {lang === 'id'
                      ? 'Temukan karakter setiap destinasi, eksplorasi panorama Street View 360° sebelum berangkat, susun rute searah yang efisien tanpa bolak-balik, dan hitung transparansi biaya tiket, BBM, kapal cepat, hingga sewa kendaraan.'
                      : 'Discover every region’s character, preview 360° Street View panoramas before you go, build geographically optimized multi-stop itineraries, and calculate transparent IDR/converted costs.'}
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => setActiveNav('planner')}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-xs font-bold text-stone-950 hover:bg-amber-400 transition shadow-md"
                    >
                      <Calendar className="h-4 w-4" />
                      <span>
                        {lang === 'id'
                          ? 'Buka Smart Trip Planner'
                          : 'Open Smart Trip Planner'}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveNav('map')}
                      className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 bg-white/10 px-5 py-3 text-xs font-semibold text-amber-50 hover:bg-white/20 transition"
                    >
                      <MapIcon className="h-4 w-4" />
                      <span>
                        {lang === 'id'
                          ? 'Eksplorasi Peta Interaktif'
                          : 'Explore Interactive Map'}
                      </span>
                    </button>
                    <button
                      onClick={() => setAiDrawerOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-900/60 px-4 py-3 text-xs font-semibold text-emerald-100 hover:bg-emerald-800/70 transition"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>
                        {lang === 'id'
                          ? 'Tanya Asisten AI Bali'
                          : 'Ask AI Bali Assistant'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Right Live Trip Snapshot Card */}
                <div className="lg:col-span-5 rounded-2xl border border-white/15 bg-black/30 p-5 backdrop-blur-md space-y-4">
                  <div className="flex items-center justify-between border-b border-white/15 pb-3">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold block">
                        {lang === 'id'
                          ? 'Rencana Perjalanan Aktif Anda'
                          : 'Your Active Bali Itinerary'}
                      </span>
                      <h2 className="font-serif text-xl font-bold">
                        {activeTrip.tripName}
                      </h2>
                    </div>
                    <span className="font-mono text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-md font-bold">
                      {activeTrip.days} {lang === 'id' ? 'Hari' : 'Days'}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {activeTrip.stops.slice(0, 4).map((s) => {
                      const d = BALI_DESTINATIONS.find(
                        (x) => x.id === s.destinationId
                      );
                      return (
                        <div
                          key={s.order}
                          className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-xs"
                        >
                          <span className="truncate font-medium">
                            #{s.order} {lang === 'en' ? d?.nameEn : d?.nameId}
                          </span>
                          <span className="font-mono text-amber-300 shrink-0 ml-2">
                            {s.plannedArrival}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/15 text-xs">
                    <div>
                      <span className="text-amber-200/70 block text-[11px]">
                        {lang === 'id'
                          ? 'Total Estimasi Biaya (Termasuk Kendaraan & Tiket)'
                          : 'Total Estimated Trip Cost'}
                      </span>
                      <span className="font-mono text-lg font-bold text-amber-300">
                        {formatMoney(activeTrip.totalEstimatedCostIDR)}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveNav('planner')}
                      className="rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-stone-950"
                    >
                      {lang === 'id' ? 'Kelola Rute →' : 'Edit Route →'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Featured Destination Discovery Section */}
            <section className="mx-auto max-w-7xl px-4 sm:px-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                    {lang === 'id'
                      ? 'Kurasi Destinasi Terverifikasi Lintas Kabupaten'
                      : 'Verified Destinations Across All 9 Regencies'}
                  </p>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold">
                    {lang === 'id'
                      ? 'Jelajahi Keindahan Bali & Panorama 360°'
                      : 'Explore Bali Highlights & 360° Panoramas'}
                  </h2>
                </div>
                <button
                  onClick={() => setActiveNav('destinations')}
                  className="text-xs font-bold text-emerald-800 dark:text-amber-300 hover:underline"
                >
                  {lang === 'id'
                    ? `Lihat Semua ${BALI_DESTINATIONS.length} Destinasi Lengkap →`
                    : `Browse All ${BALI_DESTINATIONS.length} Verified Destinations →`}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {BALI_DESTINATIONS.slice(0, 8).map((dest) => (
                  <article
                    key={dest.id}
                    className="group rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div
                        onClick={() => {
                          setSelectedDest(dest);
                          setModalInitialTab('details');
                        }}
                        className="cursor-pointer relative"
                      >
                        <DestinationVisual
                          destination={dest}
                          theme={dest.visualTheme}
                          className="h-44 w-full aspect-video"
                          label={`${dest.regency} • ${dest.subIsland}`}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDest(dest);
                            setModalInitialTab('360');
                          }}
                          className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-amber-300 hover:bg-black/80 backdrop-blur-xs"
                        >
                          <Eye className="h-3 w-3" />
                          <span>360°</span>
                        </button>
                      </div>

                      <div className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-stone-500">
                          <span>{dest.area}</span>
                          <span className="font-mono font-semibold text-emerald-800 dark:text-amber-300">
                            {dest.ticketIDR.domestic === 0
                              ? lang === 'id'
                                ? 'Gratis'
                                : 'Free'
                              : formatMoney(dest.ticketIDR.domestic)}
                          </span>
                        </div>
                        <h3
                          onClick={() => {
                            setSelectedDest(dest);
                            setModalInitialTab('details');
                          }}
                          className="cursor-pointer font-serif text-lg font-bold leading-snug group-hover:text-emerald-800 dark:group-hover:text-amber-300"
                        >
                          {lang === 'en' ? dest.nameEn : dest.nameId}
                        </h3>
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2">
                          {lang === 'en'
                            ? dest.descriptionEn.overview
                            : dest.descriptionId.overview}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                      <button
                        onClick={() => {
                          setSelectedDest(dest);
                          setModalInitialTab('details');
                        }}
                        className="text-xs font-semibold text-stone-600 dark:text-stone-300 hover:underline"
                      >
                        {lang === 'id' ? 'Panduan & Cuaca' : 'Guide & Weather'}
                      </button>
                      <button
                        onClick={() => handleAddToTrip(dest)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#103828] px-3 py-1.5 text-xs font-semibold text-amber-50 hover:bg-[#174d38]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>{lang === 'id' ? 'Rute' : 'Add'}</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeNav === 'destinations' && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800 dark:text-emerald-400">
                  {lang === 'id'
                    ? 'Katalog Terverifikasi 9 Kabupaten/Kota & Kepulauan Nusa'
                    : 'Verified Directory Across All 9 Regencies & Nusa Islands'}
                </p>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold">
                  {lang === 'id'
                    ? 'Direktori Destinasi Wisata Bali'
                    : 'Bali Destination Directory'}
                </h1>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'id'
                        ? 'Cari pura, pantai, air terjun...'
                        : 'Search temple, beach, waterfall...'
                    }
                    className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 pl-8 pr-3 py-1.5 text-xs"
                  />
                </div>
                <select
                  value={regencyFilter}
                  onChange={(e) => setRegencyFilter(e.target.value)}
                  className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs"
                >
                  <option value="ALL">
                    {lang === 'id' ? 'Semua Kabupaten/Kota' : 'All Regencies'}
                  </option>
                  {ALL_REGENCIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-1.5 text-xs"
                >
                  <option value="ALL">
                    {lang === 'id' ? 'Semua Kategori' : 'All Categories'}
                  </option>
                  {ALL_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {lang === 'en' ? c.labelEn : c.labelId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDestinations.map((dest) => (
                <article
                  key={dest.id}
                  className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-hidden shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="relative">
                      <DestinationVisual
                        destination={dest}
                        theme={dest.visualTheme}
                        className="h-48 w-full aspect-video"
                        label={`${dest.regency} • ${dest.subIsland}`}
                      />
                      <button
                        onClick={() => {
                          setSelectedDest(dest);
                          setModalInitialTab('360');
                        }}
                        className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg bg-black/65 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-black/80"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Explore in 360°</span>
                      </button>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-stone-500">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {dest.openingHours}
                        </span>
                        <span className="font-mono font-bold text-emerald-800 dark:text-amber-300">
                          {dest.ticketIDR.domestic === 0
                            ? lang === 'id'
                              ? 'Gratis'
                              : 'Free'
                            : formatMoney(dest.ticketIDR.domestic)}
                        </span>
                      </div>
                      <h2 className="font-serif text-xl font-bold">
                        {lang === 'en' ? dest.nameEn : dest.nameId}
                      </h2>
                      <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-3">
                        {lang === 'en'
                          ? dest.descriptionEn.overview
                          : dest.descriptionId.overview}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                    <button
                      onClick={() => {
                        setSelectedDest(dest);
                        setModalInitialTab('details');
                      }}
                      className="text-xs font-semibold text-emerald-800 dark:text-amber-300 hover:underline"
                    >
                      {lang === 'id'
                        ? 'Baca 8 Panduan & Cuaca'
                        : 'Read 8-Part Guide & Weather'}
                    </button>
                    <button
                      onClick={() => handleAddToTrip(dest)}
                      className="inline-flex items-center gap-1 rounded-xl bg-[#103828] px-3.5 py-1.5 text-xs font-semibold text-amber-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>
                        {lang === 'id' ? 'Tambah ke Rute' : 'Add to Trip'}
                      </span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeNav === 'map' && (
          <MapExplorerView
            destinations={BALI_DESTINATIONS}
            activeTrip={activeTrip}
            onSelectDestination={(dest, tab = 'details') => {
              setSelectedDest(dest);
              setModalInitialTab(tab);
            }}
            onAddToTrip={handleAddToTrip}
          />
        )}

        {activeNav === 'planner' && (
          <TripPlannerView
            destinations={BALI_DESTINATIONS}
            activeTrip={activeTrip}
            onUpdateTrip={setActiveTrip}
            onSaveTripCloud={handleSaveTripCloud}
            onSelectDestination={(dest) => {
              setSelectedDest(dest);
              setModalInitialTab('details');
            }}
            onOpenAiAssistant={() => setAiDrawerOpen(true)}
          />
        )}

        {activeNav === 'tours' && (
          <TransportAndToursView
            activeTrip={activeTrip}
            initialSubTab="tours"
          />
        )}

        {activeNav === 'transport' && (
          <TransportAndToursView
            activeTrip={activeTrip}
            initialSubTab="transport"
          />
        )}

        {(activeNav === 'sos' ||
          activeNav === 'favorites' ||
          activeNav === 'profile') && (
          <SafetyAndAdminView
            mode={activeNav}
            user={user}
            onSignIn={async () => {
              await signInWithGoogle();
            }}
            onSignOut={signOutUser}
            savedPlaces={savedPlaces}
            onRemoveSavedPlace={async (id) => {
              const next = savedPlaces.filter((p) => p.id !== id);
              setSavedPlaces(next);
              localStorage.setItem('jb_saved_places', JSON.stringify(next));
              if (user) await removeSavedPlaceFromCloud(id);
            }}
            savedTrips={savedTrips}
            onLoadTrip={(tr) => {
              setActiveTrip(tr);
              setActiveNav('planner');
            }}
            onDeleteTrip={async (id) => {
              const next = savedTrips.filter((t) => t.id !== id);
              setSavedTrips(next);
              localStorage.setItem('jb_saved_trips', JSON.stringify(next));
              if (user) await deleteTripFromCloud(id);
            }}
            emergencyContacts={emergencyContacts}
            onAddEmergencyContact={async (c) => {
              const item: EmergencyContact = {
                ...c,
                id: `sos_${Date.now()}`,
                uid: user?.uid || 'local-guest',
                createdAt: new Date().toISOString(),
              };
              setEmergencyContacts([item, ...emergencyContacts]);
              if (user) await saveEmergencyContactToCloud(item);
            }}
            onDeleteEmergencyContact={async (id) => {
              setEmergencyContacts(
                emergencyContacts.filter((c) => c.id !== id)
              );
              if (user) await deleteEmergencyContactFromCloud(id);
            }}
            destinations={BALI_DESTINATIONS}
            onSelectDestination={(dest) => {
              setSelectedDest(dest);
              setModalInitialTab('details');
            }}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 dark:border-stone-800 bg-[#FAF7F2]/95 dark:bg-stone-950/95 backdrop-blur-md px-2 py-1.5 grid grid-cols-6 gap-1 text-[10px] font-semibold">
        {[
          {
            id: 'home',
            icon: Compass,
            label: lang === 'id' ? 'Beranda' : 'Home',
          },
          {
            id: 'destinations',
            icon: Search,
            label: lang === 'id' ? 'Destinasi' : 'Places',
          },
          {
            id: 'map',
            icon: MapIcon,
            label: lang === 'id' ? 'Peta' : 'Map',
          },
          { id: 'planner', icon: Calendar, label: 'Planner' },
          {
            id: 'transport',
            icon: Car,
            label: lang === 'id' ? 'Layanan' : 'Services',
          },
          { id: 'sos', icon: ShieldAlert, label: 'SOS' },
        ].map((m) => {
          const Icon = m.icon;
          const isAct = activeNav === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setActiveNav(m.id as NavTab)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg ${
                m.id === 'sos'
                  ? 'text-rose-700 dark:text-rose-400 font-bold'
                  : isAct
                    ? 'text-emerald-900 dark:text-amber-300 font-bold'
                    : 'text-stone-500'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{m.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Drawers */}
      <DestinationModal
        destination={selectedDest}
        onClose={() => setSelectedDest(null)}
        onAddToTrip={handleAddToTrip}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={Boolean(
          selectedDest &&
            savedPlaces.some((p) => p.placeId === selectedDest.id)
        )}
        initialTab={modalInitialTab}
        onSelectDestination={(dest) => {
          setSelectedDest(dest);
          setModalInitialTab('details');
        }}
      />

      <AiAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        onApplyRecommendation={(
          destIds,
          vehicleId,
          days = 3,
          travelers = 2
        ) => {
          const dests = destIds
            .map((id) => BALI_DESTINATIONS.find((d) => d.id === id))
            .filter((d): d is Destination => Boolean(d));
          if (dests.length === 0) return;
          const built = buildTripStops(
            activeTrip.originCoords,
            dests,
            days,
            activeTrip.departureTime,
            'balanced'
          );
          setActiveTrip({
            ...activeTrip,
            days,
            travelers,
            vehicleId: vehicleId || activeTrip.vehicleId,
            stops: built.stops,
            totalDistanceKm: built.totalDistanceKm,
            totalDurationMinutes: built.totalDurationMinutes,
          });
          setActiveNav('planner');
        }}
      />
    </div>
  );
}
