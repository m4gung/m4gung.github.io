import { db } from '../../db/database';
import type { Parcel, CreateParcelInput, UpdateParcelInput } from './parcel.types';
import { PARCEL_COLORS } from '../measurement/measurement.types';

export interface IParcelRepository {
  create(input: CreateParcelInput): Promise<Parcel>;
  getById(id: string): Promise<Parcel | undefined>;
  getAll(): Promise<Parcel[]>;
  update(id: string, input: UpdateParcelInput): Promise<Parcel>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class DexieParcelRepository implements IParcelRepository {
  async create(input: CreateParcelInput): Promise<Parcel> {
    const now = new Date().toISOString();
    const parcel: Parcel = {
      id: generateUUID(),
      name: input.name.trim(),
      owner: input.owner?.trim() || undefined,
      description: input.description?.trim() || undefined,
      color: input.color || PARCEL_COLORS[0]!.hex,
      measuredAt: input.measuredAt || now.split('T')[0]!,
      createdAt: now,
      updatedAt: now,
      geometry: input.geometry,
      areaM2: input.areaM2,
      areaAre: input.areaAre,
      areaHa: input.areaHa,
      perimeterM: input.perimeterM,
      centroid: input.centroid,
      measurementMethod: input.measurementMethod || 'map_digitization',
      gpsAccuracyM: input.gpsAccuracyM,
      controlPoints: input.controlPoints,
      notes: input.notes?.trim() || undefined,
    };

    await db.parcels.add(parcel);
    return parcel;
  }

  async getById(id: string): Promise<Parcel | undefined> {
    return await db.parcels.get(id);
  }

  async getAll(): Promise<Parcel[]> {
    return await db.parcels.orderBy('createdAt').reverse().toArray();
  }

  async update(id: string, input: UpdateParcelInput): Promise<Parcel> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error(`Lahan dengan ID "${id}" tidak ditemukan.`);
    }

    const now = new Date().toISOString();
    const updated: Parcel = {
      ...existing,
      ...input,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      owner: input.owner !== undefined ? input.owner.trim() || undefined : existing.owner,
      description: input.description !== undefined ? input.description.trim() || undefined : existing.description,
      notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      updatedAt: now,
    };

    await db.parcels.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await db.parcels.delete(id);
  }

  async count(): Promise<number> {
    return await db.parcels.count();
  }
}

export const parcelRepository = new DexieParcelRepository();
