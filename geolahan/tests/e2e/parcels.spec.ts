import { expect, test } from '@playwright/test';

test.describe('Fase 3 - Manajemen Data Lahan (CRUD & IndexedDB)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./#/peta');
  });

  test('alur simpan lahan baru, muncul di sidebar, dan bertahan setelah reload', async ({ page, isMobile }) => {
    // 1. Gambar poligon segitiga di peta
    const drawBtn = page.getByRole('button', { name: /ukur lahan/i });
    await drawBtn.click();

    const map = page.locator('.geolahan-map');
    const box = await map.boundingBox();
    if (!box) return;

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.click(centerX - 70, centerY - 50);
    await page.waitForTimeout(200);
    await page.mouse.click(centerX + 70, centerY - 50);
    await page.waitForTimeout(200);
    await page.mouse.click(centerX, centerY + 70);
    await page.waitForTimeout(200);
    await page.mouse.click(centerX - 70, centerY - 50);
    await page.waitForTimeout(400);

    // 2. Klik tombol Simpan Lahan di toolbar
    const saveToolbarBtn = page.getByTitle('Simpan bidang tanah ke database');
    await expect(saveToolbarBtn).toBeVisible();
    await saveToolbarBtn.click();

    // 3. Modal Form Simpan Lahan terbuka
    const modal = page.getByRole('dialog', { name: 'Simpan Pengukuran Lahan' });
    await expect(modal).toBeVisible();

    const parcelName = `Lahan Pengujian ${Date.now()}`;
    await page.fill('#parcel-name', parcelName);
    await page.fill('#parcel-owner', 'Bapak Suryanto');
    await page.fill('#parcel-desc', 'Sawah irigasi teknis');

    // Submit form
    await page.click('button[type="submit"]:has-text("Simpan Lahan")');
    await expect(modal).not.toBeVisible();

    // 4. Verifikasi muncul di Sidebar / Drawer
    if (isMobile) {
      await page.getByRole('button', { name: 'Buka menu' }).click();
    }
    const sidebar = page.locator('#app-sidebar');
    await expect(sidebar.getByText(parcelName)).toBeVisible();

    // 5. Cek persistensi setelah reload halaman penuh
    await page.reload();
    if (isMobile) {
      await page.getByRole('button', { name: 'Buka menu' }).click();
    }
    await expect(sidebar.getByText(parcelName)).toBeVisible();

    // 6. Navigasi ke Halaman Daftar Lahan (/lahan)
    await sidebar.getByRole('link', { name: 'Daftar Lahan' }).click();
    await expect(page).toHaveURL(/#\/lahan$/);
    const mainContent = page.locator('main');
    await expect(mainContent.getByRole('link', { name: parcelName })).toBeVisible();
    await expect(mainContent.locator('span').filter({ hasText: 'Bapak Suryanto' })).toBeVisible();

    // 7. Masuk ke halaman Detail Lahan
    await mainContent.getByRole('link', { name: parcelName }).click();
    await expect(page.getByRole('heading', { name: parcelName })).toBeVisible();
    await expect(page.getByText('Tabel Koordinat Patok')).toBeVisible();

    // 8. Hapus Lahan via Detail
    await page.getByTitle('Hapus Lahan').click();
    const confirmDialog = page.getByRole('dialog', { name: 'Hapus Bidang Lahan' });
    await expect(confirmDialog).toBeVisible();
    await page.click('button:has-text("Hapus Data")');

    // Harus redirect kembali ke /lahan dan lahan tidak ada lagi
    await expect(page).toHaveURL(/#\/lahan$/);
    await expect(page.getByText(parcelName)).not.toBeVisible();
  });
});
