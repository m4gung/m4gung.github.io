import { z } from 'zod'
import type {
  Document,
  DocumentPage,
  SourceAsset,
  Folder,
  AppSettings,
  DocumentVersion,
} from '../domain/documents'

export const sourceAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['image', 'pdf', 'scan']),
  mimeType: z.string(),
  size: z.number().int().nonnegative(),
  storagePath: z.string(),
  blobUrl: z.string().optional(),
  checksum: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const documentPageSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  sourceType: z.enum(['scanned', 'canvas', 'pdf']),
  sourceAssetId: z.string().optional(),
  index: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  rotation: z.number().int(),
  crop: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
  }).optional(),
  perspective: z.object({
    topLeft: z.object({ x: z.number(), y: z.number() }),
    topRight: z.object({ x: z.number(), y: z.number() }),
    bottomLeft: z.object({ x: z.number(), y: z.number() }),
    bottomRight: z.object({ x: z.number(), y: z.number() }),
  }).optional(),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    enhanced: z.boolean().optional(),
    ocrProcessed: z.boolean().optional(),
  }),
})

export const documentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  folderId: z.string().optional(),
  sourceAssetId: z.string().optional(),
  type: z.literal('document'),
  status: z.enum(['active', 'archived', 'deleted']),
  pages: z.array(documentPageSchema),
  version: z.number().int().nonnegative(),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().optional(),
    lastAccessedAt: z.date().optional(),
    accessCount: z.number().int().nonnegative(),
    tags: z.array(z.string()).optional(),
    customMetadata: z.record(z.unknown()).optional(),
  }),
})

export const folderSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  documentCount: z.number().int().nonnegative(),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string().optional(),
  }),
})

export const appSettingsSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  language: z.string(),
  theme: z.enum(['light', 'dark', 'system']),
  ocrLanguages: z.array(z.string()),
  autoSave: z.boolean(),
  autoSaveInterval: z.number().int().positive(),
  maxImageSize: z.number().int().positive(),
  maxPdfPages: z.number().int().positive(),
  defaultPageSize: z.enum(['a4', 'letter', 'legal', 'a5']),
  exportFormats: z.array(z.string()),
  printSettings: z.object({
    margin: z.enum(['none', 'normal', 'wide', 'narrow']),
    orientation: z.enum(['portrait', 'landscape']),
    scale: z.enum(['fit', 'actual']),
  }),
  processing: z.object({
    enableGpu: z.boolean(),
    maxMemoryUsage: z.number().int().positive(),
    concurrentJobs: z.number().int().positive(),
  }),
  storage: z.object({
    autoCleanup: z.boolean(),
    maxStorageSize: z.number().int().positive(),
    backupEnabled: z.boolean(),
  }),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
})

export function validateDocument(data: unknown): Document {
  return documentSchema.parse(data)
}

export function validateFolder(data: unknown): Folder {
  return folderSchema.parse(data)
}

export function validateAppSettings(data: unknown): AppSettings {
  return appSettingsSchema.parse(data)
}

export function validateDocumentPage(data: unknown): DocumentPage {
  return documentPageSchema.parse(data)
}

export function validateSourceAsset(data: unknown): SourceAsset {
  return sourceAssetSchema.parse(data)
}

export const SUPPORTED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
]

export const SUPPORTED_PDF_MIME_TYPE = 'application/pdf'

export function isValidImageType(file: File): boolean {
  return SUPPORTED_IMAGE_MIME_TYPES.includes(file.type)
}

export function isValidPdfType(file: File): boolean {
  return file.type === SUPPORTED_PDF_MIME_TYPE
}

export const MAX_IMAGE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_PDF_PAGES = 500

export function validateFileSize(file: File, maxSize: number = MAX_IMAGE_SIZE): void {
  if (file.size > maxSize) {
    throw new Error(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`)
  }
}
