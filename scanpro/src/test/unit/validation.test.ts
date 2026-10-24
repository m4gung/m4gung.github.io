import { describe, it, expect } from 'vitest'
import {
  validateDocument,
  validateDocumentPage,
  validateSourceAsset,
  validateAppSettings,
  isValidImageType,
  isValidPdfType,
  MAX_IMAGE_SIZE,
  MAX_PDF_PAGES,
  validateFileSize,
} from '../domain/validation'

describe('Document Validation', () => {
  describe('validateDocument', () => {
    it('should validate a valid document', () => {
      const now = new Date()
      const doc = {
        id: 'doc_123',
        name: 'Test Doc',
        status: 'active' as const,
        pages: [],
        version: 1,
        metadata: {
          createdAt: now,
          updatedAt: now,
          accessCount: 0,
        },
      }
      expect(() => validateDocument(doc)).not.toThrow()
    })

    it('should reject invalid document', () => {
      expect(() => validateDocument(null)).toThrow()
      expect(() => validateDocument({})).toThrow()
    })
  })

  describe('validateDocumentPage', () => {
    it('should validate a valid document page', () => {
      const now = new Date()
      const page = {
        id: 'page_123',
        documentId: 'doc_123',
        sourceType: 'scanned' as const,
        index: 0,
        width: 100,
        height: 100,
        rotation: 0,
        metadata: {
          createdAt: now,
          updatedAt: now,
        },
      }
      expect(() => validateDocumentPage(page)).not.toThrow()
    })

    it('should reject invalid document page', () => {
      expect(() => validateDocumentPage({})).toThrow()
    })
  })

  describe('validateSourceAsset', () => {
    it('should validate a valid source asset', () => {
      const now = new Date()
      const asset = {
        id: 'asset_123',
        name: 'scan.jpg',
        type: 'image' as const,
        mimeType: 'image/jpeg',
        size: 1024,
        storagePath: 'assets/scan.jpg',
        checksum: 'abc123',
        createdAt: now,
        updatedAt: now,
      }
      expect(() => validateSourceAsset(asset)).not.toThrow()
    })
  })

  describe('validateAppSettings', () => {
    it('should validate default app settings', () => {
      const settings = {
        id: 'settings_123',
        language: 'id',
        theme: 'light' as const,
        ocrLanguages: ['id', 'en'],
        autoSave: true,
        autoSaveInterval: 30000,
        maxImageSize: MAX_IMAGE_SIZE,
        maxPdfPages: MAX_PDF_PAGES,
        defaultPageSize: 'a4' as const,
        exportFormats: ['pdf'],
        printSettings: {
          margin: 'normal' as const,
          orientation: 'portrait' as const,
          scale: 'fit' as const,
        },
        processing: {
          enableGpu: false,
          maxMemoryUsage: 1024,
          concurrentJobs: 1,
        },
        storage: {
          autoCleanup: true,
          maxStorageSize: 1024 * 1024 * 1024,
          backupEnabled: true,
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }
      expect(() => validateAppSettings(settings)).not.toThrow()
    })
  })

  describe('isValidImageType', () => {
    it('should accept valid image types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      expect(isValidImageType(file)).toBe(true)
    })

    it('should reject invalid image types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' })
      expect(isValidImageType(file)).toBe(false)
    })
  })

  describe('isValidPdfType', () => {
    it('should accept valid pdf types', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' })
      expect(isValidPdfType(file)).toBe(true)
    })

    it('should reject invalid pdf types', () => {
      const file = new File([''], 'test.pdf', { type: 'text/plain' })
      expect(isValidPdfType(file)).toBe(false)
    })
  })

  describe('validateFileSize', () => {
    it('should accept files within size limit', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      expect(() => validateFileSize(file, MAX_IMAGE_SIZE)).not.toThrow()
    })

    it('should reject files exceeding size limit', () => {
      const file = new File(['a'.repeat(1024 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
      expect(() => validateFileSize(file, MAX_IMAGE_SIZE)).toThrow()
    })
  })
})
