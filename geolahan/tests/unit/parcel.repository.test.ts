import { describe, expect, it, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '../../src/db/database';
import { DexieParcelRepository } from '../../src/features/parcels/parcel.repository';
import type { CreateParcelInput } from '../../src/features/parcels/parcel.types';

describe('DexieParcelRepository', () => {
  let repo: DexieParcelRepository;

  const sampleInput: CreateParcelInput = {
    name: 'Kebun Percobaan',
    owner: 'Pak Tani',
    description: 'Lahan padi sawah irigasi',
    color: '#059669',
    measuredAt: '2026-10-21',
    measurementMethod: 'map_digitization',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [110.0, -7.0],
          [110.01, -7.0],
          [110.01, -7.01],
          [110.0, -7.01],
          [110.0, -7.0],
        ],
      ],
    },
    areaM2: 12000,
    areaAre: 120,
    areaHa: 1.2,
    perimeterM: 440,
    centroid: [-7.005, 110.005],
    controlPoints: [
      { id: 'cp-1', number: 1, label: 'P1', latitude: -7.0, longitude: 110.0, distanceToNextM: 110 },
      { id: 'cp-2', number: 2, label: 'P2', latitude: -7.0, longitude: 110.01, distanceToNextM: 110 },
      { id: 'cp-3', number: 3, label: 'P3', latitude: -7.01, longitude: 110.01, distanceToNextM: 110 },
      { id: 'cp-4', number: 4, label: 'P4', latitude: -7.01, longitude: 110.0, distanceToNextM: 110 },
    ],
  };

  beforeEach(async () => {
    repo = new DexieParcelRepository();
    await db.parcels.clear();
  });

  it('membuat lahan baru dan menyimpannya di IndexedDB', async () => {
    const created = await repo.create(sampleInput);
    expect(created.id).toBeDefined();
    expect(created.name).toBe('Kebun Percobaan');
    expect(created.owner).toBe('Pak Tani');
    expect(created.areaM2).toBe(12000);
    expect(created.createdAt).toBeDefined();

    const inDb = await repo.getById(created.id);
    expect(inDb).toBeDefined();
    expect(inDb?.name).toBe('Kebun Percobaan');
  });

  it('mengambil semua lahan dan menghitung total data', async () => {
    await repo.create(sampleInput);
    await repo.create({ ...sampleInput, name: 'Lahan Kedua' });

    const all = await repo.getAll();
    expect(all).toHaveLength(2);

    const count = await repo.count();
    expect(count).toBe(2);
  });

  it('memperbarui metadata lahan yang sudah ada', async () => {
    const created = await repo.create(sampleInput);
    const updated = await repo.update(created.id, {
      name: 'Kebun Kelapa Sawit',
      owner: 'PT Agro Makmur',
      areaM2: 15000,
    });

    expect(updated.name).toBe('Kebun Kelapa Sawit');
    expect(updated.owner).toBe('PT Agro Makmur');
    expect(updated.areaM2).toBe(15000);

    const inDb = await repo.getById(created.id);
    expect(inDb?.name).toBe('Kebun Kelapa Sawit');
  });

  it('menghapus lahan dari IndexedDB', async () => {
    const created = await repo.create(sampleInput);
    expect(await repo.count()).toBe(1);

    await repo.delete(created.id);
    expect(await repo.count()).toBe(0);

    const deleted = await repo.getById(created.id);
    expect(deleted).toBeUndefined();
  });
});
