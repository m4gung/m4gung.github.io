import { describe, expect, it } from 'vitest';
import {
  GPS_ACCURACY_WARN_M,
  TRACK_MAX_POINTS,
  fixesToPositions,
  formatCoord,
  isAccuracyPoor,
  mapGpsError,
  shouldAcceptTrackPoint,
  type GpsFix,
} from '../../src/features/gps/gps.service';

const fix = (lat: number, lon: number, acc = 5): GpsFix => ({
  latitude: lat,
  longitude: lon,
  accuracyM: acc,
  timestamp: 0,
});

describe('gps.service', () => {
  it('memetakan kode error geolocation', () => {
    expect(mapGpsError(1).status).toBe('denied');
    expect(mapGpsError(2).status).toBe('unavailable');
    expect(mapGpsError(3).status).toBe('timeout');
  });

  it('mendeteksi akurasi buruk di atas ambang', () => {
    expect(isAccuracyPoor(GPS_ACCURACY_WARN_M)).toBe(false);
    expect(isAccuracyPoor(GPS_ACCURACY_WARN_M + 1)).toBe(true);
  });

  it('menerima titik pertama berakurasi baik', () => {
    expect(shouldAcceptTrackPoint([], fix(-6.2, 106.8)).accept).toBe(true);
  });

  it('menolak titik berakurasi buruk', () => {
    expect(shouldAcceptTrackPoint([], fix(-6.2, 106.8, 100))).toEqual({ accept: false, reason: 'poor_accuracy' });
  });

  it('menolak titik yang terlalu dekat dengan titik terakhir', () => {
    const track = [fix(-6.2, 106.8)];
    expect(shouldAcceptTrackPoint(track, fix(-6.2, 106.800001))).toEqual({ accept: false, reason: 'too_close' });
  });

  it('menerima titik yang cukup jauh', () => {
    const track = [fix(-6.2, 106.8)];
    expect(shouldAcceptTrackPoint(track, fix(-6.2, 106.8001)).accept).toBe(true);
  });

  it('menolak titik saat batas jumlah tercapai', () => {
    const track = Array.from({ length: TRACK_MAX_POINTS }, (_, i) => fix(-6.2, 106.8 + i * 0.001));
    expect(shouldAcceptTrackPoint(track, fix(-6.2, 107.5))).toEqual({ accept: false, reason: 'limit_reached' });
  });

  it('mengonversi fix ke posisi [lng, lat] dengan presisi asli', () => {
    expect(fixesToPositions([fix(-6.123456789, 106.987654321)])).toEqual([[106.987654321, -6.123456789]]);
  });

  it('memformat koordinat enam desimal', () => {
    expect(formatCoord(-6.1234567)).toBe('-6.123457');
  });
});
