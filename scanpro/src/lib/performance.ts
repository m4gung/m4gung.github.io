// Performance monitoring utilities

export interface PerformanceMetrics {
  // Page load metrics
  dnsLookup: number
  tcpConnection: number
  tlsHandshake: number
  ttfb: number
  domContentLoaded: number
  domComplete: number
  loadComplete: number
  
  // Resource metrics
  resourceCount: number
  totalResourceSize: number
  cacheHitRate: number
  
  // Interaction metrics
  firstInputDelay: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  
  // Custom metrics
  appInitTime: number
  firstRenderTime: number
}

export interface ResourceTimingEntry {
  name: string
  entryType: string
  startTime: number
  duration: number
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
  initiatorType: string
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []
  private marks: Map<string, number> = new Map()

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers(): void {
    // Navigation timing
    if ('PerformanceNavigationTiming' in window) {
      try {
        const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
        if (navEntries.length > 0) {
          const nav = navEntries[0]
          this.metrics = {
            dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
            tcpConnection: nav.connectEnd - nav.connectStart,
            tlsHandshake: nav.connectEnd - nav.secureConnectionStart,
            ttfb: nav.responseStart - nav.requestStart,
            domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
            domComplete: nav.domComplete - nav.fetchStart,
            loadComplete: nav.loadEventEnd - nav.fetchStart,
          }
        }
      } catch (e) {
        console.warn('Navigation timing not available:', e)
      }
    }

    // Resource timing
    if ('PerformanceResourceTiming' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as PerformanceResourceTiming[]
          this.processResourceEntries(entries)
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (e) {
        console.warn('Resource timing observer not available:', e)
      }
    }

    // LCP
    if ('PerformanceObserver' in window && 'LargestContentfulPaint' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.largestContentfulPaint = lastEntry.startTime
        })
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not available:', e)
      }
    }

    // CLS
    if ('PerformanceObserver' in window && 'LayoutShift' in window) {
      try {
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue
        })
        clsObserver.observe({ type: 'layout-shift', buffered: true })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not available:', e)
      }
    }

    // FID
    if ('PerformanceObserver' in window && 'FirstInputDelay' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime
          }
        })
        fidObserver.observe({ type: 'first-input', buffered: true })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not available:', e)
      }
    }
  }

  private processResourceEntries(entries: PerformanceResourceTiming[]): void {
    let totalSize = 0
    let cacheHits = 0
    let totalResources = entries.length

    for (const entry of entries) {
      totalSize += entry.transferSize || 0
      // Cache hit if transfer size is 0 but decoded body size > 0
      if (entry.transferSize === 0 && entry.decodedBodySize > 0) {
        cacheHits++
      }
    }

    this.metrics.resourceCount = totalResources
    this.metrics.totalResourceSize = totalSize
    this.metrics.cacheHitRate = totalResources > 0 ? cacheHits / totalResources : 0
  }

  mark(name: string): void {
    this.marks.set(name, performance.now())
    performance.mark(name)
  }

  measure(name: string, startMark: string, endMark?: string): number {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark)
      } else {
        performance.measure(name, startMark)
      }
      const entries = performance.getEntriesByName(name, 'measure')
      return entries[entries.length - 1]?.duration || 0
    } catch {
      const start = this.marks.get(startMark) || 0
      const end = endMark ? this.marks.get(endMark) || 0 : performance.now()
      return end - start
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics }
  }

  getResourceTimings(): ResourceTimingEntry[] {
    return performance.getEntriesByType('resource') as unknown as ResourceTimingEntry[]
  }

  getSlowResources(threshold = 1000): ResourceTimingEntry[] {
    return this.getResourceTimings().filter(r => r.duration > threshold)
  }

  getLargeResources(threshold = 100000): ResourceTimingEntry[] {
    return this.getResourceTimings().filter(r => r.transferSize > threshold)
  }

  reportToConsole(): void {
    console.group('Performance Metrics')
    console.table(this.metrics)
    console.groupEnd()
  }

  async sendToAnalytics(endpoint: string, additionalData: Record<string, any> = {}): Promise<void> {
    const data = {
      ...this.metrics,
      ...additionalData,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      })
    } catch (e) {
      console.warn('Failed to send performance data:', e)
    }
  }

  disconnect(): void {
    for (const observer of this.observers) {
      observer.disconnect()
    }
    this.observers = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Custom timing helpers
export function measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now()
  return fn().finally(() => {
    const duration = performance.now() - start
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    console.log(`${name}: ${duration.toFixed(2)}ms`)
  })
}

export function measureSync<T>(name: string, fn: () => T): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
    console.log(`${name}: ${duration.toFixed(2)}ms`)
  }
}

// Bundle size analyzer (dev only)
export function analyzeBundleSize(): void {
  if ((import.meta as any).env?.DEV) {
    const scripts = document.querySelectorAll('script[src]')
    let totalSize = 0
    
    for (const script of scripts) {
      const src = script.getAttribute('src')
      if (src && src.startsWith('/')) {
        fetch(src, { method: 'HEAD' })
          .then(res => {
            const size = parseInt(res.headers.get('content-length') || '0', 10)
            console.log(`${src}: ${(size / 1024).toFixed(2)} KB`)
          })
          .catch(() => {})
      }
    }
  }
}

// Memory usage (if available)
export function getMemoryUsage(): { used: number; total: number; limit: number } | null {
  if ('memory' in performance) {
    const mem = (performance as any).memory
    return {
      used: mem.usedJSHeapSize,
      total: mem.totalJSHeapSize,
      limit: mem.jsHeapSizeLimit,
    }
  }
  return null
}

// Long task detection
export function observeLongTasks(callback: (entry: PerformanceEntry) => void): () => void {
  if ('PerformanceObserver' in window && 'longtask' in PerformanceObserver.supportedEntryTypes) {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry)
        }
      })
      observer.observe({ type: 'longtask', buffered: true })
      return () => observer.disconnect()
    } catch {
      return () => {}
    }
  }
  return () => {}
}