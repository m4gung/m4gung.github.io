import { create } from 'zustand'
import {
  RunOcrOnDocumentUseCase,
  RunOcrOnImageUseCase,
  RunOcrBatchUseCase,
  SearchOcrTextUseCase,
  InitializeOcrUseCase,
} from '../application/use-cases/OcrUseCases'
import type { OcrPageResult, OcrOptions } from '../infrastructure/ocr/ocrAdapter'

const runOcrOnDocument = new RunOcrOnDocumentUseCase()
const runOcrOnImage = new RunOcrOnImageUseCase()
const runOcrBatch = new RunOcrBatchUseCase()
const searchOcrText = new SearchOcrTextUseCase()
const initializeOcr = new InitializeOcrUseCase()

interface OcrStoreState {
  isInitialized: boolean
  isProcessing: boolean
  progress: number
  status: string
  currentPage: number
  totalPages: number
  results: Map<string, OcrPageResult[]>
  lastError: string | null

  initialize: (languages?: string[]) => Promise<void>
  runOcrOnDocument: (documentId: string, pageIds?: string[], options?: any) => Promise<void>
  runOcrOnImage: (image: any, options?: any) => Promise<any>
  runOcrBatch: (documentIds: string[], options?: any) => Promise<void>
  searchText: (query: string, documentIds?: string[]) => Promise<any[]>
  setProgress: (progress: number, status: string, currentPage?: number, totalPages?: number) => void
  clearError: () => void
  clearResults: () => void
}

export const useOcrStore = create<OcrStoreState>((set, get) => ({
  isInitialized: false,
  isProcessing: false,
  progress: 0,
  status: 'idle',
  currentPage: 0,
  totalPages: 0,
  results: new Map(),
  lastError: null,

  initialize: async (languages = ['eng', 'ind']) => {
    set({ isProcessing: true, lastError: null })
    try {
      const result = await initializeOcr.execute(languages)
      if (result.success) {
        set({ isInitialized: true, isProcessing: false })
      } else {
        set({ isProcessing: false, lastError: result.error })
      }
    } catch (error) {
      set({ isProcessing: false, lastError: error instanceof Error ? error.message : 'Inisialisasi gagal' })
    }
  },

  runOcrOnDocument: async (documentId: string, pageIds?: string[], options = {}) => {
    set({ isProcessing: true, progress: 0, status: 'processing', lastError: null })
    try {
      const result = await runOcrOnDocument.execute(documentId, pageIds, options)
      if (result.success && result.results) {
        const newResults = new Map(get().results)
        newResults.set(documentId, result.results)
        set({ results: newResults, isProcessing: false, progress: 100, status: 'completed' })
      } else {
        set({ isProcessing: false, lastError: result.error })
      }
    } catch (error) {
      set({ isProcessing: false, lastError: error instanceof Error ? error.message : 'OCR dokumen gagal' })
    }
  },

  runOcrOnImage: async (image: any, options = {}) => {
    set({ isProcessing: true, progress: 0, status: 'processing', lastError: null })
    try {
      const result = await runOcrOnImage.execute(image, options)
      if (result.success) {
        set({ isProcessing: false, progress: 100, status: 'completed' })
        return result.result
      } else {
        set({ isProcessing: false, lastError: result.error })
        return null
      }
    } catch (error) {
      set({ isProcessing: false, lastError: error instanceof Error ? error.message : 'OCR gambar gagal' })
      return null
    }
  },

  runOcrBatch: async (documentIds: string[], options = {}) => {
    set({ isProcessing: true, progress: 0, status: 'processing', lastError: null })
    try {
      const result = await runOcrBatch.execute(
        documentIds,
        options,
        (progress) => {
          set({
            progress: progress.progress,
            status: progress.status,
            currentPage: progress.page,
            totalPages: progress.totalPages,
          })
        }
      )
      if (result.success) {
        set({ isProcessing: false, progress: 100, status: 'completed' })
      } else {
        set({ isProcessing: false, lastError: result.error })
      }
    } catch (error) {
      set({ isProcessing: false, lastError: error instanceof Error ? error.message : 'Batch OCR gagal' })
    }
  },

  searchText: async (query: string, documentIds?: string[]) => {
    try {
      const result = await searchOcrText.execute(query, documentIds)
      return result.matches ?? []
    } catch {
      return []
    }
  },

  setProgress: (progress, status, currentPage, totalPages) => {
    set({ progress, status, currentPage, totalPages })
  },

  clearError: () => set({ lastError: null }),
  clearResults: () => set({ results: new Map() }),
}))