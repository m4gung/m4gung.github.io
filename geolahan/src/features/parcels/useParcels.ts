import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { parcelRepository } from './parcel.repository';
import type { Parcel, CreateParcelInput, UpdateParcelInput } from './parcel.types';

export function useParcels() {
  const parcels = useLiveQuery(async () => {
    return await db.parcels.orderBy('createdAt').reverse().toArray();
  }, []);

  const createParcel = async (input: CreateParcelInput): Promise<Parcel> => {
    return await parcelRepository.create(input);
  };

  const updateParcel = async (id: string, input: UpdateParcelInput): Promise<Parcel> => {
    return await parcelRepository.update(id, input);
  };

  const deleteParcel = async (id: string): Promise<void> => {
    await parcelRepository.delete(id);
  };

  const getParcelById = async (id: string): Promise<Parcel | undefined> => {
    return await parcelRepository.getById(id);
  };

  return {
    parcels: parcels ?? [],
    isLoading: parcels === undefined,
    createParcel,
    updateParcel,
    deleteParcel,
    getParcelById,
  };
}

export function useParcel(id: string | undefined) {
  const parcel = useLiveQuery(async () => {
    if (!id) return undefined;
    return await db.parcels.get(id);
  }, [id]);

  return {
    parcel,
    isLoading: parcel === undefined && Boolean(id),
  };
}
