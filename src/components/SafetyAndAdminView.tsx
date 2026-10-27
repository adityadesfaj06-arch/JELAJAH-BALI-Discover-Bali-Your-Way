import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  MapPin,
  Copy,
  ShieldAlert,
  Lock,
  Unlock,
  Activity,
  RefreshCw,
  Bell,
  Download,
  Heart,
  Trash2,
  UserCheck,
  LogOut,
  Plus,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  Destination,
  SavedPlaceItem,
  TripPlan,
  EmergencyContact,
  SystemHealthTelemetry,
} from '../types';
import {
  INDONESIA_EMERGENCY_NUMBERS,
  buildEmergencyShareMessage,
} from '../services/sosService';
import { PRACTICAL_PLACES } from '../services/tourService';
import {
  encryptTextAESGCM,
  decryptTextAESGCM,
} from '../services/cryptoVaultService';
import {
  fetchSystemTelemetry,
  triggerCatalogRefresh24h,
  triggerSystemAutoRecovery,
  sendAnomalyAlertNotification,
} from '../services/apiClient';
import { useTranslation } from '../i18n/useTranslation';
import { DestinationVisual } from './DestinationVisual';

interface SafetyAndAdminViewProps {
  mode: 'sos' | 'favorites' | 'profile';
  user: User | null;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  savedPlaces: SavedPlaceItem[];
  onRemoveSavedPlace: (id: string) => void;
  savedTrips: TripPlan[];
  onLoadTrip: (trip: TripPlan) => void;
  onDeleteTrip: (id: string) => void;
  emergencyContacts: EmergencyContact[];
  onAddEmergencyContact: (c: Omit<EmergencyContact, 'id' | 'uid' | 'createdAt'>) => void;
  onDeleteEmergencyContact: (id: string) => void;
  destinations: Destination[];
  onSelectDestination: (dest: Destination) => void;
}

export const SafetyAndAdminView: React.FC<SafetyAndAdminViewProps> = ({
  mode,
  user,
  onSignIn,
  onSignOut,
  savedPlaces,
  onRemoveSavedPlace,
  savedTrips,
  onLoadTrip,
  onDeleteTrip,
  emergencyContacts,
  onAddEmergencyContact,
  onDeleteEmergencyContact,
  destinations,
  onSelectDestination,
}) => {
  const { lang } = useTranslation();

  // SOS GPS state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locNote, setLocNote] = useState('');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactRel, setNewContactRel] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  // E2E Encryption Vault state
  const [vaultPlain, setVaultPlain] = useState('');
  const [vaultPass, setVaultPass] = useState('');
  const [vaultCipher, setVaultCipher] = useState<string>(() => localStorage.getItem('jb_e2e_vault') || '');
  const [vaultStatus, setVaultStatus] = useState('');

  // Admin & System Operations state
  const [telemetry, setTelemetry] = useState<SystemHealthTelemetry | null>(null);
  const [cpuThreshold, setCpuThreshold] = useState(80);
  const [alertTarget, setAlertTarget] = useState('ops@jelajahbali.id');
  const [opsMessage, setOpsMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'profile') {
      fetchSystemTelemetry().then(setTelemetry).catch(() => {});
    }
  }, [mode]);

  const handleLocateGPS = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // Default fallback to central Denpasar/Kuta coordinates if permission denied in preview iframe
        setCoords({ lat: -8.6705, lng: 115.2126 });
      }
    );
  };

  const sharePayload = buildEmergencyShareMessage(lang, coords, locNote);

  const handleCopySOS = () => {
    navigator.clipboard?.writeText(sharePayload.text);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 3000);
  };

  const handleEncryptVault = async () => {
    if (!vaultPlain || !vaultPass) return;
    try {
      const payload = await encryptTextAESGCM(vaultPlain, vaultPass);
      const serialized = JSON.stringify(payload);
      setVaultCipher(serialized);
      localStorage.setItem('jb_e2e_vault', serialized);
      setVaultPlain('');
      setVaultStatus(lang === 'id' ? 'Terenkripsi AES-GCM 256-bit ✓' : 'Encrypted AES-GCM 256-bit ✓');
    } catch {
      setVaultStatus('Encryption error');
    }
  };

  const handleDecryptVault = async () => {
    if (!vaultCipher || !vaultPass) return;
    try {
      const parsed = JSON.parse(vaultCipher);
      const plain = await decryptTextAESGCM(parsed, vaultPass);
      setVaultPlain(plain);
      setVaultStatus(lang === 'id' ? 'Berhasil didekripsi ✓' : 'Decrypted successfully ✓');
    } catch {
      setVaultStatus(lang === 'id' ? 'Kata sandi salah!' : 'Invalid passphrase!');
    }
  };

  const handleExportTelemetryCSV = () => {
    if (!telemetry) return;
    const rows = telemetry.recentMetrics.map(
      (m) => `${m.timestamp},${m.cpu},${m.memory},${m.latencyMs}`
    );
    const csv = ['Timestamp,CPU_Percent,Memory_Percent,API_Latency_ms', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Jelajah_Bali_System_Report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (mode === 'sos') {
    const hospitals = PRACTICAL_PLACES.filter(
      (p) => p.category === 'hospital' || p.category === 'clinic'
    );

    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <div className="rounded-2xl border-2 border-rose-600/40 bg-rose-950/5 dark:bg-rose-950/30 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4" />
              {lang === 'id'
                ? 'Pusat Bantuan Darurat & Keamanan Wisatawan Bali'
                : 'Bali Emergency SOS & Tourist Safety Center'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold">
              {lang === 'id'
                ? 'Panggilan Cepat Darurat & Bagikan Titik GPS'
                : 'One-Tap Emergency Dispatch & Live GPS Locator'}
            </h1>
          </div>

          <button
            onClick={handleLocateGPS}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-3 text-xs font-bold text-white hover:bg-rose-600 transition shadow-sm"
          >
            <MapPin className="h-4 w-4" />
            <span>
              {coords
                ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : lang === 'id'
                  ? 'Deteksi Koordinat GPS Saya'
                  : 'Detect My GPS Coordinates'}
            </span>
          </button>
        </div>

        {/* Verified Emergency Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {INDONESIA_EMERGENCY_NUMBERS.map((em) => (
            <a
              key={em.code}
              href={`tel:${em.code}`}
              className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 hover:border-rose-500 transition flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-extrabold text-rose-700 dark:text-rose-400">
                    {em.code}
                  </span>
                  <PhoneCall className="h-4 w-4 text-rose-600" />
                </div>
                <h2 className="mt-1 font-bold text-xs">
                  {lang === 'en' ? em.nameEn : em.nameId}
                </h2>
                <p className="mt-1 text-[11px] text-stone-500">
                  {lang === 'en' ? em.descriptionEn : em.descriptionId}
                </p>
              </div>
              <span className="text-[10px] font-mono text-stone-400">
                {em.verifiedSource}
              </span>
            </a>
          ))}
        </div>

        {/* Share Location & Personal Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold">
              {lang === 'id'
                ? 'Pesan Darurat Siap Kirim (WhatsApp / SMS)'
                : 'Ready-to-Send Emergency Message'}
            </h2>
            <input
              type="text"
              value={locNote}
              onChange={(e) => setLocNote(e.target.value)}
              placeholder={
                lang === 'id'
                  ? 'Tambahkan ciri lokasi sekitar (misal: dekat gerbang utara Pura Uluwatu)...'
                  : 'Add nearby landmark note (e.g., near north gate of Uluwatu Temple)...'
              }
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2 text-xs"
            />
            <pre className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3 text-[11px] font-mono whitespace-pre-wrap">
              {sharePayload.text}
            </pre>
            <button
              onClick={handleCopySOS}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#103828] px-4 py-2 text-xs font-semibold text-amber-50"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>
                {copiedMsg
                  ? lang === 'id'
                    ? 'Pesan & Tautan Maps Disalin ✓'
                    : 'Copied to Clipboard ✓'
                  : lang === 'id'
                    ? 'Salin Pesan Darurat'
                    : 'Copy Emergency Message'}
              </span>
            </button>
          </div>

          <div className="lg:col-span-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold">
              {lang === 'id'
                ? 'Rumah Sakit Rujukan 24 Jam & Kontak Darurat Pribadi'
                : '24/7 Referral Hospitals & Personal Emergency Contacts'}
            </h2>
            <div className="space-y-2">
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 p-2.5 text-xs"
                >
                  <div>
                    <p className="font-bold">{h.name}</p>
                    <p className="text-[11px] text-stone-500">{h.address}</p>
                  </div>
                  <a
                    href={`tel:${h.phone}`}
                    className="rounded-lg bg-rose-700 px-3 py-1.5 font-mono text-xs font-bold text-white"
                  >
                    {h.phone}
                  </a>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'Nama Kontak' : 'Contact Name'}
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent px-2.5 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder={lang === 'id' ? 'Hubungan' : 'Relation'}
                  value={newContactRel}
                  onChange={(e) => setNewContactRel(e.target.value)}
                  className="rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent px-2.5 py-1.5 text-xs"
                />
                <div className="flex gap-1">
                  <input
                    type="tel"
                    placeholder="+62..."
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent px-2.5 py-1.5 text-xs font-mono"
                  />
                  <button
                    onClick={() => {
                      if (!newContactName || !newContactPhone) return;
                      onAddEmergencyContact({
                        name: newContactName,
                        relation: newContactRel || 'Family',
                        phone: newContactPhone,
                      });
                      setNewContactName('');
                      setNewContactRel('');
                      setNewContactPhone('');
                    }}
                    className="rounded-lg bg-[#103828] px-2.5 text-amber-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {emergencyContacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between text-xs bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-lg"
                >
                  <span>
                    <strong>{c.name}</strong> ({c.relation}) —{' '}
                    <a href={`tel:${c.phone}`} className="font-mono underline">
                      {c.phone}
                    </a>
                  </span>
                  <button
                    onClick={() => onDeleteEmergencyContact(c.id)}
                    className="text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (mode === 'favorites') {
    return (
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">
          {lang === 'id'
            ? 'Destinasi Favorit & Rencana Perjalanan Tersimpan'
            : 'Saved Favorites & Cloud Itineraries'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-600" />
              <span>
                {lang === 'id' ? 'Daftar Destinasi Favorit' : 'Favorite Places'} (
                {savedPlaces.length})
              </span>
            </h2>
            {savedPlaces.length === 0 ? (
              <p className="text-xs text-stone-500">
                {lang === 'id'
                  ? 'Belum ada destinasi favorit yang disimpan.'
                  : 'No favorite destinations saved yet.'}
              </p>
            ) : (
              savedPlaces.map((sp) => {
                const dest = destinations.find((d) => d.id === sp.placeId);
                return (
                  <div
                    key={sp.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 dark:border-stone-800 p-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {dest && (
                        <div
                          onClick={() => onSelectDestination(dest)}
                          className="cursor-pointer h-14 w-24 shrink-0 overflow-hidden rounded-lg"
                        >
                          <DestinationVisual
                            destination={dest}
                            theme={dest.visualTheme}
                            showAttribution={false}
                            className="h-full w-full"
                          />
                        </div>
                      )}
                      <button
                        onClick={() => dest && onSelectDestination(dest)}
                        className="text-left font-bold hover:text-emerald-800 truncate"
                      >
                        {sp.name} ({sp.regency})
                      </button>
                    </div>
                    <button
                      onClick={() => onRemoveSavedPlace(sp.id)}
                      className="text-rose-600 shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
            <h2 className="font-serif text-lg font-bold">
              {lang === 'id'
                ? 'Rencana Perjalanan Tersimpan'
                : 'Saved Trip Itineraries'}{' '}
              ({savedTrips.length})
            </h2>
            {savedTrips.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 p-3 text-xs"
              >
                <div>
                  <p className="font-bold">{tr.tripName}</p>
                  <p className="text-[11px] text-stone-500 font-mono">
                    {tr.days}d • {tr.stops.length} stops • {tr.totalDistanceKm} km
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLoadTrip(tr)}
                    className="rounded-lg bg-[#103828] px-3 py-1.5 text-amber-50 font-semibold"
                  >
                    {lang === 'id' ? 'Buka' : 'Load'}
                  </button>
                  <button
                    onClick={() => onDeleteTrip(tr.id)}
                    className="text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Profile, E2E Crypto Vault & Real-Time System Operations View
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-6">
      {/* Auth & Cloud Sync Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            {lang === 'id'
              ? 'Sinkronisasi Cloud Lintas Perangkat & Keamanan E2E'
              : 'Cross-Device Cloud Sync & End-to-End Security'}
          </span>
          <h1 className="font-serif text-2xl font-bold">
            {user
              ? `${user.displayName || user.email}`
              : lang === 'id'
                ? 'Mode Tamu Lokal (Login Google untuk Sinkronisasi Cloud)'
                : 'Local Guest Mode (Sign in with Google for Cloud Sync)'}
          </h1>
        </div>

        {user ? (
          <button
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2 text-xs font-semibold"
          >
            <LogOut className="h-4 w-4" />
            <span>{lang === 'id' ? 'Keluar Akun' : 'Sign Out'}</span>
          </button>
        ) : (
          <button
            onClick={onSignIn}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#103828] px-5 py-2.5 text-xs font-semibold text-amber-50"
          >
            <UserCheck className="h-4 w-4" />
            <span>
              {lang === 'id'
                ? 'Masuk dengan Google (Firebase Auth)'
                : 'Sign In with Google (Firebase Auth)'}
            </span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* E2E AES-GCM 256-bit Encrypted Vault */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-3">
          <h2 className="font-serif text-lg font-bold flex items-center gap-2">
            <Lock className="h-4 w-4 text-emerald-700" />
            <span>
              {lang === 'id'
                ? 'Brankas Catatan Perjalanan Terenkripsi E2E (AES-GCM 256)'
                : 'E2E Encrypted Travel Notes Vault (AES-GCM 256-bit)'}
            </span>
          </h2>
          <p className="text-xs text-stone-500">
            {lang === 'id'
              ? 'Catatan paspor, nomor polis asuransi, atau kode pemesanan dienkripsi di perangkat Anda menggunakan Web Crypto API sebelum disimpan.'
              : 'Passport notes, insurance policy numbers, or booking codes are encrypted client-side via Web Crypto API.'}
          </p>
          <textarea
            rows={3}
            value={vaultPlain}
            onChange={(e) => setVaultPlain(e.target.value)}
            placeholder={
              lang === 'id'
                ? 'Tulis catatan rahasia perjalanan Anda di sini...'
                : 'Enter confidential travel notes here...'
            }
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent p-3 text-xs"
          />
          <input
            type="password"
            value={vaultPass}
            onChange={(e) => setVaultPass(e.target.value)}
            placeholder={
              lang === 'id'
                ? 'Kata sandi enkripsi (Passphrase)...'
                : 'Encryption passphrase...'
            }
            className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-transparent px-3 py-2 text-xs"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleEncryptVault}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#103828] px-4 py-2 text-xs font-semibold text-amber-50"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{lang === 'id' ? 'Enkripsi' : 'Encrypt'}</span>
            </button>
            <button
              onClick={handleDecryptVault}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2 text-xs font-semibold"
            >
              <Unlock className="h-3.5 w-3.5" />
              <span>{lang === 'id' ? 'Dekripsi' : 'Decrypt'}</span>
            </button>
            {vaultStatus && (
              <span className="text-xs font-semibold text-emerald-700">
                {vaultStatus}
              </span>
            )}
          </div>
        </div>

        {/* Real-Time System Operations, 24h Scheduler & Anomaly Alerting */}
        <div className="lg:col-span-7 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-700" />
                <span>
                  {lang === 'id'
                    ? 'Pemantauan Performa Real-Time & Penjadwal Data 24 Jam'
                    : 'Real-Time System Telemetry & 24h Data Scheduler'}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  const res = await triggerCatalogRefresh24h();
                  setOpsMessage(
                    `Sync 24h OK (${res.verifiedCount} destinations verified)`
                  );
                  fetchSystemTelemetry().then(setTelemetry);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{lang === 'id' ? 'Sinkronkan 24J' : 'Sync 24h Now'}</span>
              </button>
              <button
                onClick={async () => {
                  const res = await triggerSystemAutoRecovery();
                  setOpsMessage(res.message);
                  fetchSystemTelemetry().then(setTelemetry);
                }}
                className="rounded-lg border border-stone-300 dark:border-stone-700 px-3 py-1.5 text-xs font-semibold"
              >
                Auto-Recover
              </button>
              <button
                onClick={handleExportTelemetryCSV}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-300 dark:border-stone-700 px-3 py-1.5 text-xs font-semibold"
              >
                <Download className="h-3.5 w-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {opsMessage && (
            <p className="rounded-lg bg-emerald-950/10 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
              {opsMessage}
            </p>
          )}

          {telemetry && (
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3">
                <span className="text-stone-500 block">CPU Load</span>
                <span className="font-mono text-lg font-bold">
                  {telemetry.cpuUsagePercent}%
                </span>
              </div>
              <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3">
                <span className="text-stone-500 block">Memory Usage</span>
                <span className="font-mono text-lg font-bold">
                  {telemetry.memoryUsedMB} MB ({telemetry.memoryUsagePercent}%)
                </span>
              </div>
              <div className="rounded-xl bg-stone-100 dark:bg-stone-800 p-3">
                <span className="text-stone-500 block">API Latency</span>
                <span className="font-mono text-lg font-bold">
                  {telemetry.apiLatencyMs} ms
                </span>
              </div>
            </div>
          )}

          {/* Threshold Alert Notification Config */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-stone-200 dark:border-stone-800 text-xs">
            <span className="font-semibold shrink-0">
              {lang === 'id' ? 'Ambang Peringatan CPU (%):' : 'CPU Alert Threshold (%):'}
            </span>
            <input
              type="number"
              value={cpuThreshold}
              onChange={(e) => setCpuThreshold(parseInt(e.target.value, 10) || 80)}
              className="w-20 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent px-2.5 py-1.5 font-mono"
            />
            <input
              type="text"
              value={alertTarget}
              onChange={(e) => setAlertTarget(e.target.value)}
              placeholder="Email / Slack channel"
              className="flex-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-transparent px-2.5 py-1.5"
            />
            <button
              onClick={async () => {
                await sendAnomalyAlertNotification({
                  channel: 'slack',
                  target: alertTarget,
                  subject: `Threshold Check (${cpuThreshold}% CPU)`,
                  metricSummary: `CPU ${telemetry?.cpuUsagePercent ?? 18}%, Memory ${telemetry?.memoryUsagePercent ?? 40}%`,
                });
                setOpsMessage(
                  lang === 'id'
                    ? `Notifikasi uji dikirim ke ${alertTarget} ✓`
                    : `Alert dispatched to ${alertTarget} ✓`
                );
                fetchSystemTelemetry().then(setTelemetry);
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 font-bold text-stone-950"
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{lang === 'id' ? 'Uji Alert' : 'Test Alert'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
