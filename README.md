# JELAJAH BALI — Discover Bali, Your Way

**Tagline**: *"Your Bali Journey, Beautifully Planned."* / *"Jelajahi Bali, Rencanakan Perjalananmu."*

Aplikasi web progresif (PWA) full-stack untuk eksplorasi destinasi wisata seluruh Bali (9 Kabupaten/Kota & Kepulauan Nusa), peta interaktif Google Maps, eksplorasi panorama 360° Street View, perencana perjalanan multi-perhentian cerdas, kalkulator transportasi & biaya transparan, direktori paket tur lokal, brankas enkripsi E2E AES-GCM 256-bit, pusat keselamatan darurat SOS, dan dasbor pemantauan operasional real-time.

---

## Arsitektur & Teknologi

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Lucide Icons + `@vis.gl/react-google-maps`
- **Backend**: Express.js (`server.ts`) pada port `3000`
- **AI Engine**: `@google/genai` (`gemini-3.8-flash`) di sisi server (`/api/gemini/assistant`)
- **Geospasial & Cuaca**:
  - Google Maps JavaScript API (`AdvancedMarker`, `StreetViewPanorama`, `StreetViewService`)
  - Google Places API (New) (`/api/places/search`)
  - Google Routes API (`/api/routes/compute`)
  - Google Maps Platform Weather API (`/api/weather`)
- **Autentikasi & Cloud Sync**: Firebase Authentication (Google Sign-In) & Cloud Firestore (`users`, `savedPlaces`, `trips`, `emergencyContacts`) dengan aturan keamanan `firestore.rules` tervalidasi.
- **Keamanan & Privasi**: Enkripsi sisi klien (End-to-End) berbasis Web Crypto API (`AES-GCM` 256-bit dengan `PBKDF2` 100.000 iterasi) di `src/services/cryptoVaultService.ts`.

---

## Konfigurasi Environment Variables (`.env.example`)

1. `GEMINI_API_KEY`: Kunci API Gemini (disuntikkan secara otomatis di server runtime).
2. `VITE_GOOGLE_MAPS_API_KEY`: Kunci API Google Maps Platform untuk peta interaktif, Street View 360°, Places, Routes, dan Weather.
3. `SLACK_WEBHOOK_URL` *(opsional)*: Endpoint Webhook Slack untuk notifikasi anomali performa sistem.

---

## Pengujian Unit

Jalankan pengujian logika murni (kalkulator harga, optimasi urutan geografis, Haversine, rekomendasi tur, dan format SOS):

```bash
npx tsx --test src/services/travelLogic.test.ts
```
