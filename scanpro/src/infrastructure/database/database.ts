import Dexie, { type Entity, type EntityTable } from 'dexie'

export interface ScanProDatabaseShape {
  documents: EntityTable<ScanProDocument, string>
  folders: EntityTable<ScanProFolder, string>
  settings: EntityTable<ScanProAppSettings, string>
  versions: EntityTable<ScanProDocumentVersion, string>
}

export interface ScanProDocument {
  id: string
  name: string
  description?: string
  folderId?: string
  sourceAssetId?: string
  type: 'document'
  status: 'active' | 'archived' | 'deleted'
  pages: ScanProDocumentPage[]
  version: number
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy?: string
    lastAccessedAt?: Date
    accessCount: number
    tags?: string[]
    customMetadata?: Record<string, unknown>
  }
  processingJobs?: ScanProProcessingJob[]
  shareLink?: string
}

export interface ScanProDocumentPage {
  id: string
  documentId: string
  sourceType: 'scanned' | 'canvas' | 'pdf'
  sourceAssetId?: string
  index: number
  width: number
  height: number
  rotation: number
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  perspective?: unknown
  metadata: {
    createdAt: Date
    updatedAt: Date
    enhanced?: boolean
    ocrProcessed?: boolean
  }
}

export interface ScanProProcessingJob {
  id: string
  type: 'ocr' | 'enhancement' | 'conversion' | 'extraction'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  input: {
    assetId?: string
    pageId?: string
    parameters: Record<string, unknown>
  }
  output?: {
    resultId?: string
    metadata?: Record<string, unknown>
  }
  error?: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  cancelledAt?: Date
  retries: number
}

export interface ScanProFolder {
  id: string
  name: string
  parentId?: string
  color?: string
  icon?: string
  documentCount: number
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy?: string
  }
}

export interface ScanProAppSettings {
  id: string
  userId?: string
  language: string
  theme: 'light' | 'dark' | 'system'
  ocrLanguages: string[]
  autoSave: boolean
  autoSaveInterval: number
  maxImageSize: number
  maxPdfPages: number
  defaultPageSize: 'a4' | 'letter' | 'legal' | 'a5'
  exportFormats: string[]
  printSettings: {
    margin: 'none' | 'normal' | 'wide' | 'narrow'
    orientation: 'portrait' | 'landscape'
    scale: 'fit' | 'actual'
  }
  processing: {
    enableGpu: boolean
    maxMemoryUsage: number
    concurrentJobs: number
  }
  storage: {
    autoCleanup: boolean
    maxStorageSize: number
    backupEnabled: boolean
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
  }
}

export interface ScanProDocumentVersion {
  id: string
  documentId: string
  version: number
  checksum: string
  size: number
  pages: number
  createdAt: Date
  createdBy?: string
  changeDescription?: string
}

export interface ScanProDatabase {
  documents: ScanProDocument
  folders: ScanProFolder
  settings: ScanProAppSettings
  versions: ScanProDocumentVersion
}

export class ScanProDatabase extends Dexie implements ScanProDatabaseShape {
  public documents!: ScanProDocument
  public folders!: ScanProFolder
  public settings!: ScanProAppSettings
  public versions!: ScanProDocumentVersion

  constructor() {
    super('ScanProStudio')
    this.version(1).stores({
      documents: `
        id: string @id
        name: string
        description?: string
        folderId?: string
        sourceAssetId?: string
        type: string
        status: string
        pages: object
        version: number
        metadata: object
        processingJobs?: object
        shareLink?: string
      `,
      folders: `
        id: string @id
        name: string
        parentId?: string
        color?: string
        icon?: string
        documentCount: number
        metadata: object
      `,
      settings: `
        id: string @id
        userId?: string
        language: string
        theme: string
        ocrLanguages: string[]
        autoSave: boolean
        autoSaveInterval: number
        maxImageSize: number
        maxPdfPages: number
        defaultPageSize: string
        exportFormats: string[]
        printSettings: object
        processing: object
        storage: object
        metadata: object
      `,
      versions: `
        id: string @id
        documentId: string
        version: number
        checksum: string
        size: number
        pages: number
        createdAt: Date
        createdBy?: string
        changeDescription?: string
      `,
    })
  }
}

export const db = new ScanProDatabase()
