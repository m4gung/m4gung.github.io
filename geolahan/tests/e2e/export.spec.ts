import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const ring = [
  [110.0, -7.0],
  [110.001, -7.0],
  [110.001, -7.001],
  [110.0, -7.001],
  [110.0, -7.0],
];

const parcel = {
  id: 'e2e-parcel-1',
  name: 'Lahan E2E Fase 5',
  owner: 'Ibu Sari',
  color: '#059669',
  measuredAt: '2026-10-21',
  createdAt: '2026-10-21T01:00:00.000Z',
  updatedAt: '2026-10-21T01:00:00.000Z',
  geometry: { type: 'Polygon', coordinates: [ring] },
  areaM2: 12300.5,
  areaAre: 123.005,
  areaHa: 1.23005,
  perimeterM: 440.2,
  centroid: [-7.0005, 110.0005],
  measurementMethod: 'map_digitization',
  controlPoints: ring.slice(0, 4).map((p, i) => ({
    id: `P${i + 1}`,
    number: i + 1,
    label: `P${i + 1}`,
    latitude: p[1],
    longitude: p[0],
    distanceToNextM: 111.1,
  })),
};

const backup = { format: 'geolahan-backup', version: 1, exportedAt: new Date().toISOString(), app: 'GeoLahan Pro', parcelCount: 1, parcels: [parcel] };

test.describe('Fase 5 - Ekspor, Backup & Laporan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/laporan');
    await page.getByLabel('Pilih berkas backup').setInputFiles({
      name: 'b.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    const dialog = page.getByRole('dialog', { name: 'Konfirmasi restore' });
    await expect(dialog).toContainText('1');
    await dialog.getByLabel(/lewati duplikat/i).check();
    await dialog.getByRole('button', { name: 'Terapkan Restore' }).click();
    await expect(page.getByRole('list', { name: 'Daftar lahan untuk laporan' })).toContainText('Lahan E2E Fase 5');
  });

  test('restore menampilkan lahan; restore ulang melewati duplikat', async ({ page }) => {
    await page.getByLabel('Pilih berkas backup').setInputFiles({
      name: 'b.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    const dialog = page.getByRole('dialog', { name: 'Konfirmasi restore' });
    await expect(dialog).toContainText('bentrok');
    await dialog.getByLabel(/lewati duplikat/i).check();
    await dialog.getByRole('button', { name: 'Terapkan Restore' }).click();
    await expect(page.getByText(/1 dilewati/)).toBeVisible();
  });

  test('berkas backup rusak ditolak tanpa mengubah data', async ({ page }) => {
    await page.getByLabel('Pilih berkas backup').setInputFiles({
      name: 'rusak.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ini rusak'),
    });
    await expect(page.getByRole('alert')).toContainText(/rusak/i);
    await expect(page.getByRole('list', { name: 'Daftar lahan untuk laporan' }).getByRole('listitem')).toHaveCount(1);
  });

  test('ekspor GeoJSON satu lahan valid dan dapat dimuat ulang', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTitle('Ekspor GeoJSON Lahan E2E Fase 5').click(),
    ]);
    expect(download.suggestedFilename()).toBe('Lahan-E2E-Fase-5.geojson');
    const json = JSON.parse(await readFile((await download.path())!, 'utf8'));
    expect(json.type).toBe('Feature');
    expect(json.geometry.type).toBe('Polygon');
    expect(json.geometry.coordinates[0]).toEqual(ring);
    expect(json.properties.name).toBe('Lahan E2E Fase 5');

    // Impor kembali file yang sama
    await page.locator('input[aria-label="Pilih berkas GeoJSON"]').setInputFiles(await download.path()!);
    await expect(page.getByText(/1 lahan diimpor dari GeoJSON/)).toBeVisible();
  });

  test('backup JSON mengunduh berkas bernama jelas', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /backup json/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^geolahan-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const json = JSON.parse(await readFile((await download.path())!, 'utf8'));
    expect(json.version).toBe(1);
    expect(json.parcels.length).toBeGreaterThanOrEqual(1);
  });

  test('cetak PDF dengan gambar peta menghasilkan berkas Laporan-GeoLahan', async ({ page }, testInfo) => {
    const row = page.getByRole('listitem').filter({ hasText: 'Lahan E2E Fase 5' });
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 40_000 }),
      row.getByRole('button', { name: /cetak pdf/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^Laporan-GeoLahan-Lahan-E2E-Fase-5-\d{4}-\d{2}-\d{2}\.pdf$/);
    const path = (await download.path())!;
    expect((await readFile(path)).subarray(0, 5).toString()).toBe('%PDF-');
    await expect(row.getByRole('status')).not.toContainText('tanpa gambar peta');
    await download.saveAs(testInfo.outputPath('laporan.pdf'));
  });

  test('bila peta gagal diambil, tersedia cetak tanpa peta', async ({ page }) => {
    // Blokir tile agar penangkapan peta gagal.
    await page.route('**/server.arcgisonline.com/**', (route) => route.abort());
    const row = page.getByRole('listitem').filter({ hasText: 'Lahan E2E Fase 5' });
    await row.getByRole('button', { name: /cetak pdf/i }).click();
    await expect(row.getByRole('alert')).toContainText(/gambar peta gagal/i, { timeout: 30_000 });
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      row.getByRole('button', { name: /cetak tanpa peta/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
    await expect(row.getByRole('status')).toContainText('tanpa gambar peta');
  });
});
