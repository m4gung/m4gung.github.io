import { describe, expect, it } from 'vitest';
import type { Position } from 'geojson';
import {
  calculateMeasurement,
  ensureClosedRing,
  formatCoord,
  formatNumberId,
  validateCoordinates,
} from '../../src/features/measurement/geometry.service';

describe('validateCoordinates', () => {
  it('menolak koordinat kurang dari 3 titik', () => {
    const coords: Position[] = [
      [110.0, -7.0],
      [110.1, -7.0],
    ];
    const res = validateCoordinates(coords);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('minimal 3 titik');
  });

  it('menolak koordinat di luar batas WGS 84', () => {
    const coords: Position[] = [
      [110.0, -95.0],
      [110.1, -7.0],
      [110.1, -7.1],
    ];
    const res = validateCoordinates(coords);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('WGS 84');
  });

  it('menolak titik bersebelahan yang bertumpuk (panjang sisi nol)', () => {
    const coords: Position[] = [
      [110.0, -7.0],
      [110.0, -7.0],
      [110.1, -7.1],
    ];
    const res = validateCoordinates(coords);
    expect(res.valid).toBe(false);
    expect(res.error).toContain('bertumpuk');
  });

  it('menerima poligon 3 titik valid', () => {
    const coords: Position[] = [
      [110.0, -7.0],
      [110.1, -7.0],
      [110.1, -7.1],
    ];
    const res = validateCoordinates(coords);
    expect(res.valid).toBe(true);
  });
});

describe('ensureClosedRing', () => {
  it('menutup ring jika belum tertutup', () => {
    const open: Position[] = [
      [10, 20],
      [30, 40],
      [50, 60],
    ];
    const closed = ensureClosedRing(open);
    expect(closed).toHaveLength(4);
    expect(closed[3]).toEqual([10, 20]);
  });

  it('tidak menduplikasi penutup jika sudah tertutup', () => {
    const alreadyClosed: Position[] = [
      [10, 20],
      [30, 40],
      [10, 20],
    ];
    const res = ensureClosedRing(alreadyClosed);
    expect(res).toHaveLength(3);
  });
});

describe('calculateMeasurement', () => {
  // Bujur sangkar ~100m x 100m di sekitar ekuator (0.0009 derajat ~ 100m)
  // [0, 0], [0.0009, 0], [0.0009, 0.0009], [0, 0.0009]
  const square: Position[] = [
    [106.827, -6.175],
    [106.828, -6.175],
    [106.828, -6.176],
    [106.827, -6.176],
  ];

  it('menghitung luas m², are, dan hektare secara konsisten', () => {
    const result = calculateMeasurement(square);
    expect(result.isValid).toBe(true);
    expect(result.areaM2).toBeGreaterThan(10000); // ~110m x ~110m ~12.000m²
    expect(result.areaAre).toBeCloseTo(result.areaM2 / 100, 4);
    expect(result.areaHa).toBeCloseTo(result.areaM2 / 10000, 6);
  });

  it('menghasilkan patok P1..Pn dengan koordinat dan jarak ke patok berikutnya', () => {
    const result = calculateMeasurement(square);
    expect(result.controlPoints).toHaveLength(4);
    expect(result.controlPoints[0]?.label).toBe('P1');
    expect(result.controlPoints[3]?.label).toBe('P4');

    // Jumlah jarak segmen patok harus konsisten dengan keliling total (toleransi < 1 meter)
    const sumSegmentDistances = result.controlPoints.reduce((acc, cp) => acc + cp.distanceToNextM, 0);
    expect(Math.abs(sumSegmentDistances - result.perimeterM)).toBeLessThan(0.01);
  });

  it('menghitung centroid dalam poligon', () => {
    const result = calculateMeasurement(square);
    const [lat, lon] = result.centroid;
    expect(lat).toBeLessThan(-6.175);
    expect(lat).toBeGreaterThan(-6.176);
    expect(lon).toBeGreaterThan(106.827);
    expect(lon).toBeLessThan(106.828);
  });

  it('mendeteksi poligon self-intersection (kink/silang)', () => {
    // Bentuk jam pasir / angka 8
    const bowtie: Position[] = [
      [0, 0],
      [1, 1],
      [0, 1],
      [1, 0],
    ];
    const result = calculateMeasurement(bowtie);
    expect(result.isValid).toBe(false);
    expect(result.validationError).toContain('saling silang');
  });
});

describe('formatting helper', () => {
  it('memformat angka ribuan Indonesia dan koordinat', () => {
    expect(formatNumberId(12345.678)).toBe('12.345,68');
    expect(formatCoord(-6.175400123)).toBe('-6.175400');
  });
});
