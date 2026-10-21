import type { Polygon } from 'geojson';
import type { ControlPoint, ParcelColor } from '../measurement/measurement.types';

export type MeasurementMethod = 'map_digitization' | 'gps_mobile' | 'combined';

export interface Parcel {
  /** ID unik UUID v4 */
  id: string;
  /** Nama bidang tanah / identitas lahan */
  name: string;
  /** Nama pemilik / pemegang hak */
  owner?: string;
  /** Deskripsi atau peruntukan lahan */
  description?: string;
  /** Warna garis dan isian poligon di peta */
  color: ParcelColor;
  /** Tanggal pengukuran dilakukan (format ISO string YYYY-MM-DD) */
  measuredAt: string;
  /** Waktu pembuatan data di aplikasi (ISO string) */
  createdAt: string;
  /** Waktu pembaruan data terakhir (ISO string) */
  updatedAt: string;
  /** Geometri GeoJSON Polygon standar WGS 84 */
  geometry: Polygon;
  /** Luas dalam meter persegi (m²) */
  areaM2: number;
  /** Luas dalam satuan Are */
  areaAre: number;
  /** Luas dalam satuan Hektare (Ha) */
  areaHa: number;
  /** Keliling total batas bidang dalam meter */
  perimeterM: number;
  /** Koordinat titik pusat [lat, lon] */
  centroid: [number, number];
  /** Metode pengukuran yang digunakan */
  measurementMethod: MeasurementMethod;
  /** Estimasi akurasi GPS jika menggunakan metode GPS (meter) */
  gpsAccuracyM?: number;
  /** Daftar patok batas berurutan (P1, P2... Pn) */
  controlPoints: ControlPoint[];
  /** Catatan kondisi batas atau pengukuran */
  notes?: string;
}

export interface CreateParcelInput {
  name: string;
  owner?: string;
  description?: string;
  color?: ParcelColor;
  measuredAt?: string;
  measurementMethod?: MeasurementMethod;
  gpsAccuracyM?: number;
  notes?: string;
  geometry: Polygon;
  areaM2: number;
  areaAre: number;
  areaHa: number;
  perimeterM: number;
  centroid: [number, number];
  controlPoints: ControlPoint[];
}

export interface UpdateParcelInput {
  name?: string;
  owner?: string;
  description?: string;
  color?: ParcelColor;
  measuredAt?: string;
  measurementMethod?: MeasurementMethod;
  gpsAccuracyM?: number;
  notes?: string;
  geometry?: Polygon;
  areaM2?: number;
  areaAre?: number;
  areaHa?: number;
  perimeterM?: number;
  centroid?: [number, number];
  controlPoints?: ControlPoint[];
}
