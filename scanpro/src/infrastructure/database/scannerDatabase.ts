import Dexie, { type EntityTable } from 'dexie'

export interface ScanSessionRecord {
  id: string
  name: string
  pages: ScanPageRecord[]
  createdAt: Date
  updatedAt: Date
  status: 'active' | 'completed' | 'cancelled'
}

export interface ScanPageRecord {
  id: string
  sessionId: string
  originalBlob: Blob
  processedBlob?: Blob
  previewUrl?: string
  index: number
  rotation: number
  crop?: { x: number; y: number; width: number; height: number }
  perspective?: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
    bottomRight: { x: number; y: number }
  }
  enhancement?: {
    contrast?: number
    brightness?: number
    sharpen?: boolean
    grayscale?: boolean
  }
  status: 'captured' | 'processing' | 'processed' | 'error'
  createdAt: Date
  updatedAt: Date
}

export class ScanProScannerDB extends Dexie {
  public sessions!: EntityTable<ScanSessionRecord, string>
  public pages!: EntityTable<ScanPageRecord, string>

  constructor() {
    super('ScanProScanner')
    this.version(1).stores({
      sessions: `
        id: string @id
        name: string
        pages: object
        createdAt: Date
        updatedAt: Date
        status: string
      `,
      pages: `
        id: string @id
        sessionId: string
        originalBlob: object
        processedBlob?: object
        previewUrl?: string
        index: number
        rotation: number
        crop?: object
        perspective?: object
        enhancement?: object
        status: string
        createdAt: Date
        updatedAt: Date
      `,
    })
  }
}

export const scannerDB = new ScanProScannerDB()

export class ScannerSessionRepository {
  async saveSession(session: ScanSessionRecord): Promise<void> {
    await scannerDB.sessions.put(session)
    if (session.pages) {
      await scannerDB.pages.bulkPut(session.pages)
    }
  }

  async getSession(id: string): Promise<ScanSessionRecord | undefined> {
    const session = await scannerDB.sessions.get(id)
    if (session) {
      session.pages = await scannerDB.pages.where('sessionId').equals(id).toArray()
    }
    return session
  }

  async getAllSessions(): Promise<ScanSessionRecord[]> {
    const sessions = await scannerDB.sessions.toArray()
    for (const session of sessions) {
      session.pages = await scannerDB.pages.where('sessionId').equals(session.id).toArray()
    }
    return sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async deleteSession(id: string): Promise<void> {
    await scannerDB.pages.where('sessionId').equals(id).delete()
    await scannerDB.sessions.delete(id)
  }

  async updatePage(page: ScanPageRecord): Promise<void> {
    await scannerDB.pages.put(page)
    const session = await this.getSession(page.sessionId)
    if (session) {
      session.updatedAt = new Date()
      await scannerDB.sessions.put(session)
    }
  }
}

export const scannerSessionRepository = new ScannerSessionRepository()