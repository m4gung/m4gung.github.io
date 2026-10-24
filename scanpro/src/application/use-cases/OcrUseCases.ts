import { ocrAdapter } from '../../../infrastructure/ocr/ocrAdapter'
import { documentRepository } from '../../../infrastructure/database/documentRepository'
import { storageAdapter } from '../../../infrastructure/storage/storageAdapter'
import type { OcrPageResult, OcrOptions } from '../../../infrastructure/ocr/ocrAdapter'
import type { ScanProDocument } from '../../../infrastructure/database/database'

export interface RunOcrOnDocumentResult {
  success: boolean
  document?: ScanProDocument
  results?: OcrPageResult[]
  error?: string
}

export class RunOcrOnDocumentUseCase {
  async execute(
    documentId: string,
    pageIds?: string[],
    options: OcrOptions = {}
  ): Promise<RunOcrOnDocumentResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) {
        return { success: false, error: 'Dokumen tidak ditemukan' }
      }

      const pagesToProcess = pageIds
        ? document.pages.filter((p) => pageIds.includes(p.id))
        : document.pages

      if (pagesToProcess.length === 0) {
        return { success: false, error: 'Tidak ada halaman untuk OCR' }
      }

      const results: OcrPageResult[] = []

      for (const page of pagesToProcess) {
        if (!page.sourceAssetId) continue

        const asset = await storageAdapter.getAsset(page.sourceAssetId)
        if (!asset) continue

        // In real implementation, load the image from storage
        // For now, we'll create a placeholder
        const mockImage = new Image()
        mockImage.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

        const result = await ocrAdapter.recognizePage(mockImage, page.index + 1, {
          language: 'eng+ind',
        })

        results.push(result)

        // Update page with OCR result
        // In real implementation, save OCR result to database
      }

      return { success: true, document, results }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR gagal'
      return { success: false, error: message }
    }
  }
}

export interface RunOcrOnImageResult {
  success: boolean
  result?: {
    text: string
    confidence: number
    words: any[]
    lines: any[]
    blocks: any[]
  }
  error?: string
}

export class RunOcrOnImageUseCase {
  async execute(
    image: HTMLImageElement | HTMLCanvasElement | Blob | string,
    options: OcrOptions = {}
  ): Promise<RunOcrOnImageResult> {
    try {
      const result = await ocrAdapter.recognize(image, {
        language: 'eng+ind',
        ...options,
      })

      return { success: true, result }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OCR gagal'
      return { success: false, error: message }
    }
  }
}

export interface OcrProgressCallback {
  (progress: { status: string; progress: number; page?: number; totalPages?: number }): void
}

export class RunOcrBatchUseCase {
  async execute(
    documentIds: string[],
    options: OcrOptions = {},
    onProgress?: OcrProgressCallback
  ): Promise<{ success: boolean; results: Map<string, any[]>; error?: string }> {
    try {
      const allResults = new Map<string, any[]>()

      for (let i = 0; i < documentIds.length; i++) {
        const docId = documentIds[i]
        onProgress?.({ status: 'processing', progress: (i / documentIds.length) * 100, page: i + 1, totalPages: documentIds.length })

        const document = await documentRepository.getDocument(docId)
        if (!document) continue

        const useCase = new RunOcrOnDocumentUseCase()
        const result = await useCase.execute(docId, undefined, options)

        if (result.success && result.results) {
          allResults.set(docId, result.results)
        }
      }

      onProgress?.({ status: 'completed', progress: 100 })

      return { success: true, results: allResults }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Batch OCR gagal'
      return { success: false, results: new Map(), error: message }
    }
  }
}

export interface SearchOcrResult {
  success: boolean
  matches?: Array<{
    documentId: string
    documentName: string
    pageIndex: number
    context: string
    matchIndex: number
  }>
  error?: string
}

export class SearchOcrTextUseCase {
  async execute(query: string, documentIds?: string[]): Promise<SearchOcrResult> {
    try {
      // In real implementation, this would search through stored OCR results
      // For now, return empty results
      return { success: true, matches: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pencarian gagal'
      return { success: false, error: message }
    }
  }
}

export class InitializeOcrUseCase {
  async execute(languages: string[] = ['eng', 'ind']): Promise<{ success: boolean; error?: string }> {
    try {
      await ocrAdapter.initialize(languages)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Inisialisasi OCR gagal'
      return { success: false, error: message }
    }
  }
}