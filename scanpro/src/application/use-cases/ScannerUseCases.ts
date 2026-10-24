import { imageProcessingAdapter } from '../../../infrastructure/image-processing/imageProcessingAdapter'
import { storageAdapter } from '../../../infrastructure/storage/storageAdapter'
import { documentRepository } from '../../../infrastructure/database/documentRepository'
import type { SourceAsset, DocumentPage } from '../../../domain/documents'
import type { ScanProDocument } from '../../../infrastructure/database/database'

export interface ScanSession {
  id: string
  name: string
  pages: ScanPage[]
  createdAt: Date
  updatedAt: Date
}

export interface ScanPage {
  id: string
  sessionId: string
  originalBlob: Blob
  processedBlob?: Blob
  previewUrl: string
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
}

export interface StartScanSessionResult {
  success: boolean
  session?: ScanSession
  error?: string
}

export class StartScanSessionUseCase {
  async execute(name: string): Promise<StartScanSessionResult> {
    try {
      const session: ScanSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        name,
        pages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      return { success: true, session }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memulai sesi scan'
      return { success: false, error: message }
    }
  }
}

export interface CaptureScanPageResult {
  success: boolean
  page?: ScanPage
  error?: string
}

export class CaptureScanPageUseCase {
  async execute(
    session: ScanSession,
    blob: Blob
  ): Promise<CaptureScanPageResult> {
    try {
      const previewUrl = imageProcessingAdapter.createPreviewUrl(blob)

      const page: ScanPage = {
        id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        sessionId: session.id,
        originalBlob: blob,
        previewUrl,
        index: session.pages.length,
        rotation: 0,
        status: 'captured',
      }

      return { success: true, page }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menangkap scan'
      return { success: false, error: message }
    }
  }
}

export interface ProcessScanPageResult {
  success: boolean
  processedBlob?: Blob
  previewUrl?: string
  width?: number
  height?: number
  error?: string
}

export class ProcessScanPageUseCase {
  async execute(
    page: ScanPage,
    options: {
      crop?: { x: number; y: number; width: number; height: number }
      rotation?: number
      perspective?: ScanPage['perspective']
      enhancement?: ScanPage['enhancement']
    }
  ): Promise<ProcessScanPageResult> {
    try {
      const result = await imageProcessingAdapter.processImage(page.originalBlob, {
        crop: options.crop,
        rotation: options.rotation,
        perspective: options.perspective,
        enhance: options.enhancement,
      })

      imageProcessingAdapter.revokePreviewUrl(page.previewUrl)
      const newPreviewUrl = imageProcessingAdapter.createPreviewUrl(result.blob)

      return {
        success: true,
        processedBlob: result.blob,
        previewUrl: newPreviewUrl,
        width: result.width,
        height: result.height,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memproses scan'
      return { success: false, error: message }
    }
  }
}

export interface SaveScanSessionResult {
  success: boolean
  document?: ScanProDocument
  error?: string
}

export class SaveScanSessionUseCase {
  async execute(
    session: ScanSession
  ): Promise<SaveScanSessionResult> {
    try {
      const now = new Date()
      const pages: DocumentPage[] = session.pages.map((p, i) => ({
        id: p.id,
        documentId: '',
        sourceType: 'scanned' as const,
        sourceAssetId: p.id,
        index: i,
        width: p.processedBlob
          ? (await this.getImageDimensions(p.processedBlob)).width
          : 0,
        height: p.processedBlob
          ? (await this.getImageDimensions(p.processedBlob)).height
          : 0,
        rotation: p.rotation,
        crop: p.crop,
        perspective: p.perspective as any,
        metadata: {
          createdAt: p.status === 'processed' ? now : session.createdAt,
          updatedAt: now,
          enhanced: p.status === 'processed',
        },
      }))

      const asset: SourceAsset = {
        id: `asset_${session.id}`,
        name: `${session.name}.jpg`,
        type: 'scan',
        mimeType: 'image/jpeg',
        size: session.pages.reduce((sum, p) => sum + p.originalBlob.size, 0),
        storagePath: `scans/${session.id}`,
        checksum: `scan_${session.id}`,
        createdAt: session.createdAt,
        updatedAt: now,
      }

      await storageAdapter.saveAsset(asset)

      const document = await documentRepository.createDocument({
        name: session.name,
        sourceAssetId: asset.id,
        type: 'document',
        status: 'active',
        pages,
        version: 1,
        metadata: {
          createdAt: session.createdAt,
          updatedAt: now,
          accessCount: 0,
        },
      })

      return { success: true, document }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan sesi scan'
      return { success: false, error: message }
    }
  }

  private getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }
      img.src = URL.createObjectURL(blob)
    })
  }
}

export interface CancelScanSessionResult {
  success: boolean
}

export class CancelScanSessionUseCase {
  async execute(session: ScanSession): Promise<CancelScanSessionResult> {
    session.pages.forEach((p) => {
      imageProcessingAdapter.revokePreviewUrl(p.previewUrl)
      if (p.processedBlob) {
        imageProcessingAdapter.revokePreviewUrl(
          imageProcessingAdapter.createPreviewUrl(p.processedBlob)
        )
      }
    })
    return { success: true }
  }
}