/**
 * Service kalkulasi geospasial menggunakan Turf.js.
 * Memproses perhitungan luas geodesik, keliling, jarak sisi, label patok, dan titik pusat.
 */

import * as turf from '@turf/turf';
import type { Position } from 'geojson';
import type { ControlPoint, MeasurementResult, SegmentInfo } from './measurement.types';

/**
 * Validasi ring koordinat poligon:
 * - Minimal 3 titik unik (4 posisi dengan penutup).
 * - Tidak ada nilai non-finite / NaN.
 * - Koordinat dalam batas WGS 84.
 */
export function validateCoordinates(coords: Position[]): { valid: boolean; error?: string } {
  if (!coords || coords.length < 3) {
    return { valid: false, error: 'Poligon harus memiliki minimal 3 titik sudut.' };
  }

  // Jika titik terakhir sama dengan titik pertama, abaikan titik penutup untuk validasi titik unik
  const isClosed =
    coords.length > 3 &&
    coords[0]![0] === coords[coords.length - 1]![0] &&
    coords[0]![1] === coords[coords.length - 1]![1];

  const uniquePoints = isClosed ? coords.slice(0, -1) : coords;

  if (uniquePoints.length < 3) {
    return { valid: false, error: 'Poligon membutuhkan minimal 3 titik patok unik.' };
  }

  for (let i = 0; i < uniquePoints.length; i++) {
    const pt = uniquePoints[i];
    if (!pt || pt.length < 2) {
      return { valid: false, error: `Titik ke-${i + 1} tidak memiliki koordinat lengkap.` };
    }
    const [lon, lat] = pt;
    if (lon === undefined || lat === undefined || !Number.isFinite(lon) || !Number.isFinite(lat)) {
      return { valid: false, error: `Titik ke-${i + 1} memiliki nilai koordinat tidak valid.` };
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { valid: false, error: `Koordinat titik ke-${i + 1} berada di luar rentang WGS 84.` };
    }
  }

  // Cek apakah ada sisi berurutan dengan panjang nol (titik bertumpuk bersebelahan)
  for (let i = 0; i < uniquePoints.length; i++) {
    const nextIdx = (i + 1) % uniquePoints.length;
    const p1 = uniquePoints[i]!;
    const p2 = uniquePoints[nextIdx]!;
    if (p1[0] === p2[0] && p1[1] === p2[1]) {
      return { valid: false, error: `Terdapat titik patok bertumpuk pada sisi ${i + 1}.` };
    }
  }

  return { valid: true };
}

/**
 * Memastikan ring koordinat tertutup sesuai standar GeoJSON Polygon
 * (titik pertama = titik terakhir).
 */
export function ensureClosedRing(coords: Position[]): Position[] {
  if (coords.length === 0) return [];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last || first[0] === undefined || first[1] === undefined || last[0] === undefined || last[1] === undefined) {
    return [...coords];
  }
  if (first[0] === last[0] && first[1] === last[1]) {
    return [...coords];
  }
  return [...coords, [first[0], first[1]]];
}

/**
 * Menghitung luas, keliling, patok P1..Pn, dan titik pusat dari koordinat poligon.
 * @param rawCoords Array koordinat [longitude, latitude] dalam WGS 84
 */
export function calculateMeasurement(rawCoords: Position[]): MeasurementResult {
  const validation = validateCoordinates(rawCoords);
  const closedCoords = ensureClosedRing(rawCoords);
  const polygonGeoJSON = turf.polygon([closedCoords]);

  // Jika koordinat dasar tidak valid, kembalikan objek minimal dengan pesan error
  if (!validation.valid) {
    return {
      geometry: polygonGeoJSON.geometry,
      areaM2: 0,
      areaAre: 0,
      areaHa: 0,
      perimeterM: 0,
      centroid: [0, 0],
      controlPoints: [],
      segments: [],
      isValid: false,
      validationError: validation.error,
    };
  }

  // Cek self-intersection (kinks)
  const kinks = turf.kinks(polygonGeoJSON);
  if (kinks.features.length > 0) {
    return {
      geometry: polygonGeoJSON.geometry,
      areaM2: 0,
      areaAre: 0,
      areaHa: 0,
      perimeterM: 0,
      centroid: [0, 0],
      controlPoints: [],
      segments: [],
      isValid: false,
      validationError: 'Batas lahan tidak boleh saling silang (self-intersecting).',
    };
  }

  // 1. Luas Geodesik via Turf
  const areaM2 = turf.area(polygonGeoJSON);
  const areaAre = areaM2 / 100;
  const areaHa = areaM2 / 10000;

  // 2. Keliling Total via Turf (dalam meter)
  const line = turf.polygonToLine(polygonGeoJSON);
  const perimeterM = line.type === 'Feature' ? turf.length(line, { units: 'meters' }) : 0;

  // 3. Titik Patok (P1, P2... Pn)
  // Ambil hanya titik-titik unik (tanpa titik penutup terakhir)
  const vertexCoords = closedCoords.slice(0, -1);
  const controlPoints: ControlPoint[] = [];
  const segments: SegmentInfo[] = [];

  for (let i = 0; i < vertexCoords.length; i++) {
    const current = vertexCoords[i]!;
    const nextIdx = (i + 1) % vertexCoords.length;
    const next = vertexCoords[nextIdx]!;

    const currentPt = turf.point(current);
    const nextPt = turf.point(next);

    // Jarak geodesik ke patok berikutnya (meter)
    const distanceM = turf.distance(currentPt, nextPt, { units: 'meters' });

    const number = i + 1;
    const label = `P${number}`;
    const nextLabel = `P${nextIdx + 1}`;

    controlPoints.push({
      id: `cp-${number}`,
      number,
      label,
      longitude: current[0]!,
      latitude: current[1]!,
      distanceToNextM: distanceM,
    });

    // Titik tengah segmen untuk penempatan label jarak
    const midPoint = turf.midpoint(currentPt, nextPt);
    segments.push({
      index: i,
      fromLabel: label,
      toLabel: nextLabel,
      distanceM,
      midpoint: [midPoint.geometry.coordinates[1]!, midPoint.geometry.coordinates[0]!],
    });
  }

  // 4. Centroid Poligon [lat, lon]
  const centroidFeature = turf.centroid(polygonGeoJSON);
  const centroidCoord = centroidFeature.geometry.coordinates;
  const centroid: [number, number] = [centroidCoord[1]!, centroidCoord[0]!];

  return {
    geometry: polygonGeoJSON.geometry,
    areaM2,
    areaAre,
    areaHa,
    perimeterM,
    centroid,
    controlPoints,
    segments,
    isValid: true,
  };
}

/**
 * Format angka ke 2 desimal dengan pemisah ribuan standar Indonesia (titik)
 * dan desimal koma.
 */
export function formatNumberId(value: number, decimals = 2): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format koordinat 6 desimal.
 */
export function formatCoord(value: number): string {
  return value.toFixed(6);
}
