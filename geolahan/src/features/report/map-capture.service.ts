/**
 * Menangkap citra peta untuk laporan PDF memakai peta cetak terpisah (di luar layar),
 * sehingga sidebar, dialog, dan kontrol tidak ikut tertangkap.
 * Tidak memakai allowTaint; bila CORS/tile gagal, fungsi melempar error (tanpa citra palsu).
 */

import L from 'leaflet';
import type { Parcel } from '../parcels/parcel.types';
import { TILE_SOURCES } from '../map/map.config';
import { createTileLayer } from '../map/tile.service';

export interface MapCapture {
  dataUrl: string;
  width: number;
  height: number;
  /** Teks atribusi penyedia citra yang wajib dicantumkan. */
  attribution: string;
  layerLabel: string;
}

export const MAP_CAPTURE_TIMEOUT_MS = 12_000;
/** Esri menampilkan tile placeholder "Map data not yet available" di zoom tinggi pada banyak area. */
export const PRINT_MAX_ZOOM = 17;

/** Periksa piksel sampel: citra nyata memiliki variasi warna, kanvas kosong tidak. */
export function canvasHasImagery(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d');
  if (!ctx || canvas.width === 0 || canvas.height === 0) return false;
  const colors = new Set<number>();
  const steps = 12;
  for (let i = 1; i < steps; i++) {
    for (let j = 1; j < steps; j++) {
      const d = ctx.getImageData(Math.floor((canvas.width * i) / steps), Math.floor((canvas.height * j) / steps), 1, 1).data;
      colors.add(((d[0]! >> 4) << 8) | ((d[1]! >> 4) << 4) | (d[2]! >> 4));
    }
  }
  return colors.size >= 6;
}

export async function captureParcelMap(parcel: Parcel, timeoutMs = MAP_CAPTURE_TIMEOUT_MS): Promise<MapCapture> {
  const width = 900;
  const height = 620;
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = `position:fixed;left:0;top:0;z-index:-9999;pointer-events:none;width:${width}px;height:${height}px;`;
  document.body.appendChild(container);

  const map = L.map(container, {
    zoomControl: false,
    attributionControl: false,
    zoomAnimation: false,
    fadeAnimation: false,
    markerZoomAnimation: false,
    preferCanvas: true,
  });

  try {
    const source = TILE_SOURCES.esriWorldImagery;
    const tiles = createTileLayer(source, 1).addTo(map);

    const ring = parcel.geometry.coordinates[0] ?? [];
    const latlngs = ring.map((p) => [p[1]!, p[0]!] as L.LatLngTuple);
    if (latlngs.length < 3) throw new Error('Geometri lahan tidak valid untuk dicetak.');
    const polygon = L.polygon(latlngs, {
      color: parcel.color,
      fillColor: parcel.color,
      fillOpacity: 0.2,
      weight: 3,
    }).addTo(map);
    parcel.controlPoints.forEach((cp) => {
      L.marker([cp.latitude, cp.longitude], {
        icon: L.divIcon({
          className: 'geolahan-patok-marker',
          html: `<div class="patok-bubble">${cp.label}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        interactive: false,
      }).addTo(map);
    });

    map.fitBounds(polygon.getBounds(), { padding: [50, 50], maxZoom: PRINT_MAX_ZOOM, animate: false });

    await new Promise<void>((resolve, reject) => {
      let errors = 0;
      let settled = false;
      const timer = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('Waktu memuat tile peta habis.'));
        }
      }, timeoutMs);

      tiles.on('tileerror', () => {
        errors++;
        // Jika semua tile gagal dimuat (mis. diblokir atau offline), segera reject tanpa menunggu timeout
        if (!settled && errors >= 4) {
          settled = true;
          window.clearTimeout(timer);
          reject(new Error('Sebagian tile peta gagal dimuat.'));
        }
      });

      tiles.once('load', () => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          if (errors > 0) reject(new Error('Sebagian tile peta gagal dimuat.'));
          else resolve();
        }
      });
      map.invalidateSize(false);
    });
    // Beri satu frame agar tile selesai digambar ke DOM.
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const { default: html2canvas } = await import('html2canvas-pro');
    const canvas = await html2canvas(container, {
      useCORS: true,
      allowTaint: false,
      logging: false,
      scale: 1.5,
      backgroundColor: '#1f2937',
    });
    if (!canvasHasImagery(canvas)) throw new Error('Tangkapan peta kosong (citra tidak berhasil diambil).');

    return {
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      width: canvas.width,
      height: canvas.height,
      attribution: 'Citra: Esri World Imagery (Esri, Maxar, Earthstar Geographics, dan GIS User Community)',
      layerLabel: 'Citra satelit',
    };
  } finally {
    map.remove();
    container.remove();
  }
}
