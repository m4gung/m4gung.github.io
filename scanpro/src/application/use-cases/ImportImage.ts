import { documentRepository } from '../../infrastructure/database/documentRepository'
import { storageAdapter } from '../../infrastructure/storage/storageAdapter'
import {
  isValidImageType,
  isValidPdfType,
  validateFileSize,
  MAX_IMAGE_SIZE,
} from '../../domain/validation'
import type { SourceAsset, Document, DocumentPage } from '../../domain/documents'

export interface ImportImageResult {
  success: boolean
  document?: Document
  asset?: SourceAsset
  error?: string
}

export class ImportImageUseCase {
  async execute(
    file: File,
    documentName?: string
  ): Promise<ImportImageResult> {
    try {
      if (!isValidImageType(file)) {
        return { success: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, GIF, WebP, atau BMP.' }
      }

      validateFileSize(file, MAX_IMAGE_SIZE)

      const asset: SourceAsset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        name: file.name,
        type: 'image',
        mimeType: file.type,
        size: file.size,
        storagePath: `assets/${file.name}`,
        checksum: this.generateChecksum(file),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await storageAdapter.saveAsset(asset)

      const now = new Date()
      const page: DocumentPage = {
        id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        documentId: '',
        sourceType: 'scanned',
        sourceAssetId: asset.id,
        index: 0,
        width: 0,
        height: 0,
        rotation: 0,
        metadata: {
          createdAt: now,
          updatedAt: now,
        },
      }

      const document = await documentRepository.createDocument({
        name: documentName || this.generateDocumentName(file.name),
        sourceAssetId: asset.id,
        type: 'document',
        status: 'active',
        pages: [page],
        version: 1,
        metadata: {
          createdAt: now,
          updatedAt: now,
          accessCount: 0,
        },
      })

      return { success: true, document, asset }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengimpor gambar'
      return { success: false, error: message }
    }
  }

  private generateDocumentName(fileName: string): string {
    const baseName = fileName.replace(/\.[^.]+$/, '')
    return baseName ? `${baseName} Dokumen` : 'Dokumen Baru'
  }

  private generateChecksum(file: File): string {
    // Simple checksum placeholder - real implementation should use crypto.subtle
    let hash = 0
    const str = file.name + file.size + file.type
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i)
      hash = (hash << 5) - hash + charCode
      hash = hash & hash
    }
    return `checksum_${hash.toString(36)}`
  }
}
