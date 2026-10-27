import { Destination, BaliRegency, DestinationCategory } from '../types';
import { BALI_DESTINATIONS_PART1 } from './baliCatalogPart1';
import { BALI_DESTINATIONS_PART2 } from './baliCatalogPart2';
import { BALI_DESTINATIONS_PART3 } from './baliCatalogPart3';
import { BALI_DESTINATIONS_PART4 } from './baliCatalogPart4';

export const BALI_DESTINATIONS: Destination[] = [
  ...BALI_DESTINATIONS_PART1,
  ...BALI_DESTINATIONS_PART2,
  ...BALI_DESTINATIONS_PART3,
  ...BALI_DESTINATIONS_PART4,
];

export const ALL_REGENCIES: BaliRegency[] = [
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

export const ALL_CATEGORIES: { id: DestinationCategory; labelId: string; labelEn: string }[] = [
  { id: 'beach', labelId: 'Pantai & Pesisir', labelEn: 'Beaches & Coast' },
  { id: 'temple_culture', labelId: 'Pura & Warisan Budaya', labelEn: 'Temples & Heritage' },
  { id: 'rice_terrace_nature', labelId: 'Sawah & Alam', labelEn: 'Rice Terraces & Nature' },
  { id: 'mountain', labelId: 'Gunung & Kaldera', labelEn: 'Mountains & Caldera' },
  { id: 'waterfall', labelId: 'Air Terjun', labelEn: 'Waterfalls' },
  { id: 'snorkeling_diving', labelId: 'Snorkeling & Diving', labelEn: 'Snorkeling & Diving' },
  { id: 'surfing', labelId: 'Selancar (Surfing)', labelEn: 'Surfing & Waves' },
  { id: 'traditional_village', labelId: 'Desa Wisata Adat', labelEn: 'Traditional Villages' },
  { id: 'culinary', labelId: 'Kuliner & Seafood', labelEn: 'Culinary & Seafood' },
];
