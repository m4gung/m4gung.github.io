# ScanPro Studio

ScanPro Studio adalah aplikasi produktivitas dokumen lokal pertama yang dapat diinstal (PWA) untuk memindai, mengedit PDF, mengedit canvas, melakukan OCR, dan mencetak dokumen secara lokal. Dibangun dengan prinsip privasi dan fungsionalitas lengkap.

## Produk

- **Nama**: ScanPro Studio
- **Platform**: Aplikasi web responsif dan dapat diinstal (PWA)
- **Perangkat target**: Android phone, iPhone, tablet, Windows, macOS, Linux browser
- **Penyimpanan**: Lokal-pertama, menggunakan IndexedDB untuk metadata dokumen dan aset biner
- **Backend**: Tidak diperlukan untuk rilis awal
- **Autentikasi**: Tidak diperlukan untuk MVP lokal-pertama
- **Editor**: Edit canvas terstruktur dan operasi PDF yang didukung
- **OCR**: Bahasa Indonesia dan Inggris, tergantung ketersediaan data OCR lokal
- **Cetak**: Workflow cetak browser dan PDF siap cetak yang dapat diunduh
- **Operasi offline**: Shell aplikasi dan aset pemrosesan yang sudah diunduh bekerja offline setelah pengaturan berhasil, tergantung pada kemampuan browser dan penyimpanan
- **Bahasa default**: Bahasa Indonesia
- **Komponen pemrosesan**: Mendukung 2D OCR dengan Tesseract.js, OCR 3D dengan Web Workers
- **Komponen keamanan**: DOM pur, cookie terputus, CSP, dan antisipasi privasi

## Fitur Utama

### Phase 1 - Fondasi Produksi ✅
- Vite + React 19 + TypeScript 7 + Tailwind CSS 4
- Dashboard responsif dengan navigasi
- Tema gelap/terang (system preference)
- IndexedDB (Dexie) untuk persistensi lokal
- PWA manifest + Service Worker (Workbox)
- Offline shell dengan fallback

### Phase 2 - Scanner ✅
- Akses kamera (environment/user facing)
- Multi-page scanning sessions
- Crop, rotate 90° increments
- Manual perspective correction (4-point drag)
- Auto edge detection (OpenCV.js optional)
- Image enhancement (contrast, brightness, sharpen, grayscale)
- Auto-save & session recovery
- Export to document library

### Phase 3 - PDF Foundation ✅
- PDF import & preview (PDF.js)
- Page metadata extraction
- Page rotate, delete, reorder
- PDF generation & export (pdf-lib)
- Merge & split PDFs
- Print workflow

### Phase 4 - Canvas Editor ✅
- 11 element types: text, rectangle, ellipse, line, arrow, freehand, image, signature, sticky-note, highlight
- Interactive canvas with zoom/pan/grid
- Drag-drop reorder, multi-select
- Inline property editor per element type
- Layers panel with z-order, visibility, lock
- Undo/redo (50 steps)
- Keyboard shortcuts (V=select, T=text, R=rect, E=ellipse, L=line, A=arrow, F=freehand, I=image, S=signature, N=sticky-note, H=highlight, G=grid, 0=reset zoom, +/-=zoom, Del=delete, Ctrl+Z/Y=undo/redo, Ctrl+D=duplicate, Esc=deselect)
- Export canvas as image/JSON

### Phase 5 - OCR ✅
- Tesseract.js wrapper (Indonesian + English)
- Document OCR (multi-page)
- Image OCR (direct upload)
- Batch OCR with progress tracking
- Full-text search across OCR results
- Confidence scoring per word/line/block
- Editable OCR output with search/highlight

### Phase 6 - Advanced PDF Editing ✅
- PDF capability inspection (fonts, pages, forms)
- Annotations: text, highlight, ink
- Form fields: text, checkbox, radio, dropdown, flatten
- Redaction (area-based)
- Overlays: text, image, watermark
- Backup & restore with verification
- Batch advanced editing pipeline

## Persyaratan Sistem

- Browser web modern (Chrome 90+, Firefox 88+, Safari 15+, Edge 90+)
- Akses kamera untuk pemindaian
- Media penyimpanan lokal (IndexedDB, ~50MB+)
- HTTPS untuk PWA features (Service Worker, install prompt)

## Instalasi & Pengembangan

```bash
# Clone & install
cd scanpro
npm install

# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

## Testing & Quality Assurance

```bash
# Unit tests
npm run test:run

# Watch mode
npm run test

# Linting
npm run lint

# TypeScript type check
npm run typecheck

# Production build verification
npm run build
```

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):
- **Lint & TypeCheck**: ESLint + TypeScript strict
- **Unit Tests**: Vitest + React Testing Library
- **Production Build**: Vite build with PWA
- **E2E Tests**: Playwright (chromium)
- **Lighthouse CI**: Performance, accessibility, PWA budgets
- **Deploy Preview**: Netlify preview for PRs
- **Deploy Production**: Netlify production on main branch

### Required Secrets (GitHub Settings → Secrets)
```
NETLIFY_AUTH_TOKEN    # From Netlify User Settings → Applications
NETLIFY_SITE_ID       # From Netlify Site Settings → General
```

## Deployment

### Static Hosting (Recommended)

#### Netlify (Auto-deploy via GitHub Actions)
1. Connect repo in Netlify dashboard
2. Build command: `npm run build`
3. Publish directory: `dist`
3. Add redirects for SPA: `/* /index.html 200`

#### Vercel
```bash
vercel --prod
```

#### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### GitHub Pages
```bash
npm run build
npx gh-pages -d dist
```
Configure `vite.config.ts`: `base: '/your-repo-name/'`

### PWA Requirements
- HTTPS required (Service Worker)
- Valid `manifest.webmanifest`
- Icons: 192x192, 512x512
- `offline.html` fallback
- Service Worker with `SKIP_WAITING`

## Project Structure

```
scanpro/
├── public/
│   ├── icons/              # PWA icons
│   ├── manifest.webmanifest
│   ├── sw.js               # Service Worker
│   └── offline.html        # Offline fallback
├── src/
│   ├── app/                # App shell, router, providers
│   ├── components/         # Shared UI components
│   ├── features/           # Feature modules
│   │   ├── dashboard/
│   │   ├── documents/      # Document list, import, create
│   │   ├── folders/        # Folder management
│   │   ├── scanner/        # Camera, scan preview, workspace
│   │   ├── pdf-editor/     # PDF import, edit, export
│   │   ├── canvas-editor/  # Canvas drawing, editing
│   │   ├── ocr/            # OCR workspace, progress, editor
│   │   ├── advanced-pdf-editor/  # Advanced PDF ops
│   │   └── settings/
│   ├── layouts/
│   ├── domain/             # Domain models, validation
│   ├── application/        # Use cases, services
│   ├── infrastructure/     # Adapters (DB, camera, PDF, OCR, etc.)
│   ├── stores/             # Zustand state management
│   ├── lib/                # Utilities (security, a11y, perf, offline)
│   ├── hooks/
│   ├── types/
│   ├── test/               # Test setup, fixtures, helpers
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── PROJECT_STATUS.md
│   ├── PHASE1_STATUS.md
│   └── DEPLOYMENT.md
├── .github/workflows/ci.yml
├── lighthouse-budget.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `V` | Select tool |
| `T` | Text tool |
| `R` | Rectangle |
| `E` | Ellipse |
| `L` | Line |
| `A` | Arrow |
| `F` | Freehand |
| `I` | Image |
| `S` | Signature |
| `N` | Sticky Note |
| `H` | Highlight |
| `G` | Toggle Grid |
| `0` | Reset Zoom |
| `+` / `=` | Zoom In |
| `-` | Zoom Out |
| `Del` / `Backspace` | Delete selected |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+D` | Duplicate |
| `Esc` | Deselect / Close dialog |

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PWA Install | ✅ | ✅ | ✅ (16.4+) | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Camera API | ✅ | ✅ | ✅ | ✅ |
| IndexedDB | ✅ | ✅ | ✅ | ✅ |
| Web Workers | ✅ | ✅ | ✅ | ✅ |
| Canvas API | ✅ | ✅ | ✅ | ✅ |
| File System Access | ✅ | ⚠️ | ❌ | ✅ |

## Security

- Content Security Policy (CSP)
- Strict Transport Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=self, others=none
- No external data transmission
- Local-first architecture

## Performance Budgets (Lighthouse)

| Metric | Budget |
|--------|--------|
| First Contentful Paint | < 1.8s |
| Largest Contentful Paint | < 2.5s |
| Total Blocking Time | < 200ms |
| Cumulative Layout Shift | < 0.1 |
| Performance Score | > 90 |
| Accessibility Score | > 95 |
| PWA Score | > 90 |

## Contributing

1. Fork repository
2. Create feature branch
3. Run `npm run lint && npm run typecheck && npm run test:run`
4. Submit PR

## License

MIT License - Open source project. Contributions welcome!

---

**Last Updated**: 2026-10-24  
**Version**: 1.0.0  
**Status**: Phase 6 Core Complete → Phase 7 Next