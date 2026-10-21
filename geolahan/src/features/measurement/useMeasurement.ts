import { createContext, useContext } from 'react';
import type { Position } from 'geojson';
import type {
  MeasurementMode,
  MeasurementResult,
  ParcelColor,
} from './measurement.types';

export interface MeasurementContextValue {
  mode: MeasurementMode;
  setMode: (mode: MeasurementMode) => void;
  activeCoordinates: Position[] | null;
  measurement: MeasurementResult | null;
  selectedColor: ParcelColor;
  setSelectedColor: (color: ParcelColor) => void;
  updateCoordinates: (coords: Position[] | null) => void;
  resetMeasurement: () => void;
  /** ID lahan tersimpan yang sedang dibuka di peta */
  loadedParcelId: string | null;
  setLoadedParcelId: (id: string | null) => void;
}

export const MeasurementContext = createContext<MeasurementContextValue | null>(null);

export function useMeasurement(): MeasurementContextValue {
  const ctx = useContext(MeasurementContext);
  if (!ctx) throw new Error('useMeasurement harus digunakan di dalam MeasurementProvider');
  return ctx;
}
