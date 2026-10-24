import { pdfRenderingAdapter } from '../../infrastructure/pdf-rendering/pdfRenderingAdapter'
import { pdfProcessingAdapter } from '../../infrastructure/pdf-processing/pdfProcessingAdapter'
import { documentRepository } from '../../infrastructure/database/documentRepository'
import { storageAdapter } from '../../infrastructure/storage/storageAdapter'
import type { ScanProDocument } from '../../infrastructure/database/database'
import type { SourceAsset, DocumentPage } from '../../domain/documents'
import { PDFPageOperation, PDFExportOptions, PDFMergeOptions } from '../../infrastructure/pdf-processing/pdfProcessingAdapter'

export interface ImportPDFResult {
  success: boolean
  document?: ScanProDocument
  asset?: SourceAsset
  error?: string
}

export class ImportPDFUseCase {
  async execute(file: File): Promise<ImportPDFResult> {
    try {
      if (file.type !== 'application/pdf') {
        return { success: false, error: 'File bukan format PDF' }
      }

      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      const pdfInfo = await pdfRenderingAdapter.loadDocument(uint8Array)
      const pagesMetadata = await pdfRenderingAdapter.getAllPagesMetadata()

      const asset: SourceAsset = {
        id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        name: file.name,
        type: 'pdf',
        mimeType: 'application/pdf',
        size: file.size,
        storagePath: `pdfs/${file.name}`,
        checksum: await this.generateChecksum(uint8Array),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await storageAdapter.saveAsset(asset)

      const now = new Date()
      const pages: DocumentPage[] = pagesMetadata.map((p, i) => ({
        id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        documentId: '',
        sourceType: 'pdf' as const,
        sourceAssetId: asset.id,
        index: i,
        width: p.width,
        height: p.height,
        rotation: p.rotation,
        metadata: {
          createdAt: now,
          updatedAt: now,
        },
      }))

      const document = await documentRepository.createDocument({
        name: file.name.replace(/\.pdf$/i, ''),
        sourceAssetId: asset.id,
        type: 'document',
        status: 'active',
        pages,
        version: 1,
        metadata: {
          createdAt: now,
          updatedAt: now,
          accessCount: 0,
        },
      })

      return { success: true, document, asset }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengimpor PDF'
      return { success: false, error: message }
    }
  }

  private async generateChecksum(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
}

export interface RotatePDFPageResult {
  success: boolean
  error?: string
}

export class RotatePDFPageUseCase {
  async execute(
    documentId: string,
    pageId: string,
    rotation: number
  ): Promise<RotatePDFPageResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset) return { success: false, error: 'Asset PDF tidak ditemukan' }

      const pdfDoc = await pdfProcessingAdapter.loadDocument(new Uint8Array())
      const pageIndex = document.pages.findIndex((p) => p.id === pageId)
      if (pageIndex === -1) return { success: false, error: 'Halaman tidak ditemukan' }

      await pdfProcessingAdapter.rotatePage(pdfDoc, pageIndex, rotation)

      const updatedPages = [...document.pages]
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        rotation: (updatedPages[pageIndex].rotation + rotation) % 360,
      }

      await documentRepository.updateDocument(documentId, { pages: updatedPages })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memutar halaman'
      return { success: false, error: message }
    }
  }
}

export interface DeletePDFPageResult {
  success: boolean
  error?: string
}

export class DeletePDFPageUseCase {
  async execute(documentId: string, pageId: string): Promise<DeletePDFPageResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const pageIndex = document.pages.findIndex((p) => p.id === pageId)
      if (pageIndex === -1) return { success: false, error: 'Halaman tidak ditemukan' }

      const updatedPages = document.pages.filter((p) => p.id !== pageId).map((p, i) => ({
        ...p,
        index: i,
      }))

      await documentRepository.updateDocument(documentId, { pages: updatedPages })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus halaman'
      return { success: false, error: message }
    }
  }
}

export interface ReorderPDFPagesResult {
  success: boolean
  error?: string
}

export class ReorderPDFPagesUseCase {
  async execute(documentId: string, newOrder: string[]): Promise<ReorderPDFPagesResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const pageMap = new Map(document.pages.map((p) => [p.id, p]))
      const reorderedPages = newOrder
        .map((id) => pageMap.get(id))
        .filter((p): p is DocumentPage => p !== undefined)
        .map((p, i) => ({ ...p, index: i }))

      await documentRepository.updateDocument(documentId, { pages: reorderedPages })

      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengubah urutan halaman'
      return { success: false, error: message }
    }
  }
}

export interface ExportPDFResult {
  success: boolean
  blob?: Blob
  error?: string
}

export class ExportPDFUseCase {
  async execute(
    documentId: string,
    options: PDFExportOptions = {}
  ): Promise<ExportPDFResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const pdfDoc = await pdfProcessingAdapter.loadDocument(pdfData)

      const pageIndices = options.pageIndices ?? document.pages.map((_, i) => i)
      await pdfProcessingAdapter.copyPages(pdfDoc, pdfDoc, pageIndices)

      const pdfBytes = await pdfProcessingAdapter.saveDocument(pdfDoc, options)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })

      return { success: true, blob }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengekspor PDF'
      return { success: false, error: message }
    }
  }
}

export interface MergePDFsResult {
  success: boolean
  blob?: Blob
  error?: string
}

export class MergePDFsUseCase {
  async execute(documentIds: string[]): Promise<MergePDFsResult> {
    try {
      const documents: Uint8Array[] = []

      for (const id of documentIds) {
        const document = await documentRepository.getDocument(id)
        if (!document) continue

        const asset = await storageAdapter.getAsset(document.sourceAssetId!)
        if (asset && asset.type === 'pdf') {
          documents.push(new Uint8Array())
        }
      }

      if (documents.length < 2) {
        return { success: false, error: 'Minimal 2 dokumen PDF untuk digabung' }
      }

      const mergedBytes = await pdfProcessingAdapter.mergeDocuments({ documents })
      const blob = new Blob([mergedBytes], { type: 'application/pdf' })

      return { success: true, blob }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menggabungkan PDF'
      return { success: false, error: message }
    }
  }
}

export interface SplitPDFResult {
  success: boolean
  blobs?: Blob[]
  error?: string
}

export class SplitPDFUseCase {
  async execute(
    documentId: string,
    splitPoints: number[]
  ): Promise<SplitPDFResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const pdfDoc = await pdfProcessingAdapter.loadDocument(pdfData)
      const splitBytes = await pdfProcessingAdapter.splitDocument(pdfDoc, splitPoints)

      const blobs = splitBytes.map((bytes) => new Blob([bytes], { type: 'application/pdf' }))

      return { success: true, blobs }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memecah PDF'
      return { success: false, error: message }
    }
  }
}

export interface ExtractPDFPagesResult {
  success: boolean
  blob?: Blob
  error?: string
}

export class ExtractPDFPagesUseCase {
  async execute(
    documentId: string,
    pageIndices: number[]
  ): Promise<ExtractPDFPagesResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const pdfDoc = await pdfProcessingAdapter.loadDocument(pdfData)
      const extractedBytes = await pdfProcessingAdapter.extractPages(pdfDoc, pageIndices)
      const blob = new Blob([extractedBytes], { type: 'application/pdf' })

      return { success: true, blob }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mengekstrak halaman'
      return { success: false, error: message }
    }
  }
}

export interface PrintPDFResult {
  success: boolean
  printWindow?: Window
  error?: string
}

export class PrintPDFUseCase {
  async execute(documentId: string): Promise<PrintPDFResult> {
    try {
      const document = await documentRepository.getDocument(documentId)
      if (!document) return { success: false, error: 'Dokumen tidak ditemukan' }

      const asset = await storageAdapter.getAsset(document.sourceAssetId!)
      if (!asset || asset.type !== 'pdf') {
        return { success: false, error: 'Asset PDF tidak ditemukan' }
      }

      const pdfData = new Uint8Array()
      const pdfDoc = await pdfProcessingAdapter.loadDocument(pdfData)
      const pdfBytes = await pdfProcessingAdapter.saveDocument(pdfDoc)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const printWindow = window.open(url, '_blank')
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
        }
        return { success: true, printWindow }
      }

      return { success: false, error: 'Gagal membuka jendela cetak' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal mencetak PDF'
      return { success: false, error: message }
    }
  }
}