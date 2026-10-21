import L from 'leaflet';
import { BASE_LAYERS, TILE_SOURCES, type BaseLayerId, type TileSourceConfig } from './map.config';

export interface BaseLayerHandlers {
  /** Dipanggil saat tile gagal dimuat (mis. offline atau diblokir). Dibatasi agar tidak membanjiri UI. */
  onTileError?: (sourceUrl: string) => void;
}

export function createTileLayer(source: TileSourceConfig, zIndex: number): L.TileLayer {
  return L.tileLayer(source.url, {
    attribution: source.attribution,
    maxNativeZoom: source.maxNativeZoom,
    maxZoom: source.maxZoom,
    crossOrigin: source.crossOrigin,
    zIndex,
    // Tile overlay dimuat setelah tile dasar agar citra muncul lebih dulu.
    updateWhenIdle: source.isOverlay,
  });
}

/**
 * Membangun LayerGroup untuk satu base layer (satelit, hybrid, atau OSM).
 * Sumber pertama adalah dasar, sumber berikutnya ditumpuk di atasnya.
 */
export function createBaseLayer(id: BaseLayerId, handlers: BaseLayerHandlers = {}): L.LayerGroup {
  const config = BASE_LAYERS[id];
  const group = L.layerGroup();

  config.sources.forEach((sourceId, index) => {
    const source = TILE_SOURCES[sourceId];
    const layer = createTileLayer(source, index + 1);
    if (handlers.onTileError) {
      const notify = handlers.onTileError;
      layer.on('tileerror', () => notify(source.url));
    }
    group.addLayer(layer);
  });

  return group;
}
