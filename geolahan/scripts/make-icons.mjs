// Membuat ikon PNG PWA dari SVG sumber memakai Chrome (Playwright). Jalankan: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const targets = [
  { svg: 'public/favicon.svg', out: 'public/icons/icon-192.png', size: 192 },
  { svg: 'public/favicon.svg', out: 'public/icons/icon-512.png', size: 512 },
  { svg: 'public/icon-maskable.svg', out: 'public/icons/apple-touch-icon.png', size: 180 },
  { svg: 'public/icon-maskable.svg', out: 'public/icons/icon-maskable-512.png', size: 512 },
];

const browser = await chromium.launch({ channel: 'chrome' });
for (const t of targets) {
  const page = await browser.newPage({ viewport: { width: t.size, height: t.size } });
  const svg = readFileSync(t.svg, 'utf8');
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${t.size}" height="${t.size}" `)}</body></html>`);
  await page.screenshot({ path: t.out, omitBackground: true });
  await page.close();
  console.log('ok', t.out);
}
await browser.close();
