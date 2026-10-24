// Offline handling and PWA utilities

export interface NetworkStatus {
  online: boolean
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

export interface CacheStatus {
  cached: boolean
  lastUpdated: number
  size: number
}

export interface PWAUpdateInfo {
  available: boolean
  version: string
  registration: ServiceWorkerRegistration | null
}

export class OfflineManager {
  private onlineListeners: Set<(online: boolean) => void> = new Set()
  private networkStatus: NetworkStatus = {
    online: navigator.onLine,
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  }
  private updateCallbacks: Set<(info: PWAUpdateInfo) => void> = new Set()
  private swRegistration: ServiceWorkerRegistration | null = null

  constructor() {
    this.initializeNetworkListeners()
    this.initializeServiceWorker()
  }

  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.networkStatus.online = true
      this.notifyOnlineStatus(true)
    })

    window.addEventListener('offline', () => {
      this.networkStatus.online = false
      this.notifyOnlineStatus(false)
    })

    // Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      this.updateNetworkStatus(connection)
      connection.addEventListener('change', () => this.updateNetworkStatus(connection))
    }
  }

  private updateNetworkStatus(connection: any): void {
    this.networkStatus = {
      online: navigator.onLine,
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false,
    }
  }

  private notifyOnlineStatus(online: boolean): void {
    for (const callback of this.onlineListeners) {
      try {
        callback(online)
      } catch (e) {
        console.warn('Online listener error:', e)
      }
    }
  }

  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready
        
        // Check for updates
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })

        // Check for updates periodically
        setInterval(() => {
          this.swRegistration?.update()
        }, 60000)

        this.swRegistration.addEventListener('updatefound', () => {
          const newWorker = this.swRegistration?.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.notifyUpdateAvailable()
              }
            })
          }
        })
      } catch (e) {
        console.warn('Service Worker initialization failed:', e)
      }
    }
  }

  private notifyUpdateAvailable(): void {
    const info: PWAUpdateInfo = {
      available: true,
      version: 'new',
      registration: this.swRegistration,
    }
    for (const callback of this.updateCallbacks) {
      try {
        callback(info)
      } catch (e) {
        console.warn('Update callback error:', e)
      }
    }
  }

  // Network status
  getNetworkStatus(): NetworkStatus {
    return { ...this.networkStatus }
  }

  isOnline(): boolean {
    return this.networkStatus.online
  }

  isSlowConnection(): boolean {
    return this.networkStatus.effectiveType === 'slow-2g' || 
           this.networkStatus.effectiveType === '2g' ||
           this.networkStatus.saveData
  }

  // Event listeners
  onOnlineChange(callback: (online: boolean) => void): () => void {
    this.onlineListeners.add(callback)
    return () => this.onlineListeners.delete(callback)
  }

  onUpdateAvailable(callback: (info: PWAUpdateInfo) => void): () => void {
    this.updateCallbacks.add(callback)
    return () => this.updateCallbacks.delete(callback)
  }

  // Cache management
  async getCacheStatus(cacheName: string): Promise<CacheStatus> {
    try {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      let totalSize = 0
      
      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
      
      return {
        cached: keys.length > 0,
        lastUpdated: Date.now(),
        size: totalSize,
      }
    } catch {
      return { cached: false, lastUpdated: 0, size: 0 }
    }
  }

  async clearCache(cacheName: string): Promise<void> {
    await caches.delete(cacheName)
  }

  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
  }

  // PWA Update
  async applyUpdate(): Promise<void> {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }

  async skipWaiting(): Promise<void> {
    if (this.swRegistration?.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }

  // Background sync
  async registerBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker.registration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register(tag)
    }
  }

  // Periodic background sync (if supported)
  async registerPeriodicSync(tag: string, minInterval: number): Promise<void> {
    if ('serviceWorker' in navigator && 'periodicSync' in navigator.serviceWorker.registration.prototype) {
      const registration = await navigator.serviceWorker.ready
      try {
        await (registration as any).periodicSync.register(tag, { minInterval })
      } catch (e) {
        console.warn('Periodic sync not supported:', e)
      }
    }
  }
}

export const offlineManager = new OfflineManager()

// IndexedDB offline queue for failed requests
export interface QueuedRequest {
  id: string
  url: string
  method: string
  headers: Record<string, string>
  body: string | null
  timestamp: number
  retries: number
}

export class OfflineRequestQueue {
  private dbName = 'ScanProOfflineQueue'
  private storeName = 'requests'
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      }
    })
  }

  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    if (!this.db) await this.init()
    
    const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    const queuedRequest: QueuedRequest = {
      ...request,
      id,
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(queuedRequest)
      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }

  async dequeue(): Promise<QueuedRequest | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      
      request.onsuccess = () => {
        const requests = request.result as QueuedRequest[]
        if (requests.length === 0) {
          resolve(null)
          return
        }
        
        // Get oldest request
        const oldest = requests.sort((a, b) => a.timestamp - b.timestamp)[0]
        resolve(oldest)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async remove(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async retry(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const getRequest = store.get(id)
      
      getRequest.onsuccess = () => {
        const request = getRequest.result as QueuedRequest
        if (request) {
          request.retries++
          const putRequest = store.put(request)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getAll(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result as QueuedRequest[])
      request.onerror = () => reject(request.error)
    })
  }

  async processQueue(processor: (request: QueuedRequest) => Promise<boolean>): Promise<number> {
    let processed = 0
    
    while (true) {
      const request = await this.dequeue()
      if (!request) break
      
      try {
        const success = await processor(request)
        if (success) {
          await this.remove(request.id)
          processed++
        } else {
          await this.retry(request.id)
          break // Stop processing on failure
        }
      } catch {
        await this.retry(request.id)
        break
      }
    }
    
    return processed
  }
}

export const offlineRequestQueue = new OfflineRequestQueue()

// Storage quota management
export async function getStorageQuota(): Promise<{ usage: number; quota: number } | null> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    } catch {
      return null
    }
  }
  return null
}

export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    try {
      return await navigator.storage.persist()
    } catch {
      return false
    }
  }
  return false
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}