export interface EmergencyNumber {
  code: string;
  nameId: string;
  nameEn: string;
  descriptionId: string;
  descriptionEn: string;
  category: 'general' | 'police' | 'medical' | 'fire' | 'sar';
  verifiedSource: string;
}

export const INDONESIA_EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    code: '112',
    nameId: 'Layanan Darurat Terpadu (112)',
    nameEn: 'Unified Emergency Call (112)',
    descriptionId: 'Nomor panggilan darurat tunggal bebas pulsa Pemerintah Provinsi/Kabupaten di Bali.',
    descriptionEn: 'Toll-free integrated emergency dispatch center across Bali.',
    category: 'general',
    verifiedSource: 'Kementerian Kominfo & BPBD Provinsi Bali',
  },
  {
    code: '110',
    nameId: 'Kepolisian RI & Polisi Pariwisata (110)',
    nameEn: 'National & Tourist Police (110)',
    descriptionId: 'Layanan darurat kepolisian untuk tindak kriminal, kehilangan dokumen penting, atau kecelakaan lalu lintas.',
    descriptionEn: 'Police emergency line for security incidents, lost passports, or road accidents.',
    category: 'police',
    verifiedSource: 'Polda Bali (Ditpamobvit Polisi Pariwisata)',
  },
  {
    code: '119',
    nameId: 'Ambulans & Kegawatdaruratan Medis PSC (118 / 119)',
    nameEn: 'Medical Emergency & Ambulance PSC (118 / 119)',
    descriptionId: 'Public Safety Center (PSC 119) untuk pengiriman ambulans dan pertolongan medis darurat.',
    descriptionEn: 'Public Safety Center (PSC 119) for emergency medical dispatch and ambulance.',
    category: 'medical',
    verifiedSource: 'Kementerian Kesehatan RI & Dinas Kesehatan Provinsi Bali',
  },
  {
    code: '115',
    nameId: 'BASARNAS — Pencarian & Pertolongan Laut/Gunung (115)',
    nameEn: 'BASARNAS Search & Rescue (115)',
    descriptionId: 'Operasi penyelamatan tersesat di pendakian gunung, air terjun, atau insiden di perairan/laut.',
    descriptionEn: 'National Search and Rescue Agency for mountain hiking, waterfall, or maritime emergencies.',
    category: 'sar',
    verifiedSource: 'Kantor Pencarian dan Pertolongan (Basarnas) Kelas A Denpasar',
  },
  {
    code: '113',
    nameId: 'Pemadam Kebakaran & Penyelamatan (113)',
    nameEn: 'Fire & Rescue Department (113)',
    descriptionId: 'Penanganan kebakaran dan evakuasi penyelamatan teknis.',
    descriptionEn: 'Fire response and technical rescue operations.',
    category: 'fire',
    verifiedSource: 'Dinas Pemadam Kebakaran dan Penyelamatan Kab/Kota Bali',
  },
];

export function buildEmergencyShareMessage(
  lang: 'id' | 'en',
  coords: { lat: number; lng: number } | null,
  manualLocationNote: string
): { text: string; mapsUrl: string | null } {
  const mapsUrl = coords
    ? `https://www.google.com/maps?q=${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`
    : null;

  if (lang === 'en') {
    const locPart = coords
      ? `Coordinates: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}\nGoogle Maps Link: ${mapsUrl}`
      : `Location Note: ${manualLocationNote || 'GPS unavailable — please call me immediately.'}`;
    return {
      text: `[SOS EMERGENCY — JELAJAH BALI]\nI need immediate assistance in Bali.\n${locPart}\nTimestamp: ${new Date().toISOString()}`,
      mapsUrl,
    };
  }

  const locPart = coords
    ? `Koordinat GPS: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}\nTautan Google Maps: ${mapsUrl}`
    : `Catatan Lokasi: ${manualLocationNote || 'GPS belum aktif — mohon hubungi saya segera.'}`;

  return {
    text: `[DARURAT SOS — JELAJAH BALI]\nSaya membutuhkan bantuan segera di Bali.\n${locPart}\nWaktu: ${new Date().toISOString()}`,
    mapsUrl,
  };
}
