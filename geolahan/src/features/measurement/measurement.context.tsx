import { useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Position } from 'geojson';
import {
  type MeasurementMode,
  type MeasurementResult,
  type ParcelColor,
  PARCEL_COLORS,
} from './measurement.types';
import { calculateMeasurement } from './geometry.service';
import { MeasurementContext, type MeasurementContextValue } from './useMeasurement';

export function MeasurementProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<MeasurementMode>('idle');
  const [activeCoordinates, setActiveCoordinates] = useState<Position[] | null>(null);
  const [selectedColor, setSelectedColor] = useState<ParcelColor>(PARCEL_COLORS[0]!.hex);
  const [loadedParcelId, setLoadedParcelId] = useState<string | null>(null);

  const measurement = useMemo<MeasurementResult | null>(() => {
    if (!activeCoordinates || activeCoordinates.length < 3) return null;
    return calculateMeasurement(activeCoordinates);
  }, [activeCoordinates]);

  const updateCoordinates = useCallback((coords: Position[] | null) => {
    setActiveCoordinates(coords);
  }, []);

  const resetMeasurement = useCallback(() => {
    setActiveCoordinates(null);
    setLoadedParcelId(null);
    setMode('idle');
  }, []);

  const value = useMemo<MeasurementContextValue>(
    () => ({
      mode,
      setMode,
      activeCoordinates,
      measurement,
      selectedColor,
      setSelectedColor,
      updateCoordinates,
      resetMeasurement,
      loadedParcelId,
      setLoadedParcelId,
    }),
    [
      mode,
      activeCoordinates,
      measurement,
      selectedColor,
      updateCoordinates,
      resetMeasurement,
      loadedParcelId,
    ],
  );

  return <MeasurementContext.Provider value={value}>{children}</MeasurementContext.Provider>;
}
