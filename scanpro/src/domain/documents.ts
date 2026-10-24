// Domain models for document processing

export interface SourceAsset {
  id: string
  name: string
  type: 'image' | 'pdf' | 'scan'
  mimeType: string
  size: number
  storagePath: string
  blobUrl?: string
  checksum: string
  createdAt: Date
  updatedAt: Date
}

export interface DocumentPage {
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
  perspective?: {
    topLeft: { x: number; y: number }
    topRight: { x: number; y: number }
    bottomLeft: { x: number; y: number }
    bottomRight: { x: number; y: number }
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    enhanced?: boolean
    ocrProcessed?: boolean
  }
}

export interface CanvasElement {
  id: string
  pageId: string
  type: 'text' | 'image' | 'signature' | 'shape' | 'highlight' | 'annotation'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  zIndex: number
  content: {
    text?: string
    src?: string
    color?: string
    fontSize?: number
    fontFamily?: string
    points?: { x: number; y: number }[]
    radius?: number
    highlightColor?: string
  }
  style: {
    opacity: number
    visible: boolean
    locked: boolean
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    userId?: string
  }
}

export interface CanvasDocumentState {
  id: string
  pageId: string
  elements: CanvasElement[]
  selections: string[]
  activeTool: string
  zoom: number
  pan: { x: number; y: number }
  metadata: {
    createdAt: Date
    updatedAt: Date
  }
}

export interface OcrPageResult {
  id: string
  pageId: string
  text: string
  confidence: number
  language: string
  blocks: {
    text: string
    confidence: number
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
      text: string
    }[]
  }[]
  processingTime: number
  metadata: {
    createdAt: Date
    engine: string
    languageDataVersion: string
  }
}

export interface PdfPageMetadata {
  id: string
  documentId: string
  pageIndex: number
  width: number
  height: number
  rotation: number
  mediaBox: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
  cropBox?: {
    x0: number
    y0: number
    x1: number
    y1: number
  }
  resources?: {
    fonts?: Record<string, unknown>
    xObjects?: Record<string, unknown>
  } | null
  content?: string | null
  xref?: number
  indirectRef?: string
  stream?: {
    dict?: {
      subtype?: string
      length?: number
    }
    data?: Uint8Array
    encoded?: boolean
  } | null
}

export interface ProcessingJob {
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

export interface Document {
  id: string
  name: string
  description?: string
  folderId?: string
  sourceAssetId?: string
  type: 'document'
  status: 'active' | 'archived' | 'deleted'
  pages: DocumentPage[]
  ocrResults?: OcrPageResult[]
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
  processingJobs?: ProcessingJob[]
  shareLink?: string
}

export interface Folder {
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
  children?: Folder[]
}

export interface DocumentVersion {
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

export interface AppSettings {
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

export interface CreateDocumentCommand {
  name: string
  sourceAssetId?: string
  folderId?: string
  templateId?: string
}

export interface UpdateDocumentCommand {
  id: string
  name?: string
  description?: string
  folderId?: string
  status?: 'active' | 'archived' | 'deleted'
}

export interface ImportImageCommand {
  assetId: string
  documentId?: string
}

export interface ImportPdfCommand {
  assetId: string
  documentId?: string
}

export interface RunOcrCommand {
  documentId: string
  pageIds?: string[]
  languages?: string[]
}

export interface ExportPdfCommand {
  documentId: string
  pageIds?: string[]
  format?: 'pdf' | 'print-ready'
  options?: Record<string, unknown>
}

export interface PrintDocumentCommand {
  documentId: string
  pageIds?: string[]
  printerId?: string
  options?: Record<string, unknown>
}

export interface BackupDocumentsCommand {
  documentIds?: string[]
  exportPath?: string
}

export interface RestoreDocumentCommand {
  backupId: string
}

export interface DeleteDocumentCommand {
  id: string
  permanent?: boolean
}

export interface FolderCommand {
  name: string
  parentId?: string
  color?: string
  icon?: string
}

export interface UpdateFolderCommand {
  id: string
  name?: string
  parentId?: string
  color?: string
  icon?: string
}

export interface DocumentSearchFilter {
  folderId?: string
  name?: string
  type?: string
  status?: string
  tags?: string[]
  createdAfter?: Date
  createdBefore?: Date
  updatedAfter?: Date
  updatedBefore?: Date
  hasOcr?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'accessedAt' | 'size'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface DocumentSearchResult {
  documents: Document[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
