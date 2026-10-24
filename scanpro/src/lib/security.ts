// Security utilities and CSP configuration

export interface SecurityConfig {
  csp: string
  hsts: boolean
  frameOptions: 'DENY' | 'SAMEORIGIN'
  contentTypeOptions: boolean
  referrerPolicy: string
  permissionsPolicy: string
}

export const securityConfig: SecurityConfig = {
  csp: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob:",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; '),
  hsts: true,
  frameOptions: 'DENY',
  contentTypeOptions: true,
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: [
    'camera=self',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
  ].join(', '),
}

export function generateCSPHeader(config: SecurityConfig = securityConfig): string {
  return config.csp
}

export function generateSecurityHeaders(config: SecurityConfig = securityConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Security-Policy': config.csp,
    'X-Frame-Options': config.frameOptions,
    'X-Content-Type-Options': config.contentTypeOptions ? 'nosniff' : '',
    'Referrer-Policy': config.referrerPolicy,
    'Permissions-Policy': config.permissionsPolicy,
  }

  if (config.hsts) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
  }

  return headers
}

// Input sanitization
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.textContent = html
  return div.innerHTML
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255)
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

// Secure storage helpers
export function secureSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(`secure_${key}`, btoa(value))
  } catch {
    // Storage full or unavailable
  }
}

export function secureGetItem(key: string): string | null {
  try {
    const value = localStorage.getItem(`secure_${key}`)
    return value ? atob(value) : null
  } catch {
    return null
  }
}

export function secureRemoveItem(key: string): void {
  localStorage.removeItem(`secure_${key}`)
}

// Rate limiting for API calls
export class RateLimiter {
  private calls: Map<string, number[]> = new Map()
  private maxCalls: number
  private windowMs: number

  constructor(maxCalls = 100, windowMs = 60000) {
    this.maxCalls = maxCalls
    this.windowMs = windowMs
  }

  check(key: string): boolean {
    const now = Date.now()
    const calls = this.calls.get(key) || []
    const recentCalls = calls.filter(time => now - time < this.windowMs)
    
    if (recentCalls.length >= this.maxCalls) {
      return false
    }

    recentCalls.push(now)
    this.calls.set(key, recentCalls)
    return true
  }

  reset(key: string): void {
    this.calls.delete(key)
  }
}

export const apiRateLimiter = new RateLimiter(100, 60000)
export const uploadRateLimiter = new RateLimiter(10, 60000)