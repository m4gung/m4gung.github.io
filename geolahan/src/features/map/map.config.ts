/**
 * Konfigurasi peta terpusat untuk GeoLahan Pro.
 *
 * Semua URL tile, atribusi, dan batas zoom didefinisikan di sini agar provider
 * dapat diganti tanpa menyentuh komponen UI. Atribusi WAJIB dipertahankan.
 */

export type BaseLayerId = 'satellite' | 'hybrid' | 'osm';

/** Status izin penggunaan citra provider di dalam laporan/ekspor (dipakai fase PDF). */
export type ImageExportPermission = 'unknown' | 'allowed' | 'not-allowed';

export interface TileSourceConfig {
  /** Template URL Leaflet ({z}/{x}/{y}). */
  url: string;
  /** Atribusi HTML yang ditampilkan di kontrol atribusi Leaflet. */
  attribution: string;
  /** Zoom tertinggi yang benar-benar disediakan server tile. */
  maxNativeZoom: number;
  /** Zoom tertinggi yang diizinkan (di atas maxNativeZoom tile akan diperbesar). */
  maxZoom: number;
  /** Diisi 'anonymous' bila server mengirim header CORS (diperlukan untuk capture PDF). */
  crossOrigin?: 'anonymous';
  /** true untuk layer referensi transparan (label/jalan) yang ditumpuk di atas citra. */
  isOverlay: boolean;
  /** Menandai apakah ekspor citra diizinkan. 'unknown' = harus diverifikasi sebelum dipakai di PDF. */
  imageExport: ImageExportPermission;
  /** Halaman ketentuan penggunaan provider. */
  termsUrl: string;
}

const ESRI_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

const ESRI_TERMS = 'https://www.esri.com/en-us/legal/terms/full-master-agreement';

export const TILE_SOURCES = {
  esriWorldImagery: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: ESRI_ATTRIBUTION,
    maxNativeZoom: 19,
    maxZoom: 21,
    crossOrigin: 'anonymous',
    isOverlay: false,
    imageExport: 'unknown',
    termsUrl: ESRI_TERMS,
  },
  esriTransportation: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Jalan &copy; Esri',
    maxNativeZoom: 19,
    maxZoom: 21,
    crossOrigin: 'anonymous',
    isOverlay: true,
    imageExport: 'unknown',
    termsUrl: ESRI_TERMS,
  },
  esriBoundariesPlaces: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Label &copy; Esri',
    maxNativeZoom: 19,
    maxZoom: 21,
    crossOrigin: 'anonymous',
    isOverlay: true,
    imageExport: 'unknown',
    termsUrl: ESRI_TERMS,
  },
  openStreetMap: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
    maxZoom: 21,
    crossOrigin: 'anonymous',
    isOverlay: false,
    imageExport: 'unknown',
    termsUrl: 'https://operations.osmfoundation.org/policies/tiles/',
  },
} as const satisfies Record<string, TileSourceConfig>;

export type TileSourceId = keyof typeof TILE_SOURCES;

export interface BaseLayerConfig {
  id: BaseLayerId;
  label: string;
  description: string;
  /** Urutan dari bawah ke atas: sumber pertama adalah dasar, sisanya overlay. */
  sources: readonly TileSourceId[];
  /** true bila layer menampilkan citra satelit (dipakai untuk label jujur di PDF). */
  isImagery: boolean;
}

export const BASE_LAYERS: Record<BaseLayerId, BaseLayerConfig> = {
  satellite: {
    id: 'satellite',
    label: 'Satelit',
    description: 'Citra satelit Esri World Imagery',
    sources: ['esriWorldImagery'],
    isImagery: true,
  },
  hybrid: {
    id: 'hybrid',
    label: 'Hybrid',
    description: 'Citra satelit + label jalan & tempat',
    sources: ['esriWorldImagery', 'esriTransportation', 'esriBoundariesPlaces'],
    isImagery: true,
  },
  osm: {
    id: 'osm',
    label: 'Peta Jalan',
    description: 'OpenStreetMap untuk navigasi',
    sources: ['openStreetMap'],
    isImagery: false,
  },
};

export const BASE_LAYER_IDS = Object.keys(BASE_LAYERS) as BaseLayerId[];

export const DEFAULT_BASE_LAYER: BaseLayerId = 'satellite';

export function isBaseLayerId(value: unknown): value is BaseLayerId {
  return typeof value === 'string' && value in BASE_LAYERS;
}

export const MAP_DEFAULTS = {
  /** Pusat Indonesia. */
  center: [-2.5, 118] as [number, number],
  zoom: 5,
  minZoom: 3,
  maxZoom: 21,
  /** Zoom saat memusatkan ke hasil pencarian yang tidak memiliki bounding box. */
  searchResultZoom: 16,
  /** Padding (px) saat fitBounds. */
  fitBoundsPadding: 40,
} as const;
