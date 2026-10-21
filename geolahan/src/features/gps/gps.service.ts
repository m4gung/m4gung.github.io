/**
 * Layanan GPS murni (tanpa React) — memetakan error Geolocation, klasifikasi akurasi,
 * dan penyaring titik lintasan. GPS ponsel BUKAN alat survei profesional.
 */

import type { Position } from 'geojson';
import { distance as turfDistance, point } from '@turf/turf';

export interface GpsFix {
  latitude: number;
  longitude: number;
  /** Akurasi horizontal dalam meter (properti accuracy Geolocation API). */
  accuracyM: number;
  /** Epoch ms waktu pengambilan posisi. */
  timestamp: number;
}

export type GpsStatus = 'idle' | 'requesting' | 'active' | 'denied' | 'unavailable' | 'timeout' | 'unsupported';

export const GPS_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20_000,
  maximumAge: 2_000,
} as const satisfies PositionOptions;

/** Akurasi di atas ambang ini memicu peringatan (meter). */
export const GPS_ACCURACY_WARN_M = 20;
/** Titik lintasan dengan akurasi di atas ini diabaikan (meter). */
export const TRACK_MAX_ACCURACY_M = 30;
/** Jarak minimum antar titik lintasan agar tidak mengambil titik berulang (meter). */
export const TRACK_MIN_DISTANCE_M = 3;
/** Batas jumlah titik lintasan. */
export const TRACK_MAX_POINTS = 500;

export const GPS_DISCLAIMER =
  'GPS ponsel dapat bergalat beberapa meter atau lebih; bukan pengganti survei profesional.';

export function isGpsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

export function toGpsFix(pos: GeolocationPosition): GpsFix {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracyM: pos.coords.accuracy,
    timestamp: pos.timestamp,
  };
}

export function mapGpsError(code: number): { status: GpsStatus; message: string } {
  switch (code) {
    case 1:
      return {
        status: 'denied',
        message: 'Izin lokasi ditolak. Aktifkan izin lokasi untuk situs ini di pengaturan browser.',
      };
    case 2:
      return { status: 'unavailable', message: 'Lokasi tidak tersedia. Periksa sinyal GPS atau koneksi Anda.' };
    case 3:
      return { status: 'timeout', message: 'Waktu pengambilan lokasi habis. Coba lagi di area terbuka.' };
    default:
      return { status: 'unavailable', message: 'Terjadi kesalahan saat membaca lokasi.' };
  }
}

export function isAccuracyPoor(accuracyM: number): boolean {
  return accuracyM > GPS_ACCURACY_WARN_M;
}

/** Jarak geodesik antar dua fix dalam meter. */
export function fixDistanceM(a: GpsFix, b: GpsFix): number {
  return turfDistance(point([a.longitude, a.latitude]), point([b.longitude, b.latitude]), { units: 'meters' });
}

/**
 * Menentukan apakah titik baru layak ditambahkan ke lintasan.
 * Menolak titik berakurasi buruk, titik terlalu dekat, dan melebihi batas jumlah.
 */
export function shouldAcceptTrackPoint(
  track: readonly GpsFix[],
  candidate: GpsFix,
): { accept: boolean; reason?: 'poor_accuracy' | 'too_close' | 'limit_reached' } {
  if (track.length >= TRACK_MAX_POINTS) return { accept: false, reason: 'limit_reached' };
  if (candidate.accuracyM > TRACK_MAX_ACCURACY_M) return { accept: false, reason: 'poor_accuracy' };
  const last = track[track.length - 1];
  if (last && fixDistanceM(last, candidate) < TRACK_MIN_DISTANCE_M) return { accept: false, reason: 'too_close' };
  return { accept: true };
}

/** Koordinat GeoJSON [lng, lat] dari fix GPS (presisi asli dipertahankan). */
export function fixesToPositions(fixes: readonly GpsFix[]): Position[] {
  return fixes.map((f) => [f.longitude, f.latitude]);
}

export function formatCoord(value: number): string {
  return value.toFixed(6);
}
