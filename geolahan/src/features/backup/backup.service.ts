/**
 * Backup & restore JSON data lahan (lokal). Ini BUKAN backup cloud: berkas harus
 * disimpan sendiri oleh pengguna. Restore divalidasi penuh sebelum data apa pun diubah.
 */

import { db } from '../../db/database';
import type { Parcel, MeasurementMethod } from '../parcels/parcel.types';
import type { ControlPoint } from '../measurement/measurement.types';
import { PARCEL_COLORS } from '../measurement/measurement.types';
import { validateCoordinates } from '../measurement/geometry.service';
import { MAX_IMPORT_BYTES, todayStamp } from '../export/export.service';

export const BACKUP_FORMAT = 'geolahan-backup';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  app: string;
  parcelCount: number;
  parcels: Parcel[];
}

export type RestoreStrategy = 'merge' | 'skip' | 'replace';

export interface ParsedBackup {
  parcels: Parcel[];
  errors: string[];
  exportedAt: string;
}

export interface RestorePlan {
  total: number;
  conflicts: number;
}

export interface RestoreResult {
  added: number;
  replaced: number;
  skipped: number;
}

export function createBackup(parcels: readonly Parcel[], now = new Date()): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    app: 'GeoLahan Pro',
    parcelCount: parcels.length,
    parcels: [...parcels],
  };
}

export function backupFileName(now = new Date()): string {
  return `geolahan-backup-${todayStamp(now)}.json`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function optStr(v: unknown): string | undefined {
  return typeof v === 'string' && v ? v : undefined;
}

/** Validasi satu record; hanya field yang dikenal yang disalin (tahan prototype pollution). */
export function validateParcelRecord(raw: unknown): { parcel?: Parcel; error?: string } {
  if (!isRecord(raw)) return { error: 'bukan objek.' };
  if (typeof raw.id !== 'string' || !raw.id || raw.id.length > 100) return { error: 'ID tidak valid.' };
  if (typeof raw.name !== 'string' || !raw.name.trim()) return { error: 'nama kosong.' };
  if (typeof raw.measuredAt !== 'string' || typeof raw.createdAt !== 'string' || typeof raw.updatedAt !== 'string') {
    return { error: 'tanggal tidak valid.' };
  }
  const g = raw.geometry;
  if (!isRecord(g) || g.type !== 'Polygon' || !Array.isArray(g.coordinates) || !Array.isArray(g.coordinates[0])) {
    return { error: 'geometri bukan Polygon.' };
  }
  const ring = g.coordinates[0] as unknown[];
  if (!ring.every((p) => Array.isArray(p) && finite(p[0]) && finite(p[1]))) {
    return { error: 'koordinat poligon tidak valid.' };
  }
  const check = validateCoordinates(ring as number[][]);
  if (!check.valid) return { error: check.error ?? 'geometri tidak valid.' };

  if (![raw.areaM2, raw.areaAre, raw.areaHa, raw.perimeterM].every(finite)) return { error: 'metrik luas/keliling tidak valid.' };
  const c = raw.centroid;
  if (!Array.isArray(c) || !finite(c[0]) || !finite(c[1])) return { error: 'centroid tidak valid.' };
  if (!Array.isArray(raw.controlPoints)) return { error: 'titik patok tidak ada.' };

  const controlPoints: ControlPoint[] = [];
  for (const cp of raw.controlPoints as unknown[]) {
    if (
      !isRecord(cp) ||
      typeof cp.id !== 'string' ||
      typeof cp.label !== 'string' ||
      !finite(cp.number) ||
      !finite(cp.latitude) ||
      !finite(cp.longitude) ||
      !finite(cp.distanceToNextM)
    ) {
      return { error: 'titik patok tidak valid.' };
    }
    controlPoints.push({
      id: cp.id,
      number: cp.number,
      label: cp.label,
      latitude: cp.latitude,
      longitude: cp.longitude,
      distanceToNextM: cp.distanceToNextM,
    });
  }

  const color = PARCEL_COLORS.find((p) => p.hex === raw.color)?.hex ?? PARCEL_COLORS[0]!.hex;
  const method: MeasurementMethod =
    raw.measurementMethod === 'gps_mobile' || raw.measurementMethod === 'combined' ? raw.measurementMethod : 'map_digitization';

  const parcel: Parcel = {
    id: raw.id,
    name: raw.name.trim().slice(0, 120),
    owner: optStr(raw.owner),
    description: optStr(raw.description),
    color,
    measuredAt: raw.measuredAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    geometry: { type: 'Polygon', coordinates: (g.coordinates as number[][][]).map((r) => r.map((p) => [p[0]!, p[1]!])) },
    areaM2: raw.areaM2 as number,
    areaAre: raw.areaAre as number,
    areaHa: raw.areaHa as number,
    perimeterM: raw.perimeterM as number,
    centroid: [c[0] as number, c[1] as number],
    measurementMethod: method,
    gpsAccuracyM: finite(raw.gpsAccuracyM) ? raw.gpsAccuracyM : undefined,
    controlPoints,
    notes: optStr(raw.notes),
  };
  return { parcel };
}

/** Mem-parse & memvalidasi teks backup. Melempar Error untuk masalah fatal (berkas rusak). */
export function parseBackup(text: string): ParsedBackup {
  if (text.length > MAX_IMPORT_BYTES) throw new Error('Berkas backup terlalu besar (maksimal 10 MB).');
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Berkas backup rusak: bukan JSON yang valid.');
  }
  if (!isRecord(data) || data.format !== BACKUP_FORMAT) throw new Error('Berkas ini bukan backup GeoLahan Pro.');
  if (!finite(data.version) || data.version > BACKUP_VERSION) {
    throw new Error('Versi backup tidak didukung oleh aplikasi ini.');
  }
  if (!Array.isArray(data.parcels)) throw new Error('Berkas backup rusak: daftar lahan tidak ditemukan.');

  const parcels: Parcel[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  data.parcels.forEach((raw: unknown, i: number) => {
    const { parcel, error } = validateParcelRecord(raw);
    if (!parcel) {
      errors.push(`Lahan ke-${i + 1}: ${error}`);
    } else if (seen.has(parcel.id)) {
      errors.push(`Lahan ke-${i + 1}: ID ganda di dalam berkas.`);
    } else {
      seen.add(parcel.id);
      parcels.push(parcel);
    }
  });
  return { parcels, errors, exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '' };
}

export function planRestore(parcels: readonly Parcel[], existingIds: ReadonlySet<string>): RestorePlan {
  return { total: parcels.length, conflicts: parcels.filter((p) => existingIds.has(p.id)).length };
}

function newId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Terapkan restore dalam satu transaksi Dexie. Data lama tidak pernah dihapus:
 * - merge: ID bentrok disimpan sebagai salinan baru (ID baru)
 * - skip: ID bentrok dilewati
 * - replace: ID bentrok ditimpa
 */
export async function applyRestore(parcels: readonly Parcel[], strategy: RestoreStrategy): Promise<RestoreResult> {
  const result: RestoreResult = { added: 0, replaced: 0, skipped: 0 };
  await db.transaction('rw', db.parcels, async () => {
    const existing = new Set((await db.parcels.toCollection().primaryKeys()) as string[]);
    for (const p of parcels) {
      if (!existing.has(p.id)) {
        await db.parcels.add(p);
        result.added++;
      } else if (strategy === 'skip') {
        result.skipped++;
      } else if (strategy === 'replace') {
        await db.parcels.put(p);
        result.replaced++;
      } else {
        await db.parcels.add({ ...p, id: newId() });
        result.added++;
      }
    }
  });
  return result;
}
