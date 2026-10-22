/**
 * deploy.mjs — Salin hasil build ke root geolahan/ untuk GitHub Pages.
 *
 * Aturan penting:
 *  - TIDAK menimpa index.html (source Vite entry point)
 *  - TIDAK menimpa src/, tests/, scripts/, pwa/, public/
 *  - Hanya menyalin: assets/, sw.js, favicon.svg, icons/, manifest.webmanifest
 */

import { cpSync, existsSync, mkdirSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('❌ Folder dist/ tidak ditemukan. Jalankan npm run build terlebih dahulu.');
  process.exit(1);
}

// File/folder dari dist yang boleh dikopi ke root (tidak termasuk index.html)
const ALLOWED = ['assets', 'sw.js', 'favicon.svg', 'icon-maskable.svg', 'icons', 'manifest.webmanifest'];

let copied = 0;

for (const name of ALLOWED) {
  const src = join(dist, name);
  const dest = join(root, name);
  if (!existsSync(src)) continue;

  const stat = statSync(src);
  if (stat.isDirectory()) {
    cpSync(src, dest, { recursive: true, force: true });
    console.log(`📁 Copied dir : ${name}/`);
  } else {
    copyFileSync(src, dest);
    console.log(`📄 Copied file: ${name}`);
  }
  copied++;
}

// Juga copy index.html dari dist ke dist/ (tetap bisa diakses dari dist/ langsung)
// Tapi TIDAK copy ke root agar tidak menimpa source index.html
console.log('\n✅ Deploy selesai! File yang disalin:', copied);
console.log('   index.html sumber (Vite) tetap aman di root.');
console.log('   GitHub Pages akan serve dari: geolahan/assets/');
