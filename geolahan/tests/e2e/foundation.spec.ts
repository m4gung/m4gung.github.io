import { expect, test, type Page } from '@playwright/test';

const SCREENSHOT_DIR = process.env.GEOLAHAN_SCREENSHOT_DIR;

async function snap(page: Page, name: string) {
  if (SCREENSHOT_DIR) await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png` });
}

/** Menunggu minimal satu tile dari host tertentu benar-benar termuat (gambar ter-decode). */
async function expectTilesLoaded(page: Page, hostFragment: string) {
  await expect
    .poll(
      () =>
        page.evaluate((host) => {
          const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.leaflet-tile-pane img'));
          return imgs.filter((img) => img.src.includes(host) && img.complete && img.naturalWidth > 0).length;
        }, hostFragment),
      { message: `tile dari ${hostFragment} termuat`, timeout: 20_000 },
    )
    .toBeGreaterThan(0);
}

test.describe('Fondasi peta', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveURL(/#\/peta$/);
  });

  test('peta satelit termuat dengan atribusi, skala, dan zoom', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await expectTilesLoaded(page, 'World_Imagery');
    await expect(page.locator('.leaflet-control-attribution')).toContainText('Esri');
    await expect(page.locator('.leaflet-control-attribution')).toContainText('Leaflet');
    await expect(page.locator('.leaflet-control-scale-line')).toBeVisible();
    await expect(page.locator('.leaflet-control-zoom-in')).toBeVisible();
    await snap(page, `${test.info().project.name}-satellite`);
    expect(errors).toEqual([]);
  });

  test('beralih ke Hybrid dan Peta Jalan memuat tile yang sesuai', async ({ page }) => {
    await page.getByRole('button', { name: /pilih layer peta/i }).click();
    await page.getByRole('radio', { name: /hybrid/i }).click();
    await expectTilesLoaded(page, 'World_Transportation');
    await expectTilesLoaded(page, 'World_Boundaries_and_Places');
    await snap(page, `${test.info().project.name}-hybrid`);

    await page.getByRole('button', { name: /pilih layer peta/i }).click();
    await page.getByRole('radio', { name: /peta jalan/i }).click();
    await expectTilesLoaded(page, 'tile.openstreetmap.org');
    await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');
    // Layer satelit lama harus sudah dilepas (tidak menumpuk).
    await expect
      .poll(() => page.locator('.leaflet-tile-pane img[src*="World_Imagery"]').count())
      .toBe(0);

    // Pilihan layer bertahan setelah reload.
    await page.reload();
    await expectTilesLoaded(page, 'tile.openstreetmap.org');
  });

  test('mode gelap dapat diaktifkan dan bertahan setelah reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
    await page.getByRole('button', { name: /aktifkan mode gelap/i }).click();
    await expect(html).toHaveClass(/dark/);
    await page.reload();
    await expect(html).toHaveClass(/dark/);
    await snap(page, `${test.info().project.name}-dark`);
    await page.getByRole('button', { name: /aktifkan mode terang/i }).click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('navigasi sidebar ke halaman lain dan kembali ke peta', async ({ page, isMobile }) => {
    const sidebar = page.locator('#app-sidebar');
    if (isMobile) {
      await expect(sidebar).not.toBeInViewport();
      await page.getByRole('button', { name: 'Buka menu' }).click();
      await expect(sidebar).toBeInViewport();
      await snap(page, `${test.info().project.name}-drawer`);
      await page.keyboard.press('Escape');
      await expect(sidebar).not.toBeInViewport();
      await page.getByRole('button', { name: 'Buka menu' }).click();
    } else {
      const before = await sidebar.boundingBox();
      await page.getByRole('button', { name: 'Ciutkan sidebar' }).click();
      await expect.poll(async () => (await sidebar.boundingBox())?.width).toBeLessThan(before!.width);
      // Peta tetap mengisi area setelah sidebar diciutkan (tunggu transisi selesai)
      await expect
        .poll(async () => {
          const main = await page.locator('#main-content').boundingBox();
          const map = await page.locator('.geolahan-map').boundingBox();
          return main && map ? Math.abs(Math.round(map.width) - Math.round(main.width)) : -1;
        })
        .toBeLessThanOrEqual(1);
      await page.getByRole('button', { name: 'Perluas sidebar' }).click();
    }
    await sidebar.getByRole('link', { name: 'Pengaturan' }).click();
    await expect(page).toHaveURL(/#\/pengaturan$/);
    await expect(page.getByRole('heading', { name: 'Pengaturan', level: 1 })).toBeVisible();
    if (isMobile) await expect(sidebar).not.toBeInViewport();

    if (isMobile) await page.getByRole('button', { name: 'Buka menu' }).click();
    await sidebar.getByRole('link', { name: 'Peta & Pengukuran' }).click();
    await expect(page.locator('.geolahan-map')).toBeVisible();
  });

  test('pencarian terlalu pendek ditolak tanpa permintaan jaringan', async ({ page }) => {
    let geocodeRequests = 0;
    page.on('request', (r) => r.url().includes('nominatim') && geocodeRequests++);
    await page.getByRole('combobox', { name: 'Cari lokasi' }).fill('ab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toContainText('minimal 3 karakter');
    expect(geocodeRequests).toBe(0);
  });

  test('kegagalan geocoding menampilkan pesan error yang jelas', async ({ page }) => {
    await page.route('**/nominatim.openstreetmap.org/**', (route) => route.abort('internetdisconnected'));
    await page.getByRole('combobox', { name: 'Cari lokasi' }).fill('Kabupaten Sleman');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toContainText('Tidak dapat terhubung');
  });
});

test.describe('Pencarian lokasi (Nominatim nyata)', () => {
  test('mencari kabupaten lalu memusatkan peta ke hasil', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'Satu permintaan nyata saja untuk menghormati kebijakan Nominatim');
    await page.goto('./#/peta');
    const search = page.getByRole('combobox', { name: 'Cari lokasi' });
    await search.fill('Kabupaten Sleman');
    await page.keyboard.press('Enter');
    const options = page.getByRole('option');
    await expect(options.first()).toBeVisible({ timeout: 20_000 });
    await expect(options.first()).toContainText(/Sleman/i);
    await snap(page, 'desktop-search-results');
    await options.first().click();

    await expect(page.locator('.geolahan-search-marker')).toBeVisible();
    await expect(page.locator('.leaflet-popup-content')).toContainText(/Sleman/i, { timeout: 10_000 });
    // Peta sudah berpindah dari zoom awal Indonesia (5) ke tingkat kabupaten.
    await expectTilesLoaded(page, 'World_Imagery');
    await snap(page, 'desktop-search-focused');
  });
});
