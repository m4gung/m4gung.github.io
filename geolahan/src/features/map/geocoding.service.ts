/**
 * Layanan geocoding (pencarian lokasi) GeoLahan Pro.
 *
 * Provider default: Nominatim OpenStreetMap. Kebijakan penggunaan Nominatim
 * (https://operations.osmfoundation.org/policies/nominatim/) mewajibkan:
 *  - maksimal 1 permintaan per detik,
 *  - TIDAK ada autocomplete / search-as-you-type,
 *  - atribusi OpenStreetMap,
 *  - caching hasil bila memungkinkan.
 * Karena itu pencarian hanya dijalankan atas tindakan eksplisit pengguna (Enter/tombol),
 * dengan throttle dan cache di sini.
 */

export interface GeocodingResult {
  id: string;
  displayName: string;
  /** Nama singkat (mis. nama desa/kota) untuk judul hasil. */
  name: string;
  lat: number;
  lon: number;
  /** [selatan, utara, barat, timur] dalam derajat WGS 84. */
  bbox?: [south: number, north: number, west: number, east: number];
  /** Kategori/tipe OSM (mis. village, administrative). */
  type: string;
}

export interface GeocodingProvider {
  readonly name: string;
  readonly attribution: string;
  search(query: string, signal?: AbortSignal): Promise<GeocodingResult[]>;
}

export type GeocodingErrorKind = 'invalid-query' | 'network' | 'http' | 'rate-limit' | 'parse' | 'aborted';

export class GeocodingError extends Error {
  readonly kind: GeocodingErrorKind;
  constructor(kind: GeocodingErrorKind, message: string) {
    super(message);
    this.name = 'GeocodingError';
    this.kind = kind;
  }
}

export const MIN_QUERY_LENGTH = 3;
export const MAX_QUERY_LENGTH = 200;

export interface NominatimOptions {
  endpoint: string;
  /** Batas jumlah hasil (1–10). */
  limit?: number;
  /** Kode negara ISO dipisah koma, mis. "id". */
  countryCodes?: string;
  /** Email kontak opsional sesuai kebijakan Nominatim. */
  email?: string;
  acceptLanguage?: string;
  /** Jeda minimum antarpermintaan (ms). Default 1100 ms (> 1 req/detik). */
  minIntervalMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new GeocodingError('aborted', 'Pencarian dibatalkan.'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(timer);
      reject(new GeocodingError('aborted', 'Pencarian dibatalkan.'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFiniteNumber(value: unknown): number | null {
  const num = typeof value === 'string' ? Number.parseFloat(value) : typeof value === 'number' ? value : NaN;
  return Number.isFinite(num) ? num : null;
}

export function isValidLatLon(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

/** Mengubah satu item respons Nominatim menjadi GeocodingResult, atau null bila tidak valid. */
export function parseNominatimItem(item: unknown): GeocodingResult | null {
  if (!isRecord(item)) return null;
  const lat = toFiniteNumber(item.lat);
  const lon = toFiniteNumber(item.lon);
  if (lat === null || lon === null || !isValidLatLon(lat, lon)) return null;

  const displayName = typeof item.display_name === 'string' ? item.display_name : '';
  if (!displayName) return null;

  const name =
    typeof item.name === 'string' && item.name.trim() !== '' ? item.name : (displayName.split(',')[0] ?? displayName);

  let bbox: GeocodingResult['bbox'];
  if (Array.isArray(item.boundingbox) && item.boundingbox.length === 4) {
    const [s, n, w, e] = item.boundingbox.map(toFiniteNumber);
    if (
      s != null && n != null && w != null && e != null &&
      isValidLatLon(s, w) && isValidLatLon(n, e) && s <= n
    ) {
      bbox = [s, n, w, e];
    }
  }

  const osmType = typeof item.osm_type === 'string' ? item.osm_type : 'x';
  const osmId = typeof item.osm_id === 'number' || typeof item.osm_id === 'string' ? String(item.osm_id) : '';
  const placeId = typeof item.place_id === 'number' || typeof item.place_id === 'string' ? String(item.place_id) : '';
  const id = osmId ? `${osmType}:${osmId}` : placeId || `${lat},${lon}`;

  const type =
    typeof item.addresstype === 'string' ? item.addresstype : typeof item.type === 'string' ? item.type : 'place';

  return { id, displayName, name, lat, lon, bbox, type };
}

export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ');
}

export class NominatimProvider implements GeocodingProvider {
  readonly name = 'Nominatim';
  readonly attribution = 'Pencarian © OpenStreetMap contributors (Nominatim)';

  private readonly options: Required<Omit<NominatimOptions, 'email' | 'countryCodes'>> &
    Pick<NominatimOptions, 'email' | 'countryCodes'>;
  private readonly cache = new Map<string, GeocodingResult[]>();
  private lastRequestAt = Number.NEGATIVE_INFINITY;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options: NominatimOptions) {
    this.options = {
      endpoint: options.endpoint.replace(/\/+$/, ''),
      limit: Math.min(Math.max(options.limit ?? 5, 1), 10),
      countryCodes: options.countryCodes?.trim() || undefined,
      email: options.email?.trim() || undefined,
      acceptLanguage: options.acceptLanguage ?? 'id',
      minIntervalMs: options.minIntervalMs ?? 1100,
      fetchImpl: options.fetchImpl ?? ((...args) => globalThis.fetch(...args)),
      now: options.now ?? (() => Date.now()),
      sleep: options.sleep ?? defaultSleep,
    };
  }

  buildUrl(query: string): string {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      limit: String(this.options.limit),
      addressdetails: '0',
      'accept-language': this.options.acceptLanguage,
    });
    if (this.options.countryCodes) params.set('countrycodes', this.options.countryCodes);
    if (this.options.email) params.set('email', this.options.email);
    return `${this.options.endpoint}/search?${params.toString()}`;
  }

  async search(rawQuery: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
    const query = normalizeQuery(rawQuery);
    if (query.length < MIN_QUERY_LENGTH) {
      throw new GeocodingError('invalid-query', `Masukkan minimal ${MIN_QUERY_LENGTH} karakter.`);
    }
    if (query.length > MAX_QUERY_LENGTH) {
      throw new GeocodingError('invalid-query', `Kata kunci maksimal ${MAX_QUERY_LENGTH} karakter.`);
    }

    const cacheKey = query.toLowerCase();
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Antrikan permintaan agar throttle berlaku berurutan walau dipanggil bersamaan.
    const run = this.queue.then(() => this.throttledFetch(query, signal));
    this.queue = run.catch(() => undefined);
    const results = await run;
    this.cache.set(cacheKey, results);
    return results;
  }

  private async throttledFetch(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
    if (signal?.aborted) throw new GeocodingError('aborted', 'Pencarian dibatalkan.');
    const wait = this.lastRequestAt + this.options.minIntervalMs - this.options.now();
    if (wait > 0) await this.options.sleep(wait, signal);
    this.lastRequestAt = this.options.now();

    let response: Response;
    try {
      response = await this.options.fetchImpl(this.buildUrl(query), {
        signal,
        headers: { Accept: 'application/json' },
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new GeocodingError('aborted', 'Pencarian dibatalkan.');
      }
      throw new GeocodingError('network', 'Tidak dapat terhubung ke layanan pencarian. Periksa koneksi internet.');
    }

    if (response.status === 429) {
      throw new GeocodingError('rate-limit', 'Terlalu banyak permintaan pencarian. Tunggu sebentar lalu coba lagi.');
    }
    if (!response.ok) {
      throw new GeocodingError('http', `Layanan pencarian mengembalikan kesalahan (HTTP ${response.status}).`);
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new GeocodingError('parse', 'Respons layanan pencarian tidak dapat dibaca.');
    }
    if (!Array.isArray(data)) {
      throw new GeocodingError('parse', 'Format respons layanan pencarian tidak dikenali.');
    }

    return data.map(parseNominatimItem).filter((r): r is GeocodingResult => r !== null);
  }
}

/** Membuat provider default dari variabel lingkungan Vite. */
export function createDefaultGeocoder(): GeocodingProvider {
  const env = import.meta.env;
  return new NominatimProvider({
    endpoint: env.VITE_GEOCODER_URL || 'https://nominatim.openstreetmap.org',
    countryCodes: env.VITE_GEOCODER_COUNTRYCODES ?? 'id',
    email: env.VITE_GEOCODER_EMAIL,
    limit: 5,
  });
}

let sharedGeocoder: GeocodingProvider | null = null;

/** Instance bersama agar throttle dan cache berlaku untuk seluruh aplikasi. */
export function getGeocoder(): GeocodingProvider {
  sharedGeocoder ??= createDefaultGeocoder();
  return sharedGeocoder;
}
