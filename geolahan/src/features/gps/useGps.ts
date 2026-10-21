import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GPS_OPTIONS,
  isGpsSupported,
  mapGpsError,
  shouldAcceptTrackPoint,
  toGpsFix,
  type GpsFix,
  type GpsStatus,
} from './gps.service';

const TRACK_NOTICES = {
  poor_accuracy: 'Titik dilewati: akurasi GPS terlalu rendah.',
  too_close: '',
  limit_reached: 'Batas jumlah titik lintasan tercapai. Selesaikan rekaman.',
} as const;

export function useGps() {
  const [status, setStatus] = useState<GpsStatus>(isGpsSupported() ? 'idle' : 'unsupported');
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [error, setError] = useState<string | null>(
    isGpsSupported() ? null : 'Perangkat atau browser ini tidak mendukung GPS.',
  );
  const [isTracking, setIsTracking] = useState(false);
  const [track, setTrack] = useState<GpsFix[]>([]);
  const [trackNotice, setTrackNotice] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const trackRef = useRef<GpsFix[]>([]);

  const fail = useCallback((code: number) => {
    const mapped = mapGpsError(code);
    setStatus(mapped.status);
    setError(mapped.message);
  }, []);

  /** Ambil satu posisi (fresh=true: tanpa cache, untuk patok). Resolve null bila gagal (pesan error ada di state). */
  const locate = useCallback((fresh = false): Promise<GpsFix | null> => {
    if (!isGpsSupported()) {
      setStatus('unsupported');
      setError('Perangkat atau browser ini tidak mendukung GPS.');
      return Promise.resolve(null);
    }
    setStatus('requesting');
    setError(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const f = toGpsFix(pos);
          setFix(f);
          setStatus('active');
          resolve(f);
        },
        (err) => {
          fail(err.code);
          resolve(null);
        },
        fresh ? { ...GPS_OPTIONS, maximumAge: 0 } : GPS_OPTIONS,
      );
    });
  }, [fail]);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (!isGpsSupported()) {
      setStatus('unsupported');
      setError('Perangkat atau browser ini tidak mendukung GPS.');
      return;
    }
    stopWatch();
    trackRef.current = [];
    setTrack([]);
    setTrackNotice(null);
    setError(null);
    setStatus('requesting');
    setIsTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const f = toGpsFix(pos);
        setFix(f);
        setStatus('active');
        const verdict = shouldAcceptTrackPoint(trackRef.current, f);
        if (verdict.accept) {
          trackRef.current = [...trackRef.current, f];
          setTrack(trackRef.current);
          setTrackNotice(null);
        } else if (verdict.reason) {
          setTrackNotice(TRACK_NOTICES[verdict.reason] || null);
        }
      },
      (err) => {
        // Kehilangan sinyal sesaat tidak menghentikan rekaman; izin ditolak menghentikan.
        fail(err.code);
        if (err.code === 1) {
          stopWatch();
          setIsTracking(false);
        }
      },
      GPS_OPTIONS,
    );
  }, [fail, stopWatch]);

  /** Hentikan rekaman; mengembalikan titik lintasan yang terkumpul. */
  const stopTracking = useCallback((): GpsFix[] => {
    stopWatch();
    setIsTracking(false);
    setTrackNotice(null);
    return trackRef.current;
  }, [stopWatch]);

  const clearTrack = useCallback(() => {
    trackRef.current = [];
    setTrack([]);
  }, []);

  useEffect(() => stopWatch, [stopWatch]);

  return {
    status,
    fix,
    error,
    isTracking,
    track,
    trackNotice,
    locate,
    startTracking,
    stopTracking,
    clearTrack,
  };
}
