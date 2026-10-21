import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_BASE_LAYER, isBaseLayerId, type BaseLayerId } from '../../features/map/map.config';
import type { GeocodingResult } from '../../features/map/geocoding.service';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { MapControllerContext, type MapControllerValue, type MapFocusTarget } from './map-controller';

export const BASE_LAYER_STORAGE_KEY = 'geolahan:baseLayer';

/**
 * Menyimpan state peta yang perlu diakses di luar komponen peta (header, pengaturan),
 * tanpa membuat komponen tersebut bergantung langsung pada Leaflet.
 */
export function MapControllerProvider({ children }: { children: ReactNode }) {
  const [baseLayer, setBaseLayer] = useLocalStorage<BaseLayerId>(
    BASE_LAYER_STORAGE_KEY,
    DEFAULT_BASE_LAYER,
    isBaseLayerId,
  );
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null);
  const counter = useRef(0);

  const focusOn = useCallback((result: GeocodingResult) => {
    counter.current += 1;
    setFocusTarget({ key: counter.current, result });
  }, []);
  const clearFocus = useCallback(() => setFocusTarget(null), []);

  const value = useMemo<MapControllerValue>(
    () => ({ baseLayer, setBaseLayer, focusTarget, focusOn, clearFocus }),
    [baseLayer, setBaseLayer, focusTarget, focusOn, clearFocus],
  );

  return <MapControllerContext.Provider value={value}>{children}</MapControllerContext.Provider>;
}
