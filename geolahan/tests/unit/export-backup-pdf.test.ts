import { beforeEach, describe, expect, it } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../src/db/database';
import { parcelRepository } from '../../src/features/parcels/parcel.repository';
import { calculateMeasurement } from '../../src/features/measurement/geometry.service';
import type { CreateParcelInput, Parcel } from '../../src/features/parcels/parcel.types';
import {
  buildFeatureCollection,
  geoJsonFileName,
  parcelToFeature,
  parseGeoJson,
  sanitizeFileName,
  serializeGeoJson,
} from '../../src/features/export/export.service';
import {
  BACKUP_VERSION,
  applyRestore,
  backupFileName,
  createBackup,
  parseBackup,
  planRestore,
} from '../../src/features/backup/backup.service';
import { buildParcelReport, reportFileName } from '../../src/features/report/pdf.service';
import { canvasHasImagery } from '../../src/features/report/map-capture.service';

const ring = [
  [110.0, -7.0],
  [110.001, -7.0],
  [110.001, -7.001],
  [110.0, -7.001],
];

function input(name: string, owner?: string): CreateParcelInput {
  const m = calculateMeasurement(ring);
  return {
    name,
    owner,
    measuredAt: '2026-10-21',
    geometry: m.geometry,
    areaM2: m.areaM2,
    areaAre: m.areaAre,
    areaHa: m.areaHa,
    perimeterM: m.perimeterM,
    centroid: m.centroid,
    controlPoints: m.controlPoints,
  };
}

let p1: Parcel;

beforeEach(async () => {
  await db.parcels.clear();
  p1 = await parcelRepository.create(input('Kebun Ábc / Test?', 'Budi'));
});

describe('sanitizeFileName', () => {
  it('menghapus karakter khusus, aksen, dan path traversal', () => {
    expect(sanitizeFileName('Kebun Ábc / Test?')).toBe('Kebun-Abc-Test');
    expect(sanitizeFileName('../../etc/passwd')).toBe('etc-passwd');
    expect(sanitizeFileName('???')).toBe('lahan');
  });
});

describe('GeoJSON', () => {
  it('menghasilkan Feature valid dengan urutan koordinat asli dan properti lengkap', () => {
    const f = parcelToFeature(p1);
    expect(f.type).toBe('Feature');
    expect(f.geometry.coordinates).toEqual(p1.geometry.coordinates);
    expect(f.properties).toMatchObject({ id: p1.id, name: p1.name, owner: 'Budi', measuredAt: '2026-10-21' });
    expect(f.properties.areaM2).toBe(p1.areaM2);
    expect(f.properties.perimeterM).toBe(p1.perimeterM);
  });

  it('nama file satu lahan memakai nama lahan', () => {
    expect(geoJsonFileName([p1])).toBe('Kebun-Abc-Test.geojson');
  });

  it('ekspor lalu impor kembali mempertahankan geometri dan luas', () => {
    const { inputs, errors } = parseGeoJson(serializeGeoJson([p1]));
    expect(errors).toEqual([]);
    expect(inputs).toHaveLength(1);
    expect(inputs[0]!.name).toBe(p1.name);
    expect(inputs[0]!.geometry.coordinates).toEqual(p1.geometry.coordinates);
    expect(inputs[0]!.areaM2).toBeCloseTo(p1.areaM2, 6);
  });

  it('FeatureCollection berisi banyak lahan', () => {
    expect(buildFeatureCollection([p1, p1]).features).toHaveLength(2);
    expect(parseGeoJson(JSON.stringify(buildFeatureCollection([p1, p1]))).inputs).toHaveLength(2);
  });

  it('menolak JSON rusak dan fitur non-Polygon / tidak valid', () => {
    expect(() => parseGeoJson('{bukan json')).toThrow(/valid/i);
    expect(() => parseGeoJson('{"type":"Point"}')).toThrow();
    const bad = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [1, 2] } },
        { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0]]] } },
        { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 95], [1, 95], [1, 96]]] } },
      ],
    };
    const r = parseGeoJson(JSON.stringify(bad));
    expect(r.inputs).toHaveLength(0);
    expect(r.errors).toHaveLength(3);
  });
});

describe('Backup & restore', () => {
  it('backup memuat versi, waktu ekspor, dan seluruh data', () => {
    const b = createBackup([p1], new Date('2026-10-21T10:00:00Z'));
    expect(b.version).toBe(BACKUP_VERSION);
    expect(b.exportedAt).toBe('2026-10-21T10:00:00.000Z');
    expect(b.parcels[0]!.controlPoints.length).toBe(4);
    expect(backupFileName(new Date(2026, 9, 21))).toBe('geolahan-backup-2026-10-21.json');
  });

  it('parse backup valid', () => {
    const r = parseBackup(JSON.stringify(createBackup([p1])));
    expect(r.parcels).toHaveLength(1);
    expect(r.errors).toEqual([]);
    expect(planRestore(r.parcels, new Set([p1.id]))).toEqual({ total: 1, conflicts: 1 });
  });

  it('menolak berkas rusak, format salah, dan versi lebih baru', () => {
    expect(() => parseBackup('xxx')).toThrow(/rusak/);
    expect(() => parseBackup('{"format":"lain"}')).toThrow(/bukan backup/);
    expect(() => parseBackup(JSON.stringify({ ...createBackup([p1]), version: 99 }))).toThrow(/Versi/);
    expect(() => parseBackup(JSON.stringify({ ...createBackup([p1]), parcels: 'x' }))).toThrow(/rusak/);
  });

  it('melewati record rusak dan ID ganda, tetap memuat yang valid', () => {
    const b = createBackup([p1]);
    const broken = { ...p1, id: 'x2', geometry: { type: 'Point', coordinates: [0, 0] } };
    const r = parseBackup(JSON.stringify({ ...b, parcels: [p1, broken, p1] }));
    expect(r.parcels).toHaveLength(1);
    expect(r.errors).toHaveLength(2);
  });

  it('strategi skip, replace, dan merge', async () => {
    const copy = { ...p1, name: 'Diubah' };
    expect(await applyRestore([copy], 'skip')).toEqual({ added: 0, replaced: 0, skipped: 1 });
    expect((await db.parcels.get(p1.id))!.name).toBe(p1.name);

    expect(await applyRestore([copy], 'replace')).toEqual({ added: 0, replaced: 1, skipped: 0 });
    expect((await db.parcels.get(p1.id))!.name).toBe('Diubah');

    expect(await applyRestore([copy], 'merge')).toEqual({ added: 1, replaced: 0, skipped: 0 });
    expect(await db.parcels.count()).toBe(2);
  });

  it('restore data baru menambah tanpa menghapus data lama', async () => {
    const other: Parcel = { ...p1, id: 'id-lain', name: 'Lahan Lain' };
    expect((await applyRestore([other], 'merge')).added).toBe(1);
    expect(await db.parcels.count()).toBe(2);
  });
});

describe('Laporan PDF', () => {
  it('nama file aman dan mengandung tanggal', () => {
    expect(reportFileName(p1, new Date(2026, 9, 21))).toBe('Laporan-GeoLahan-Kebun-Abc-Test-2026-10-21.pdf');
  });

  it('membuat dokumen A4 tanpa gambar peta dan bernomor halaman', () => {
    const doc = buildParcelReport(p1, null);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(doc.internal.pageSize.getWidth()).toBeCloseTo(210, 0);
    expect(doc.internal.pageSize.getHeight()).toBeCloseTo(297, 0);
    expect(doc.output('arraybuffer').byteLength).toBeGreaterThan(1000);
  });

  it('tabel koordinat panjang berlanjut ke beberapa halaman', () => {
    const many: Parcel = {
      ...p1,
      controlPoints: Array.from({ length: 80 }, (_, i) => ({
        id: `P${i + 1}`,
        number: i + 1,
        label: `P${i + 1}`,
        latitude: -7 - i * 1e-5,
        longitude: 110 + i * 1e-5,
        distanceToNextM: 1.23,
      })),
    };
    expect(buildParcelReport(many, null).getNumberOfPages()).toBeGreaterThan(1);
  });

  it('canvasHasImagery menolak kanvas kosong (jsdom tanpa konteks)', () => {
    expect(canvasHasImagery(document.createElement('canvas'))).toBe(false);
  });
});
