/**
 * Tipe data untuk perhitungan geometri dan pengukuran lahan.
 */

import type { Polygon } from 'geojson';

export interface ControlPoint {
  /** ID unik untuk patok (mis. P1, P2) */
  id: string;
  /** Nomor urut patok: 1, 2, 3... */
  number: number;
  /** Label tampilan patok: 'P1', 'P2'... */
  label: string;
  /** Latitude dalam derajat desimal WGS 84 */
  latitude: number;
  /** Longitude dalam derajat desimal WGS 84 */
  longitude: number;
  /** Jarak ke patok berikutnya dalam meter (geodesik) */
  distanceToNextM: number;
}

export interface SegmentInfo {
  index: number;
  fromLabel: string;
  toLabel: string;
  distanceM: number;
  midpoint: [number, number]; // [lat, lng] untuk penempatan label
}

export interface MeasurementResult {
  /** Geometri GeoJSON Polygon standar */
  geometry: Polygon;
  /** Luas dalam meter persegi (m²) */
  areaM2: number;
  /** Luas dalam Are (1 are = 100 m²) */
  areaAre: number;
  /** Luas dalam Hektare (1 ha = 10.000 m²) */
  areaHa: number;
  /** Keliling total dalam meter */
  perimeterM: number;
  /** Titik pusat [lat, lon] */
  centroid: [number, number];
  /** Titik patok terurut (P1, P2... Pn) */
  controlPoints: ControlPoint[];
  /** Informasi segmen sisi untuk label peta */
  segments: SegmentInfo[];
  /** Status validitas geometri */
  isValid: boolean;
  /** Pesan error jika poligon tidak valid */
  validationError?: string;
}

export type MeasurementMode = 'idle' | 'draw' | 'edit';

export const PARCEL_COLORS = [
  { name: 'Emerald', hex: '#059669', border: '#047857' },
  { name: 'Blue', hex: '#2563eb', border: '#1d4ed8' },
  { name: 'Amber', hex: '#d97706', border: '#b45309' },
  { name: 'Red', hex: '#dc2626', border: '#b91c1c' },
  { name: 'Purple', hex: '#9333ea', border: '#7e22ce' },
] as const;

export type ParcelColor = (typeof PARCEL_COLORS)[number]['hex'];
