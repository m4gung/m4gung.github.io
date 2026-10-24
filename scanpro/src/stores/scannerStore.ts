import { create } from 'zustand'
import {
  StartScanSessionUseCase,
  CaptureScanPageUseCase,
  ProcessScanPageUseCase,
  SaveScanSessionUseCase,
  CancelScanSessionUseCase,
} from '../application/use-cases/ScannerUseCases'
import type { ScanSession, ScanPage } from '../application/use-cases/ScannerUseCases'
import { cameraAdapter } from '../infrastructure/camera/cameraAdapter'
import { imageProcessingAdapter } from '../infrastructure/image-processing/imageProcessingAdapter'
import { scannerSessionRepository } from '../infrastructure/database/scannerDatabase'

const startSession = new StartScanSessionUseCase()
const capturePage = new CaptureScanPageUseCase()
const processPage = new ProcessScanPageUseCase()
const saveSession = new SaveScanSessionUseCase()
const cancelSession = new CancelScanSessionUseCase()

interface ScannerStoreState {
  session: ScanSession | null
  isStreaming: boolean
  currentDevice: string | null
  availableDevices: Array<{ deviceId: string; label: string }>
  isProcessing: boolean
  error: string | null
  isRestoring: boolean
  startSession: (name: string) => Promise<void>
  stopSession: () => Promise<void>
  initializeCamera: (facingMode?: 'user' | 'environment') => Promise<void>
  stopCamera: () => Promise<void>
  capturePage: () => Promise<void>
  processPage: (pageId: string, options: any) => Promise<void>
  reorderPage: (fromIndex: number, toIndex: number) => void
  removePage: (pageId: string) => void
  saveSession: () => Promise<void>
  setError: (error: string | null) => void
  clearError: () => void
  restoreSession: (sessionId: string) => Promise<void>
  listSessions: () => Promise<Array<{ id: string; name: string; pageCount: number; updatedAt: Date }>>
  deleteSession: (sessionId: string) => Promise<void>
  autoSave: () => Promise<void>
}

const AUTO_SAVE_INTERVAL = 5000

export const useScannerStore = create<ScannerStoreState>((set, get) => ({
  session: null,
  isStreaming: false,
  currentDevice: null,
  availableDevices: [],
  isProcessing: false,
  error: null,
  isRestoring: false,

  startSession: async (name: string) => {
    set({ error: null })
    const result = await startSession.execute(name)
    if (result.success) {
      set({ session: result.session })
      get().autoSave()
    } else {
      set({ error: result.error })
    }
  },

  stopSession: async () => {
    const { session } = get()
    if (session) {
      await cancelSession.execute(session)
      await scannerSessionRepository.deleteSession(session.id)
      set({ session: null })
    }
  },

  initializeCamera: async (facingMode = 'environment') => {
    set({ error: null })
    try {
      const devices = await cameraAdapter.enumerateDevices()
      set({ availableDevices: devices.map((d) => ({ deviceId: d.deviceId, label: d.label })) })

      await cameraAdapter.startStream({ facingMode })
      set({ isStreaming: true, currentDevice: facingMode })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal memulai kamera' })
    }
  },

  stopCamera: async () => {
    await cameraAdapter.stopStream()
    set({ isStreaming: false, currentDevice: null })
  },

  capturePage: async () => {
    const { session } = get()
    if (!session) return

    set({ isProcessing: true, error: null })
    try {
      const blob = await cameraAdapter.captureFrame()
      if (!blob) throw new Error('Gagal menangkap frame')

      const result = await capturePage.execute(session, blob)
      if (result.success) {
        set((state) => ({
          session: state.session
            ? { ...state.session, pages: [...state.session.pages, result.page!] }
            : null,
        }))
        get().autoSave()
      } else {
        set({ error: result.error })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal menangkap halaman' })
    } finally {
      set({ isProcessing: false })
    }
  },

  processPage: async (pageId: string, options: any) => {
    const { session } = get()
    if (!session) return

    const pageIndex = session.pages.findIndex((p) => p.id === pageId)
    if (pageIndex === -1) return

    set({ isProcessing: true, error: null })
    try {
      const page = session.pages[pageIndex]
      const result = await processPage.execute(page, options)
      if (result.success) {
        set((state) => ({
          session: state.session
            ? {
                ...state.session,
                pages: state.session.pages.map((p, i) =>
                  i === pageIndex
                    ? {
                        ...p,
                        processedBlob: result.processedBlob,
                        previewUrl: result.previewUrl!,
                        status: 'processed' as const,
                        ...options,
                      }
                    : p
                ),
              }
            : null,
        }))
        get().autoSave()
      } else {
        set({ error: result.error })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal memproses halaman' })
    } finally {
      set({ isProcessing: false })
    }
  },

  reorderPage: (fromIndex: number, toIndex: number) => {
    set((state) => {
      if (!state.session) return state
      const pages = [...state.session.pages]
      const [removed] = pages.splice(fromIndex, 1)
      pages.splice(toIndex, 0, removed)
      return {
        session: {
          ...state.session,
          pages: pages.map((p, i) => ({ ...p, index: i })),
        },
      }
    })
    get().autoSave()
  },

  removePage: (pageId: string) => {
    set((state) => {
      if (!state.session) return state
      const page = state.session.pages.find((p) => p.id === pageId)
      if (page) {
        imageProcessingAdapter.revokePreviewUrl(page.previewUrl)
        if (page.processedBlob) {
          imageProcessingAdapter.revokePreviewUrl(
            imageProcessingAdapter.createPreviewUrl(page.processedBlob)
          )
        }
      }
      return {
        session: {
          ...state.session,
          pages: state.session.pages
            .filter((p) => p.id !== pageId)
            .map((p, i) => ({ ...p, index: i })),
        },
      }
    })
    get().autoSave()
  },

  saveSession: async () => {
    const { session } = get()
    if (!session || session.pages.length === 0) {
      set({ error: 'Tidak ada halaman untuk disimpan' })
      return
    }

    set({ isProcessing: true, error: null })
    try {
      const result = await saveSession.execute(session)
      if (result.success) {
        await scannerSessionRepository.deleteSession(session.id)
        set({ session: null })
        await get().stopCamera()
      } else {
        set({ error: result.error })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal menyimpan sesi' })
    } finally {
      set({ isProcessing: false })
    }
  },

  restoreSession: async (sessionId: string) => {
    set({ isRestoring: true, error: null })
    try {
      const saved = await scannerSessionRepository.getSession(sessionId)
      if (saved) {
        const session: ScanSession = {
          id: saved.id,
          name: saved.name,
          pages: saved.pages.map((p) => ({
            id: p.id,
            sessionId: p.sessionId,
            originalBlob: p.originalBlob,
            processedBlob: p.processedBlob,
            previewUrl: p.previewUrl,
            index: p.index,
            rotation: p.rotation,
            crop: p.crop,
            perspective: p.perspective,
            enhancement: p.enhancement,
            status: p.status,
          })),
          createdAt: saved.createdAt,
          updatedAt: saved.updatedAt,
        }
        set({ session, isRestoring: false })
      } else {
        set({ error: 'Sesi tidak ditemukan', isRestoring: false })
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Gagal memulihkan sesi', isRestoring: false })
    }
  },

  listSessions: async () => {
    const sessions = await scannerSessionRepository.getAllSessions()
    return sessions.map((s) => ({
      id: s.id,
      name: s.name,
      pageCount: s.pages?.length ?? 0,
      updatedAt: s.updatedAt,
    }))
  },

  deleteSession: async (sessionId: string) => {
    await scannerSessionRepository.deleteSession(sessionId)
  },

  autoSave: async () => {
    const { session } = get()
    if (!session || session.pages.length === 0) return

    try {
      const record = {
        id: session.id,
        name: session.name,
        pages: session.pages.map((p) => ({
          id: p.id,
          sessionId: session.id,
          originalBlob: p.originalBlob,
          processedBlob: p.processedBlob,
          previewUrl: p.previewUrl,
          index: p.index,
          rotation: p.rotation,
          crop: p.crop,
          perspective: p.perspective,
          enhancement: p.enhancement,
          status: p.status,
          createdAt: p.status === 'captured' ? session.createdAt : new Date(),
          updatedAt: new Date(),
        })),
        createdAt: session.createdAt,
        updatedAt: new Date(),
        status: 'active' as const,
      }
      await scannerSessionRepository.saveSession(record)
    } catch {
      // Silent auto-save failure
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}))

setInterval(() => {
  useScannerStore.getState().autoSave()
}, AUTO_SAVE_INTERVAL)