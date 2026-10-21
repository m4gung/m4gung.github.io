import { expect, test } from '@playwright/test';

test.describe('Fase 6 - PWA, offline, dan responsivitas', () => {
  test('manifest valid dan ikon dapat diakses', async ({ page, request }) => {
    await page.goto('./');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBe('./manifest.webmanifest');
    const res = await request.get(new URL(href!, page.url()).href);
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest).toMatchObject({ name: 'GeoLahan Pro', display: 'standalone', start_url: './', scope: './', lang: 'id' });
    const purposes = manifest.icons.map((i: { purpose: string }) => i.purpose);
    expect(purposes).toContain('maskable');
    for (const icon of manifest.icons) {
      const r = await request.get(new URL(icon.src, new URL(href!, page.url())).href);
      expect(r.ok(), icon.src).toBe(true);
    }
  });

  test('metadata SEO tersedia', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle(/GeoLahan Pro/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /peta satelit/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /m4gung\.github\.io\/geolahan/);
    expect(await page.locator('script[type="application/ld+json"]').count()).toBe(1);
  });

  test('service worker aktif dan aplikasi dapat dibuka offline', async ({ page, context }) => {
    await page.goto('./#/dashboard');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Tunggu sampai halaman dikendalikan SW (clients.claim).
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    await page.goto('./#/pengaturan');
    await expect(page.getByTestId('pwa-status')).toContainText(/offline/i);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Pengaturan', level: 1 })).toBeVisible();
    await page.goto('./#/lahan');
    await expect(page.getByRole('heading', { name: 'Daftar Lahan', level: 1 })).toBeVisible();
    await context.setOffline(false);
  });

  const pages = ['dashboard', 'peta', 'lahan', 'laporan', 'pengaturan'];
  const viewports = [
    { width: 360, height: 740 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];
  for (const vp of viewports) {
    test(`tanpa scroll horizontal pada ${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp);
      for (const route of pages) {
        await page.goto(`./#/${route}`);
        await expect(page.locator('main')).toBeVisible();
        await page.waitForTimeout(250);
        const overflow = await page.evaluate(() => {
          const main = document.querySelector('main')!;
          return {
            doc: document.documentElement.scrollWidth - window.innerWidth,
            main: main.scrollWidth - main.clientWidth,
          };
        });
        expect(overflow.doc, `${route} doc overflow`).toBeLessThanOrEqual(1);
        expect(overflow.main, `${route} main overflow`).toBeLessThanOrEqual(1);
      }
    });
  }
});
