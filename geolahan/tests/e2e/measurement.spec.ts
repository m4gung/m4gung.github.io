import { expect, test } from '@playwright/test';

test.describe('Fase 2 - Pengukuran & Geometri Lahan', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/peta');
  });

  test('toolbar pengukuran tampil dan tombol Ukur Lahan dapat diaktifkan', async ({ page }) => {
    const drawBtn = page.getByRole('button', { name: /ukur lahan/i });
    await expect(drawBtn).toBeVisible();

    // Klik untuk mengaktifkan mode gambar
    await drawBtn.click();
    await expect(page.getByRole('button', { name: /sedang menggambar/i })).toBeVisible();

    // Panel pengukuran menampilkan panduan gambar
    await expect(page.getByText('Klik pada peta untuk menentukan titik patok batas lahan.')).toBeVisible();

    // Klik lagi untuk membatalkan
    await page.getByRole('button', { name: /sedang menggambar/i }).click();
    await expect(page.getByRole('button', { name: /ukur lahan/i })).toBeVisible();
  });

  test('menggambar poligon via Leaflet memicu hasil kalkulasi luas dan tabel patok', async ({ page }) => {
    const drawBtn = page.getByRole('button', { name: /ukur lahan/i });
    await drawBtn.click();

    const map = page.locator('.geolahan-map');
    const box = await map.boundingBox();
    if (box) {
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;

      // Klik 3 titik untuk membuat segitiga
      await page.mouse.click(centerX - 80, centerY - 60);
      await page.waitForTimeout(200);
      await page.mouse.click(centerX + 80, centerY - 60);
      await page.waitForTimeout(200);
      await page.mouse.click(centerX, centerY + 80);
      await page.waitForTimeout(200);
      // Klik kembali titik pertama untuk menutup poligon
      await page.mouse.click(centerX - 80, centerY - 60);
      await page.waitForTimeout(400);

      // Verifikasi apakah panel kalkulasi muncul dengan rincian
      const panel = page.getByRole('region', { name: 'Panel Pengukuran Lahan' });
      await expect(panel).toBeVisible();
      await expect(panel.getByText(/Luas \(m²\)/i)).toBeVisible();
      await expect(panel.getByText(/Keliling Total:/i)).toBeVisible();
      await expect(panel.getByText(/Titik Patok/i)).toBeVisible();

      // Tombol Edit Patok dan Hapus muncul di toolbar
      await expect(page.getByTitle('Geser atau ubah titik patok poligon')).toBeVisible();
      await expect(page.getByTitle('Hapus bidang pengukuran')).toBeVisible();
    }
  });
});
