import { cpSync, existsSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('❌ Folder dist/ tidak ditemukan. Jalankan npm run build terlebih dahulu.');
  process.exit(1);
}

const ALLOWED = [
  'assets',
  'sw.js',
  'workbox-dcde9eb3.js',
  'registerSW.js',
  'manifest.webmanifest',
  'manifest.json',
  'index.html',
  'offline.html',
];

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

console.log('\n✅ Deploy lokal selesai! File yang disalin:', copied);
