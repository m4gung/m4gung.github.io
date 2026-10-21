import Dexie, { type EntityTable } from 'dexie';
import type { Parcel } from '../features/parcels/parcel.types';

export class GeoLahanDatabase extends Dexie {
  parcels!: EntityTable<Parcel, 'id'>;

  constructor() {
    super('GeoLahanDatabase');

    // Skema Dexie versi 1: indeks id, name, owner, createdAt, updatedAt, areaM2
    this.version(1).stores({
      parcels: 'id, name, owner, createdAt, updatedAt, areaM2',
    });
  }
}

export const db = new GeoLahanDatabase();
