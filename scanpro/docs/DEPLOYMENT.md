# ScanPro Studio - Deployment Guide

## Overview

ScanPro Studio is a local-first PWA for document scanning, PDF editing, canvas editing, OCR, and printing. This guide covers deployment to various platforms.

## Prerequisites

- Node.js 18+
- npm 9+
- Git
- HTTPS-enabled hosting (required for PWA features)

## Build Process

### Development
```bash
npm install
npm run dev
```
Starts Vite dev server at http://localhost:5173

### Production Build
```bash
npm run build
```
Outputs to `dist/` directory with:
- Optimized JS/CSS bundles (code-split)
- PWA manifest (`manifest.webmanifest`)
- Service worker (`sw.js`, `workbox-*.js`)
- Offline fallback (`offline.html`)
- Icons and assets

### Preview Production Build
```bash
npm run preview
```
Serves `dist/` locally for testing

## Deployment Targets

### 1. Static Hosting (Recommended)

#### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**netlify.toml** (optional, place in project root):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=self, microphone=(), geolocation=(), payment=(), usb=()"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache"
    Service-Worker-Allowed = "/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**vercel.json** (optional):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" }
      ]
    },
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
}
```

#### GitHub Pages
```bash
# Build with base path
npm run build

# Deploy using gh-pages
npm install -g gh-pages
gh-pages -d dist
```

Configure `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/your-repo-name/',  // Required for GitHub Pages
  // ...
})
```

#### Cloudflare Pages
1. Connect repository in Cloudflare Pages dashboard
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Add environment variables if needed

### 2. Docker Deployment

**Dockerfile**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf**:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "DENY";
    add_header X-Content-Type-Options "nosniff";
    add_header Referrer-Policy "strict-origin-when-cross-origin";

    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        add_header Service-Worker-Allowed "/";
    }

    # PWA manifest
    location /manifest.webmanifest {
        add_header Content-Type "application/manifest+json";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for HTML
    location ~* \.html$ {
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Build and run:
```bash
docker build -t scanpro-studio .
docker run -p 8080:80 scanpro-studio
```

### 3. Traditional Web Server (Apache/Nginx)

Upload `dist/` contents to your web server document root. Ensure:
- HTTPS enabled (required for PWA)
- SPA fallback configured (all routes → index.html)
- Service worker served with correct headers
- Compression enabled (gzip/brotli)

## Environment Variables

Create `.env.production` (optional):
```env
VITE_APP_VERSION=1.0.0
VITE_API_BASE_URL=https://api.example.com
VITE_ANALYTICS_ID=GA-XXXXXXXXX
```

## PWA Requirements Checklist

- [ ] HTTPS enabled (required for Service Worker)
- [ ] `manifest.webmanifest` accessible
- [ ] `sw.js` registered with correct scope
- [ ] Icons (192x192, 512x512) present
- [ ] `offline.html` fallback exists
- [ ] HTTPS redirects from HTTP
- [ ] HSTS header configured
- [ ] CSP header configured
- [ ] Service Worker updates work

## Verification

### Lighthouse PWA Audit
```bash
npx lighthouse https://your-domain.com --view
```
Target scores:
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90
- PWA: >90

### Manual PWA Tests
1. Open in Chrome DevTools → Application → Service Workers
2. Verify: "Offline" checkbox works
3. Verify: "Update on reload" works
4. Test "Add to Home Screen" prompt
5. Test offline functionality

## Monitoring & Analytics

### Error Tracking (Sentry example)
```typescript
// src/main.tsx
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'YOUR_DSN',
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})
```

### Performance Monitoring
```typescript
// Already built-in via performanceMonitor
performanceMonitor.reportToConsole()
performanceMonitor.sendToAnalytics('/api/analytics')
```

## CI/CD Pipeline

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run lint
        run: npm run lint
      
      - name: Run typecheck
        run: npm run typecheck
      
      - name: Run tests
        run: npm run test:run
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v3
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: "Deploy from GitHub Actions"
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Troubleshooting

### Service Worker Not Registering
- Check HTTPS (required)
- Check CSP allows `script-src 'self'`
- Check `sw.js` returns 200 with correct MIME type

### PWA Not Installable
- Run Lighthouse PWA audit
- Check manifest.json validity
- Ensure icons exist at specified paths
- Verify HTTPS

### Offline Not Working
- Check Service Worker cache status in DevTools
- Verify `offline.html` is cached
- Check network tab for failed requests

### Build Issues
```bash
# Clear cache
rm -rf node_modules dist .vite
npm install
npm run build
```

## Performance Optimization

### Bundle Analysis
```bash
npm run build
npx vite-bundle-analyzer dist
```

### Preload Critical Assets
Add to `index.html`:
```html
<link rel="preload" as="script" href="/assets/main-[hash].js">
<link rel="preload" as="style" href="/assets/main-[hash].css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

## Security Checklist

- [ ] HTTPS enforced
- [ ] CSP header configured
- [ ] HSTS enabled
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] Referrer-Policy set
- [ ] Permissions-Policy configured
- [ ] No sensitive data in client code
- [ ] Dependencies scanned for vulnerabilities
- [ ] Content Security Policy tested

## Maintenance

### Updates
```bash
# Update dependencies
npm update
npm audit fix

# Major updates
npm install package@latest
```

### Cache Invalidation
Service Worker handles cache updates automatically. Force refresh:
```javascript
// In console
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(r => r.update())
)
```

## Support

For deployment issues:
1. Check browser console for errors
2. Run Lighthouse audit
3. Check Service Worker status in DevTools
3. Verify network requests in DevTools
4. Check server logs

---

**Last Updated**: 2026-10-24
**Version**: 1.0.0