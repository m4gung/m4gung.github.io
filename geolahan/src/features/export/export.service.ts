/**
 * Ekspor & impor GeoJSON (WGS 84, urutan [longitude, latitude]).
 * Geometri disimpan apa adanya; metrik dihitung ulang saat impor oleh mesin geometri yang sama.
 */

import type { Feature, FeatureCollection, Polygon, Position } from 'geojson';
import type { CreateParcelInput, MeasurementMethod, Parcel } from '../parcels/parcel.types';
import { PARCEL_COLORS, type ParcelColor } from '../measurement/measurement.types';
import { calculateMeasurement } from '../measurement/geometry.service';

export const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export interface ParcelFeatureProperties {
  id: string;
  name: string;
  owner?: string;
  description?: string;
  measuredAt: string;
  areaM2: number;
  areaAre: number;
  areaHa: number;
  perimeterM: number;
  measurementMethod: MeasurementMethod;
  color: ParcelColor;
  notes?: string;
}

export type ParcelFeature = Feature<Polygon, ParcelFeatureProperties>;

/** Nama file aman: huruf/angka/strip saja, tanpa path traversal atau karakter khusus. */
export function sanitizeFileName(name: string, fallback = 'lahan'): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned || fallback;
}

export function todayStamp(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parcelToFeature(parcel: Parcel): ParcelFeature {
  const properties: ParcelFeatureProperties = {
    id: parcel.id,
    name: parcel.name,
    measuredAt: parcel.measuredAt,
    areaM2: parcel.areaM2,
    areaAre: parcel.areaAre,
    areaHa: parcel.areaHa,
    perimeterM: parcel.perimeterM,
    measurementMethod: parcel.measurementMethod,
    color: parcel.color,
  };
  if (parcel.owner) properties.owner = parcel.owner;
  if (parcel.description) properties.description = parcel.description;
  if (parcel.notes) properties.notes = parcel.notes;
  return { type: 'Feature', id: parcel.id, properties, geometry: parcel.geometry };
}

export function buildFeatureCollection(parcels: readonly Parcel[]): FeatureCollection<Polygon, ParcelFeatureProperties> {
  return { type: 'FeatureCollection', features: parcels.map(parcelToFeature) };
}

export function geoJsonFileName(parcels: readonly Parcel[]): string {
  if (parcels.length === 1) return `${sanitizeFileName(parcels[0]!.name)}.geojson`;
  return `geolahan-semua-lahan-${todayStamp()}.geojson`;
}

export function serializeGeoJson(parcels: readonly Parcel[]): string {
  // Satu lahan: Feature tunggal; banyak: FeatureCollection.
  const payload = parcels.length === 1 ? parcelToFeature(parcels[0]!) : buildFeatureCollection(parcels);
  return JSON.stringify(payload, null, 2);
}

export interface GeoJsonImportResult {
  inputs: CreateParcelInput[];
  errors: string[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function str(v: unknown, max = 500): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined;
}

function isPosition(p: unknown): p is Position {
  return Array.isArray(p) && p.length >= 2 && typeof p[0] === 'number' && typeof p[1] === 'number';
}

/** Impor GeoJSON (Feature atau FeatureCollection berisi Polygon). Konten tidak pernah dieksekusi. */
export function parseGeoJson(text: string): GeoJsonImportResult {
  if (text.length > MAX_IMPORT_BYTES) throw new Error('Berkas terlalu besar (maksimal 10 MB).');
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Berkas bukan JSON/GeoJSON yang valid.');
  }
  if (!isRecord(data)) throw new Error('Struktur GeoJSON tidak dikenali.');

  let features: unknown[];
  if (data.type === 'FeatureCollection' && Array.isArray(data.features)) features = data.features;
  else if (data.type === 'Feature') features = [data];
  else throw new Error('GeoJSON harus berupa Feature atau FeatureCollection.');

  const inputs: CreateParcelInput[] = [];
  const errors: string[] = [];

  features.forEach((raw, index) => {
    const label = `Fitur ${index + 1}`;
    if (!isRecord(raw) || !isRecord(raw.geometry)) {
      errors.push(`${label}: geometri tidak ada.`);
      return;
    }
    const geom = raw.geometry;
    if (geom.type !== 'Polygon' || !Array.isArray(geom.coordinates)) {
      errors.push(`${label}: hanya geometri Polygon yang didukung.`);
      return;
    }
    const ring = geom.coordinates[0];
    if (!Array.isArray(ring) || !ring.every(isPosition)) {
      errors.push(`${label}: koordinat poligon tidak valid.`);
      return;
    }
    const coords: Position[] = ring.map((p: Position) => [p[0]!, p[1]!]);
    let m;
    try {
      m = calculateMeasurement(coords);
    } catch {
      errors.push(`${label}: poligon tidak dapat dihitung.`);
      return;
    }
    if (!m.isValid) {
      errors.push(`${label}: ${m.validationError ?? 'geometri tidak valid.'}`);
      return;
    }
    const props = isRecord(raw.properties) ? raw.properties : {};
    const color = PARCEL_COLORS.find((c) => c.hex === props.color)?.hex;
    const method: MeasurementMethod =
      props.measurementMethod === 'gps_mobile' || props.measurementMethod === 'combined'
        ? props.measurementMethod
        : 'map_digitization';
    inputs.push({
      name: str(props.name, 120) ?? `Lahan impor ${index + 1}`,
      owner: str(props.owner, 120),
      description: str(props.description, 1000),
      notes: str(props.notes, 2000),
      color,
      measuredAt: typeof props.measuredAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(props.measuredAt) ? props.measuredAt : undefined,
      measurementMethod: method,
      geometry: m.geometry,
      areaM2: m.areaM2,
      areaAre: m.areaAre,
      areaHa: m.areaHa,
      perimeterM: m.perimeterM,
      centroid: m.centroid,
      controlPoints: m.controlPoints,
    });
  });

  return { inputs, errors };
}

export function downloadText(fileName: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
