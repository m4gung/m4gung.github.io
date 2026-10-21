import { expect, test } from '@playwright/test';

test.describe('Fase 4 - GPS & Lintasan', () => {
  test.describe('izin diberikan', () => {
    test.use({
      permissions: ['geolocation'],
      geolocation: { latitude: -6.2, longitude: 106.8, accuracy: 5 },
    });

    test.beforeEach(async ({ page }) => {
      await page.goto('./#/peta');
    });

    test('Lokasi Saya menampilkan koordinat enam desimal, akurasi, dan status', async ({ page }) => {
      await page.getByRole('button', { name: /lokasi saya/i }).click();
      await expect(page.getByTestId('gps-lat')).toHaveText('-6.200000');
      await expect(page.getByTestId('gps-lon')).toHaveText('106.800000');
      await expect(page.getByTestId('gps-accuracy')).toContainText('5.0 m');
      await expect(page.getByTestId('gps-status')).toHaveText('Aktif');
      await expect(page.getByTestId('gps-warning')).toHaveCount(0);
      await expect(page.getByText(/bukan pengganti survei profesional/i)).toBeVisible();
    });

    test('akurasi rendah memunculkan peringatan', async ({ page, context }) => {
      await context.setGeolocation({ latitude: -6.2, longitude: 106.8, accuracy: 80 });
      await page.getByRole('button', { name: /lokasi saya/i }).click();
      await expect(page.getByTestId('gps-warning')).toBeVisible();
    });

    test('Tambah Patok GPS tiga kali membentuk poligon terukur', async ({ page, context }) => {
      const add = page.getByRole('button', { name: /tambah patok gps/i });
      const points = [
        { latitude: -6.2, longitude: 106.8 },
        { latitude: -6.2, longitude: 106.8005 },
        { latitude: -6.2005, longitude: 106.8005 },
      ];
      for (const p of points) {
        await context.setGeolocation({ ...p, accuracy: 5 });
        await add.click();
        await expect(page.getByTestId('gps-lat')).toHaveText(p.latitude.toFixed(6));
        await expect(page.getByTestId('gps-lon')).toHaveText(p.longitude.toFixed(6));
        await expect(page.getByTestId('gps-status')).toHaveText('Aktif');
        await page.waitForTimeout(300);
      }
      const panel = page.getByRole('region', { name: 'Panel Pengukuran Lahan' });
      await expect(panel).toBeVisible();
      await expect(panel.getByText(/Luas \(m²\)/i)).toBeVisible();
    });

    test('rekam lintasan lalu konfirmasi menjadi bidang', async ({ page, context }) => {
      await page.getByRole('button', { name: /rekam lintasan/i }).click();
      const points = [
        { latitude: -6.2, longitude: 106.8 },
        { latitude: -6.2, longitude: 106.8005 },
        { latitude: -6.2005, longitude: 106.8005 },
        { latitude: -6.2005, longitude: 106.8 },
      ];
      for (const [i, p] of points.entries()) {
        await context.setGeolocation({ ...p, accuracy: 5 });
        await expect(page.getByTestId('track-count')).toHaveText(String(i + 1), { timeout: 20_000 });
      }
      await page.getByRole('button', { name: /selesai rekam/i }).click();
      const dialog = page.getByRole('dialog', { name: 'Konfirmasi lintasan' });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: /jadikan bidang/i }).click();
      const panel = page.getByRole('region', { name: 'Panel Pengukuran Lahan' });
      await expect(panel.getByText(/Keliling Total:/i)).toBeVisible();
    });
  });

  test.describe('izin ditolak', () => {
    test.use({ permissions: [] });

    test('menampilkan pesan izin lokasi ditolak', async ({ page }) => {
      await page.goto('./#/peta');
      await page.getByRole('button', { name: /lokasi saya/i }).click();
      await expect(page.getByRole('alert').filter({ hasText: /izin lokasi ditolak/i })).toBeVisible();
      await expect(page.getByTestId('gps-status')).toHaveText('Izin ditolak');
    });
  });
});
