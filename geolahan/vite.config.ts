/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// Membangkitkan sw.js dengan daftar precache dari seluruh hasil build (nama berhash).
function geolahanServiceWorker(): Plugin {
  let outDir = 'dist';
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  return {
    name: 'geolahan-sw',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files = walk(outDir)
        .map((f) => relative(outDir, f).split(sep).join('/'))
        .filter((f) => f !== 'sw.js' && !f.endsWith('.map'))
        .sort();
      const hash = createHash('sha256');
      for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)));
      const precache = ['./', ...files.map((f) => `./${f}`)];
      const template = readFileSync('pwa/sw.template.js', 'utf8');
      writeFileSync(
        join(outDir, 'sw.js'),
        template
          .replace('__VERSION__', hash.digest('hex').slice(0, 12))
          .replace('__PRECACHE__', JSON.stringify(precache, null, 2)),
      );
    },
  };
}

// base './' agar hasil build dapat disajikan dari subfolder statis
// (mis. GitHub Pages: m4gung.github.io/geolahan/dist/). Routing memakai HashRouter.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), geolahanServiceWorker()],
  build: {
    rolldownOptions: {
      output: {
        // Pisahkan vendor agar cache browser tetap valid saat kode aplikasi berubah.
        codeSplitting: {
          groups: [
            { name: 'vendor-leaflet', test: /node_modules[\\/]leaflet/ },
            { name: 'vendor-react', test: /node_modules[\\/](react|react-dom|react-router|scheduler|dexie|dexie-react-hooks)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
});
