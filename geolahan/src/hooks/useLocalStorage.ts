import { useCallback, useEffect, useState } from 'react';

/**
 * State yang disimpan di localStorage (hanya untuk preferensi ringan, bukan data lahan).
 * Nilai tersimpan divalidasi; bila tidak valid atau localStorage tidak tersedia, dipakai nilai default.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
  validate: (value: unknown) => value is T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => readStorage(key, defaultValue, validate));

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // localStorage penuh/diblokir: preferensi hanya berlaku di sesi ini.
      }
    },
    [key],
  );

  // Sinkronkan antar-tab.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key === key) setValue(readStorage(key, defaultValue, validate));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, defaultValue, validate]);

  return [value, update];
}

export function readStorage<T>(key: string, defaultValue: T, validate: (value: unknown) => value is T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return defaultValue;
    const parsed: unknown = JSON.parse(raw);
    return validate(parsed) ? parsed : defaultValue;
  } catch {
    return defaultValue;
  }
}
