import { createContext, useContext } from 'react';
import type { BaseLayerId } from '../../features/map/map.config';
import type { GeocodingResult } from '../../features/map/geocoding.service';

/** Target fokus peta. `key` berubah setiap permintaan agar fokus ulang ke lokasi yang sama tetap terjadi. */
export interface MapFocusTarget {
  key: number;
  result: GeocodingResult;
}

export interface MapControllerValue {
  baseLayer: BaseLayerId;
  /** Mengganti layer dasar; pilihan disimpan sebagai preferensi (localStorage). */
  setBaseLayer: (id: BaseLayerId) => void;
  focusTarget: MapFocusTarget | null;
  focusOn: (result: GeocodingResult) => void;
  clearFocus: () => void;
}

export const MapControllerContext = createContext<MapControllerValue | null>(null);

export function useMapController(): MapControllerValue {
  const ctx = useContext(MapControllerContext);
  if (!ctx) throw new Error('useMapController harus dipakai di dalam MapControllerProvider');
  return ctx;
}
