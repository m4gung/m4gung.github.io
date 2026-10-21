import { describe, expect, it, vi } from 'vitest';
import {
  GeocodingError,
  NominatimProvider,
  normalizeQuery,
  parseNominatimItem,
} from '../../src/features/map/geocoding.service';

/** Fixture yang meniru bentuk respons Nominatim `format=jsonv2` (nilai ditulis tangan). */
const SLEMAN = {
  place_id: 123,
  osm_type: 'relation',
  osm_id: 5615633,
  lat: '-7.7155',
  lon: '110.3556',
  name: 'Sleman',
  display_name: 'Sleman, Daerah Istimewa Yogyakarta, Indonesia',
  addresstype: 'county',
  type: 'administrative',
  boundingbox: ['-7.8', '-7.5', '110.2', '110.5'],
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function makeProvider(fetchImpl: typeof fetch, extra: Partial<ConstructorParameters<typeof NominatimProvider>[0]> = {}) {
  let clock = 0;
  const sleep = vi.fn(async (ms: number) => {
    clock += ms;
  });
  const provider = new NominatimProvider({
    endpoint: 'https://nominatim.example.org/',
    countryCodes: 'id',
    limit: 5,
    fetchImpl,
    now: () => clock,
    sleep,
    ...extra,
  });
  return { provider, sleep, advance: (ms: number) => (clock += ms) };
}

describe('parseNominatimItem', () => {
  it('mengurai item valid termasuk bounding box', () => {
    expect(parseNominatimItem(SLEMAN)).toEqual({
      id: 'relation:5615633',
      name: 'Sleman',
      displayName: 'Sleman, Daerah Istimewa Yogyakarta, Indonesia',
      lat: -7.7155,
      lon: 110.3556,
      bbox: [-7.8, -7.5, 110.2, 110.5],
      type: 'county',
    });
  });

  it('menolak koordinat di luar rentang WGS 84', () => {
    expect(parseNominatimItem({ ...SLEMAN, lat: '95' })).toBeNull();
    expect(parseNominatimItem({ ...SLEMAN, lon: '-181' })).toBeNull();
    expect(parseNominatimItem({ ...SLEMAN, lat: 'abc' })).toBeNull();
  });

  it('menolak item tanpa display_name atau bukan objek', () => {
    expect(parseNominatimItem({ ...SLEMAN, display_name: '' })).toBeNull();
    expect(parseNominatimItem(null)).toBeNull();
    expect(parseNominatimItem('Sleman')).toBeNull();
  });

  it('mengabaikan bounding box yang tidak valid tanpa membuang hasil', () => {
    const result = parseNominatimItem({ ...SLEMAN, boundingbox: ['-7.5', '-7.8', '110.2', '110.5'] });
    expect(result).not.toBeNull();
    expect(result?.bbox).toBeUndefined();
  });

  it('memakai bagian pertama display_name bila name kosong', () => {
    expect(parseNominatimItem({ ...SLEMAN, name: '' })?.name).toBe('Sleman');
  });
});

describe('normalizeQuery', () => {
  it('memangkas dan merapikan spasi', () => {
    expect(normalizeQuery('  Desa   Sukamaju \n ')).toBe('Desa Sukamaju');
  });
});

describe('NominatimProvider', () => {
  it('membangun URL dengan parameter yang sesuai kebijakan', () => {
    const { provider } = makeProvider(vi.fn<typeof fetch>(), { email: 'ops@example.org' });
    const url = new URL(provider.buildUrl('Kabupaten Sleman'));
    expect(url.origin + url.pathname).toBe('https://nominatim.example.org/search');
    expect(url.searchParams.get('q')).toBe('Kabupaten Sleman');
    expect(url.searchParams.get('format')).toBe('jsonv2');
    expect(url.searchParams.get('limit')).toBe('5');
    expect(url.searchParams.get('countrycodes')).toBe('id');
    expect(url.searchParams.get('accept-language')).toBe('id');
    expect(url.searchParams.get('email')).toBe('ops@example.org');
  });

  it('membatasi limit ke rentang 1–10', () => {
    const { provider } = makeProvider(vi.fn<typeof fetch>(), { limit: 50 });
    expect(new URL(provider.buildUrl('abc')).searchParams.get('limit')).toBe('10');
  });

  it('mengembalikan hasil valid dan membuang item rusak', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([SLEMAN, { lat: 'x' }]));
    const { provider } = makeProvider(fetchImpl);
    const results = await provider.search('Sleman');
    expect(results).toHaveLength(1);
    expect(results[0]?.name).toBe('Sleman');
  });

  it('menolak kata kunci terlalu pendek tanpa mengirim permintaan', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const { provider } = makeProvider(fetchImpl);
    await expect(provider.search('  ab ')).rejects.toMatchObject({ kind: 'invalid-query' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('memakai cache untuk kata kunci yang sama (tidak peka huruf besar/spasi)', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => jsonResponse([SLEMAN]));
    const { provider } = makeProvider(fetchImpl);
    await provider.search('Sleman');
    await provider.search('  sleman ');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('menjaga jeda minimal antarpermintaan (throttle ≥ 1 detik)', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => jsonResponse([SLEMAN]));
    const { provider, sleep } = makeProvider(fetchImpl, { minIntervalMs: 1100 });
    await provider.search('Sleman');
    await provider.search('Bantul');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep.mock.calls[0]?.[0]).toBe(1100);
  });

  it('tidak menunggu bila jeda sudah terlewati', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => jsonResponse([SLEMAN]));
    const { provider, sleep, advance } = makeProvider(fetchImpl);
    await provider.search('Sleman');
    advance(5000);
    await provider.search('Bantul');
    expect(sleep).not.toHaveBeenCalled();
  });

  it('memetakan kegagalan jaringan menjadi GeocodingError "network"', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('Failed to fetch'));
    const { provider } = makeProvider(fetchImpl);
    const error = await provider.search('Sleman').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GeocodingError);
    expect((error as GeocodingError).kind).toBe('network');
  });

  it('memetakan HTTP 429 menjadi "rate-limit" dan HTTP 500 menjadi "http"', async () => {
    const f429 = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 429));
    await expect(makeProvider(f429).provider.search('Sleman')).rejects.toMatchObject({ kind: 'rate-limit' });
    const f500 = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({}, 500));
    await expect(makeProvider(f500).provider.search('Sleman')).rejects.toMatchObject({ kind: 'http' });
  });

  it('memetakan respons bukan array menjadi "parse"', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ error: 'x' }));
    await expect(makeProvider(fetchImpl).provider.search('Sleman')).rejects.toMatchObject({ kind: 'parse' });
  });

  it('tidak menyimpan error ke cache sehingga pencarian dapat diulang', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('offline'))
      .mockResolvedValueOnce(jsonResponse([SLEMAN]));
    const { provider } = makeProvider(fetchImpl);
    await expect(provider.search('Sleman')).rejects.toMatchObject({ kind: 'network' });
    await expect(provider.search('Sleman')).resolves.toHaveLength(1);
  });

  it('melaporkan "aborted" bila sinyal sudah dibatalkan', async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    const controller = new AbortController();
    controller.abort();
    await expect(makeProvider(fetchImpl).provider.search('Sleman', controller.signal)).rejects.toMatchObject({
      kind: 'aborted',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
