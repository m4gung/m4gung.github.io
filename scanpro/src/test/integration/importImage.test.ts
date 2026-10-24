import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImportImageUseCase } from '../../application/use-cases/ImportImage'
import { documentRepository } from '../../infrastructure/database/documentRepository'
import { storageAdapter } from '../../infrastructure/storage/storageAdapter'

vi.mock('../../infrastructure/database/documentRepository')
vi.mock('../../infrastructure/storage/storageAdapter')

describe('ImportImageUseCase Integration', () => {
  let useCase: ImportImageUseCase

  beforeEach(() => {
    useCase = new ImportImageUseCase()
    vi.clearAllMocks()
  })

  it('should import valid image file', async () => {
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
    
    const mockAsset = {
      id: 'asset_123',
      name: 'test.jpg',
      type: 'image',
      mimeType: 'image/jpeg',
      size: 1024,
      storagePath: 'assets/test.jpg',
      checksum: 'abc123',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockDocument = {
      id: 'doc_123',
      name: 'test Dokumen',
      sourceAssetId: 'asset_123',
      type: 'document',
      status: 'active',
      pages: [{
        id: 'page_123',
        documentId: 'doc_123',
        sourceType: 'scanned' as const,
        sourceAssetId: 'asset_123',
        index: 0,
        width: 0,
        height: 0,
        rotation: 0,
        metadata: { createdAt: new Date(), updatedAt: new Date() },
      }],
      version: 1,
      metadata: { createdAt: new Date(), updatedAt: new Date(), accessCount: 0 },
    }

    vi.mocked(storageAdapter.saveAsset).mockResolvedValue(undefined)
    vi.mocked(documentRepository.createDocument).mockResolvedValue(mockDocument as any)

    const result = await useCase.execute(file)

    expect(result.success).toBe(true)
    expect(result.document).toBeDefined()
    expect(result.asset).toBeDefined()
  })

  it('should reject invalid file type', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })

    const result = await useCase.execute(file)

    expect(result.success).toBe(false)
    expect(result.error).toContain('tidak didukung')
  })

  it('should reject oversized file', async () => {
    const largeContent = 'a'.repeat(100 * 1024 * 1024)
    const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })

    const result = await useCase.execute(file)

    expect(result.success).toBe(false)
    expect(result.error).toContain('melebihi')
  })
})