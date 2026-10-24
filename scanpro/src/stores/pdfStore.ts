import { create } from 'zustand'
import {
  ImportPDFUseCase,
  RotatePDFPageUseCase,
  DeletePDFPageUseCase,
  ReorderPDFPagesUseCase,
  ExportPDFUseCase,
  MergePDFsUseCase,
  SplitPDFUseCase,
  ExtractPDFPagesUseCase,
  PrintPDFUseCase,
} from '../../application/use-cases/PDFUseCases'
import type { ScanProDocument, SourceAsset } from '../../infrastructure/database/database'
import { pdfRenderingAdapter } from '../../infrastructure/pdf-rendering/pdfRenderingAdapter'

const importPDF = new ImportPDFUseCase()
const rotatePage = new RotatePDFPageUseCase()
const deletePage = new DeletePDFPageUseCase()
const reorderPages = new ReorderPDFPagesUseCase()
const exportPDF = new ExportPDFUseCase()
const mergePDFs = new MergePDFsUseCase()
const splitPDF = new SplitPDFUseCase()
const extractPages = new ExtractPDFPagesUseCase()
const printPDF = new PrintPDFUseCase()

interface PDFStoreState {
  currentDocument: ScanProDocument | null
  pdfPages: Array<{
    pageNumber: number
    width: number
    height: number
    rotation: number
    thumbnailUrl?: string
  }>
  isLoading: boolean
  isProcessing: boolean
  error: string | null
  importPDF: (file: File) => Promise<void>
  loadPDF: (documentId: string) => Promise<void>
  rotatePage: (pageId: string, rotation: number) => Promise<void>
  deletePage: (pageId: string) => Promise<void>
  reorderPages: (newOrder: string[]) => Promise<void>
  exportPDF: (options?: any) => Promise<Blob | null>
  mergePDFs: (documentIds: string[]) => Promise<Blob | null>
  splitPDF: (splitPoints: number[]) => Promise<Blob[] | null>
  extractPages: (pageIndices: number[]) => Promise<Blob | null>
  printPDF: () => Promise<void>
  generateThumbnails: () => Promise<void>
  setError: (error: string | null) => void
  clearError: () => void
  clearCurrentDocument: () => void
}

export const usePDFStore = create<PDFStoreState>((set, get) => ({
  currentDocument: null,
  pdfPages: [],
  isLoading: false,
  isProcessing: false,
  error: null,

  importPDF: async (file: File) => {
    set({ isLoading: true, error: null })
    try {
      const result = await importPDF.execute(file)
      if (result.success && result.document) {
        await get().loadPDF(result.document.id)
      } else {
        set({ error: result.error, isLoading: false })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal mengimpor PDF', isLoading: false })
    }
  },

  loadPDF: async (documentId: string) => {
    set({ isLoading: true, error: null })
    try {
      // Note: In real implementation, we'd fetch from documentRepository
      // For now, we'll simulate loading
      const mockPages = Array.from({ length: 5 }, (_, i) => ({
        pageNumber: i + 1,
        width: 595,
        height: 842,
        rotation: 0,
      }))
      set({ pdfPages: mockPages, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal memuat PDF', isLoading: false })
    }
  },

  rotatePage: async (pageId: string, rotation: number) => {
    const { currentDocument } = get()
    if (!currentDocument) return

    set({ isProcessing: true, error: null })
    try {
      const result = await rotatePage.execute(currentDocument.id, pageId, rotation)
      if (result.success) {
        set((state) => ({
          pdfPages: state.pdfPages.map((p) =>
            String(p.pageNumber) === pageId ? { ...p, rotation: (p.rotation + rotation) % 360 } : p
          ),
        }))
      } else {
        set({ error: result.error })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal memutar halaman' })
    } finally {
      set({ isProcessing: false })
    }
  },

  deletePage: async (pageId: string) => {
    const { currentDocument } = get()
    if (!currentDocument) return

    set({ isProcessing: true, error: null })
    try {
      const result = await deletePage.execute(currentDocument.id, pageId)
      if (result.success) {
        set((state) => ({
          pdfPages: state.pdfPages.filter((p) => String(p.pageNumber) !== pageId).map((p, i) => ({ ...p, pageNumber: i + 1 })),
        }))
      } else {
        set({ error: result.error })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal menghapus halaman' })
    } finally {
      set({ isProcessing: false })
    }
  },

  reorderPages: async (newOrder: string[]) => {
    const { currentDocument } = get()
    if (!currentDocument) return

    set({ isProcessing: true, error: null })
    try {
      const result = await reorderPages.execute(currentDocument.id, newOrder)
      if (result.success) {
        // Reorder pdfPages to match
        const pageMap = new Map(get().pdfPages.map((p) => [String(p.pageNumber), p]))
        const reordered = newOrder.map((id) => pageMap.get(id)).filter((p): p is typeof get().pdfPages[0] => p !== undefined)
        set({ pdfPages: reordered.map((p, i) => ({ ...p, pageNumber: i + 1 })) })
      } else {
        set({ error: result.error })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal mengubah urutan' })
    } finally {
      set({ isProcessing: false })
    }
  },

  exportPDF: async (options = {}) => {
    const { currentDocument } = get()
    if (!currentDocument) return null

    set({ isProcessing: true, error: null })
    try {
      const result = await exportPDF.execute(currentDocument.id, options)
      if (result.success) return result.blob!
      set({ error: result.error })
      return null
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal mengekspor PDF' })
      return null
    } finally {
      set({ isProcessing: false })
    }
  },

  mergePDFs: async (documentIds: string[]) => {
    set({ isProcessing: true, error: null })
    try {
      const result = await mergePDFs.execute(documentIds)
      if (result.success) return result.blob!
      set({ error: result.error })
      return null
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal menggabungkan PDF' })
      return null
    } finally {
      set({ isProcessing: false })
    }
  },

  splitPDF: async (splitPoints: number[]) => {
    const { currentDocument } = get()
    if (!currentDocument) return null

    set({ isProcessing: true, error: null })
    try {
      const result = await splitPDF.execute(currentDocument.id, splitPoints)
      if (result.success) return result.blobs!
      set({ error: result.error })
      return null
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal memecah PDF' })
      return null
    } finally {
      set({ isProcessing: false })
    }
  },

  extractPages: async (pageIndices: number[]) => {
    const { currentDocument } = get()
    if (!currentDocument) return null

    set({ isProcessing: true, error: null })
    try {
      const result = await extractPages.execute(currentDocument.id, pageIndices)
      if (result.success) return result.blob!
      set({ error: result.error })
      return null
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal mengekstrak halaman' })
      return null
    } finally {
      set({ isProcessing: false })
    }
  },

  printPDF: async () => {
    const { currentDocument } = get()
    if (!currentDocument) return

    set({ isProcessing: true, error: null })
    try {
      await printPDF.execute(currentDocument.id)
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal mencetak PDF' })
    } finally {
      set({ isProcessing: false })
    }
  },

  generateThumbnails: async () => {
    const { currentDocument } = get()
    if (!currentDocument) return

    set({ isProcessing: true })
    try {
      // In real implementation, use PDFThumbnailGenerator
      // For now, mock thumbnails
      const thumbnails = get().pdfPages.map((p) => ({
        ...p,
        thumbnailUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="140"><rect width="100" height="140" fill="%23e0e0e0"/><text x="50" y="70" text-anchor="middle" font-size="12" fill="%23999">Page ${p.pageNumber}</text></svg>`,
      }))
      set({ pdfPages: thumbnails, isProcessing: false })
    } catch {
      set({ isProcessing: false })
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
  clearCurrentDocument: () => set({ currentDocument: null, pdfPages: [] }),
}))