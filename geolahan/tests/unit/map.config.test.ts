import { describe, expect, it } from 'vitest';
import {
  BASE_LAYERS,
  BASE_LAYER_IDS,
  DEFAULT_BASE_LAYER,
  MAP_DEFAULTS,
  TILE_SOURCES,
  isBaseLayerId,
} from '../../src/features/map/map.config';
import { createBaseLayer } from '../../src/features/map/tile.service';
import L from 'leaflet';

describe('map.config', () => {
  it('menyediakan layer satelit, hybrid, dan peta jalan', () => {
    expect(BASE_LAYER_IDS.sort()).toEqual(['hybrid', 'osm', 'satellite']);
    expect(isBaseLayerId(DEFAULT_BASE_LAYER)).toBe(true);
  });

  it('setiap base layer merujuk ke sumber tile yang ada, dengan sumber dasar non-overlay', () => {
    for (const id of BASE_LAYER_IDS) {
      const { sources } = BASE_LAYERS[id];
      expect(sources.length).toBeGreaterThan(0);
      sources.forEach((sourceId) => expect(TILE_SOURCES).toHaveProperty(sourceId));
      const [base, ...overlays] = sources;
      expect(TILE_SOURCES[base!].isOverlay).toBe(false);
      overlays.forEach((o) => expect(TILE_SOURCES[o].isOverlay).toBe(true));
    }
  });

  it('hybrid = citra satelit + overlay label', () => {
    expect(BASE_LAYERS.hybrid.sources[0]).toBe('esriWorldImagery');
    expect(BASE_LAYERS.hybrid.sources.length).toBeGreaterThan(1);
    expect(BASE_LAYERS.hybrid.isImagery).toBe(true);
    expect(BASE_LAYERS.osm.isImagery).toBe(false);
  });

  it('setiap sumber tile memiliki atribusi, HTTPS, CORS anonymous, dan batas zoom konsisten', () => {
    for (const source of Object.values(TILE_SOURCES)) {
      expect(source.attribution.length).toBeGreaterThan(0);
      expect(source.url.startsWith('https://')).toBe(true);
      expect(source.url).toMatch(/\{z\}.*\{[xy]\}.*\{[xy]\}/);
      expect(source.crossOrigin).toBe('anonymous');
      expect(source.maxNativeZoom).toBeLessThanOrEqual(source.maxZoom);
      expect(source.maxZoom).toBeLessThanOrEqual(MAP_DEFAULTS.maxZoom);
    }
  });

  it('isBaseLayerId menolak nilai tak dikenal', () => {
    expect(isBaseLayerId('terrain')).toBe(false);
    expect(isBaseLayerId(null)).toBe(false);
    expect(isBaseLayerId('hybrid')).toBe(true);
  });
});

describe('tile.service', () => {
  it('membuat satu TileLayer per sumber dengan opsi dari konfigurasi', () => {
    const group = createBaseLayer('hybrid');
    const layers = group.getLayers() as L.TileLayer[];
    expect(layers).toHaveLength(BASE_LAYERS.hybrid.sources.length);
    layers.forEach((layer, index) => {
      const source = TILE_SOURCES[BASE_LAYERS.hybrid.sources[index]!];
      expect(layer).toBeInstanceOf(L.TileLayer);
      expect(layer.options.attribution).toBe(source.attribution);
      expect(layer.options.crossOrigin).toBe('anonymous');
      expect(layer.options.maxNativeZoom).toBe(source.maxNativeZoom);
      expect(layer.options.zIndex).toBe(index + 1);
    });
  });
});
