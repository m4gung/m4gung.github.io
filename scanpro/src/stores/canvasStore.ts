import { create } from 'zustand'
import { CanvasElementFactory } from '../infrastructure/canvas/canvasElementFactory'
import type {
  CanvasElement,
  CanvasTool,
  CanvasPage,
  CanvasDocument,
  Point,
  Transform,
} from '../domain/canvas'

interface CanvasStoreState {
  document: CanvasDocument | null
  activePageIndex: number
  activeTool: CanvasTool
  history: {
    past: CanvasElement[][]
    future: CanvasElement[][]
  }
  grid: {
    enabled: boolean
    size: number
    snap: boolean
  }
  viewport: {
    x: number
    y: number
    scale: number
  }
  isDrawing: boolean
  drawStartPoint: Point | null
  currentElementId: string | null

  // Document actions
  createDocument: (name: string, pageCount?: number) => void
  loadDocument: (doc: CanvasDocument) => void
  saveDocument: () => CanvasDocument | null
  addPage: (backgroundImage?: string) => void
  removePage: (pageIndex: number) => void
  duplicatePage: (pageIndex: number) => void
  setActivePage: (index: number) => void
  reorderPage: (fromIndex: number, toIndex: number) => void

  // Tool actions
  setActiveTool: (tool: CanvasTool) => void
  setViewport: (viewport: Partial<{ x: number; y: number; scale: number }>) => void
  resetViewport: () => void
  setGrid: (grid: Partial<{ enabled: boolean; size: number; snap: boolean }>) => void

  // Element actions
  addElement: (type: CanvasTool, position: Point, defaults?: Partial<CanvasElement>) => string
  selectElement: (id: string, multi?: boolean) => void
  deselectAll: () => void
  updateElement: (id: string, updates: Partial<CanvasElement>) => void
  updateElementTransform: (id: string, transform: Partial<Transform>) => void
  deleteSelectedElements: () => void
  duplicateSelectedElements: () => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  lockElement: (id: string, locked: boolean) => void
  setElementOpacity: (id: string, opacity: number) => void

  // Drawing actions
  startDrawing: (point: Point) => void
  continueDrawing: (point: Point) => void
  endDrawing: () => void

  // History
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  pushHistory: () => void

  // Selection helpers
  getSelectedElements: () => CanvasElement[]
  getElement: (id: string) => CanvasElement | undefined

  // Export
  exportToBlob: () => Promise<Blob | null>
  exportToImage: () => Promise<Blob | null>
}

const MAX_HISTORY = 50

const createEmptyPage = (index: number, backgroundImage?: string): CanvasPage => ({
  id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  documentId: '',
  pageIndex: index,
  backgroundImage,
  backgroundColor: '#ffffff',
  elements: [],
  width: 800,
  height: 1100,
  viewport: { x: 0, y: 0, scale: 1 },
  createdAt: new Date(),
  updatedAt: new Date(),
})

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  document: null,
  activePageIndex: 0,
  activeTool: 'select',
  history: { past: [], future: [] },
  grid: { enabled: true, size: 20, snap: true },
  viewport: { x: 0, y: 0, scale: 1 },
  isDrawing: false,
  drawStartPoint: null,
  currentElementId: null,

  createDocument: (name: string, pageCount = 1) => {
    const pages = Array.from({ length: pageCount }, (_, i) => createEmptyPage(i))
    const document: CanvasDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      name,
      pages,
      activePageIndex: 0,
      settings: {
        defaultFontFamily: 'system-ui',
        defaultFontSize: 16,
        defaultStrokeColor: '#000000',
        defaultFillColor: '#ffffff',
        defaultStrokeWidth: 2,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    set({ document, activePageIndex: 0, history: { past: [], future: [] } })
  },

  loadDocument: (doc: CanvasDocument) => {
    set({ document: doc, activePageIndex: doc.activePageIndex, history: { past: [], future: [] } })
  },

  saveDocument: () => {
    const { document } = get()
    if (!document) return null
    return { ...document, updatedAt: new Date() }
  },

  addPage: (backgroundImage?: string) => {
    const { document } = get()
    if (!document) return

    const newPage = createEmptyPage(document.pages.length, backgroundImage)
    newPage.documentId = document.id

    set((state) => ({
      document: state.document
        ? { ...state.document, pages: [...state.document.pages, newPage], updatedAt: new Date() }
        : null,
    }))
  },

  removePage: (pageIndex: number) => {
    const { document, activePageIndex } = get()
    if (!document || document.pages.length <= 1) return

    const newPages = document.pages.filter((_, i) => i !== pageIndex).map((p, i) => ({ ...p, pageIndex: i }))
    const newActiveIndex = Math.min(activePageIndex, newPages.length - 1)

    set((state) => ({
      document: state.document
        ? { ...state.document, pages: newPages, activePageIndex: newActiveIndex, updatedAt: new Date() }
        : null,
      activePageIndex: newActiveIndex,
    }))
  },

  duplicatePage: (pageIndex: number) => {
    const { document } = get()
    if (!document) return

    const page = document.pages[pageIndex]
    const newPage: CanvasPage = {
      ...page,
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      pageIndex: pageIndex + 1,
      elements: page.elements.map((el) => ({ ...el, id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 10)}` })),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const newPages = [...document.pages]
    newPages.splice(pageIndex + 1, 0, newPage)
    newPages.forEach((p, i) => { p.pageIndex = i })

    set((state) => ({
      document: state.document
        ? { ...state.document, pages: newPages, updatedAt: new Date() }
        : null,
    }))
  },

  setActivePage: (index: number) => {
    const { document } = get()
    if (!document || index < 0 || index >= document.pages.length) return
    set({ activePageIndex: index })
    if (document) {
      set((state) => ({
        document: state.document
          ? { ...state.document, activePageIndex: index }
          : null,
      }))
    }
  },

  reorderPage: (fromIndex: number, toIndex: number) => {
    const { document } = get()
    if (!document) return
    const pages = [...document.pages]
    const [removed] = pages.splice(fromIndex, 1)
    pages.splice(toIndex, 0, removed)
    pages.forEach((p, i) => { p.pageIndex = i })
    set((state) => ({
      document: state.document
        ? { ...state.document, pages, updatedAt: new Date() }
        : null,
    }))
  },

  setActiveTool: (tool: CanvasTool) => {
    set({ activeTool: tool })
  },

  setViewport: (viewport) => {
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    }))
  },

  resetViewport: () => {
    set({ viewport: { x: 0, y: 0, scale: 1 } })
  },

  setGrid: (grid) => {
    set((state) => ({
      grid: { ...state.grid, ...grid },
    }))
  },

  addElement: (type: CanvasTool, position: Point, defaults?: Partial<CanvasElement>) => {
    const canvasTools: CanvasTool[] = ['text', 'rectangle', 'ellipse', 'line', 'arrow', 'freehand', 'image', 'signature', 'sticky-note', 'highlight']
    if (!canvasTools.includes(type)) return ''

    const element = CanvasElementFactory.createElement({
      type: type as any,
      position,
      defaults: {
        ...defaults,
        zIndex: (get().document?.pages[get().activePageIndex]?.elements.length ?? 0) + 1,
      },
    })

    get().pushHistory()

    set((state) => {
      if (!state.document) return state
      const page = state.document.pages[state.activePageIndex]
      return {
        document: {
          ...state.document,
          pages: state.document.pages.map((p, i) =>
            i === state.activePageIndex
              ? { ...p, elements: [...p.elements, element], updatedAt: new Date() }
              : p
          ),
        },
      }
    })

    return element.id
  },

  selectElement: (id: string, multi = false) => {
    set((state) => ({
      document: state.document
        ? {
            ...state.document,
            pages: state.document.pages.map((p) =>
              p.elements.some((el) => el.id === id)
                ? { ...p, elements: p.elements.map((el) => ({ ...el, selected: el.id === id || (multi && el.selected) })) }
                : p
            ),
          }
        : null,
    }))
  },

  deselectAll: () => {
    set((state) => ({
      document: state.document
        ? {
            ...state.document,
            pages: state.document.pages.map((p) => ({
              ...p,
              elements: p.elements.map((el) => ({ ...el, selected: false })),
            })),
          }
        : null,
    }))
  },

  updateElement: (id: string, updates: Partial<CanvasElement>) => {
    get().pushHistory()

    set((state) => ({
      document: state.document
        ? {
            ...state.document,
            pages: state.document.pages.map((p) => ({
              ...p,
              elements: p.elements.map((el) =>
                el.id === id ? ({ ...el, ...updates, updatedAt: new Date() } as CanvasElement) : el
              ),
            })),
          }
        : null,
    }))
  },

  updateElementTransform: (id: string, transform: Partial<Transform>) => {
    set((state) => ({
      document: state.document
        ? {
            ...state.document,
            pages: state.document.pages.map((p) => ({
              ...p,
              elements: p.elements.map((el) =>
                el.id === id ? { ...el, transform: { ...el.transform, ...transform }, updatedAt: new Date() } : el
              ),
            })),
          }
        : null,
    }))
  },

  deleteSelectedElements: () => {
    get().pushHistory()

    set((state) => ({
      document: state.document
        ? {
            ...state.document,
            pages: state.document.pages.map((p) => ({
              ...p,
              elements: p.elements.filter((el) => !el.selected),
            })),
          }
        : null,
    }))
  },

  duplicateSelectedElements: () => {
    get().pushHistory()

    set((state) => {
      if (!state.document) return state
      const page = state.document.pages[state.activePageIndex]
      const selected = page.elements.filter((el) => el.selected)
      if (selected.length === 0) return state

      const newElements = selected.map((el) =>
        CanvasElementFactory.cloneElement(el, { x: 20, y: 20 })
      )

      return {
        document: {
          ...state.document,
          pages: state.document.pages.map((p, i) =>
            i === state.activePageIndex
              ? { ...p, elements: [...p.elements, ...newElements], updatedAt: new Date() }
              : p
          ),
        },
      }
    })
  },

  bringToFront: (id: string) => {
    get().pushHistory()

    set((state) => {
      if (!state.document) return state
      const page = state.document.pages[state.activePageIndex]
      const element = page.elements.find((el) => el.id === id)
      if (!element) return state

      const maxZ = Math.max(...page.elements.map((el) => el.zIndex))
      return {
        document: {
          ...state.document,
          pages: state.document.pages.map((p, i) =>
            i === state.activePageIndex
              ? { ...p, elements: p.elements.map((el) => (el.id === id ? { ...el, zIndex: maxZ + 1 } : el)) }
              : p
          ),
        },
      }
    })
  },

  sendToBack: (id: string) => {
    get().pushHistory()

    set((state) => {
      if (!state.document) return state
      const page = state.document.pages[state.activePageIndex]
      const minZ = Math.min(...page.elements.map((el) => el.zIndex))
      return {
        document: {
          ...state.document,
          pages: state.document.pages.map((p, i) =>
            i === state.activePageIndex
              ? { ...p, elements: p.elements.map((el) => (el.id === id ? { ...el, zIndex: minZ - 1 } : el)) }
              : p
          ),
        },
      }
    })
  },

  lockElement: (id: string, locked: boolean) => {
    set((state) => ({
      document: state.document
        ? {
            ...state.document,
            pages: state.document.pages.map((p) => ({
              ...p,
              elements: p.elements.map((el) => (el.id === id ? { ...el, locked } : el)),
            })),
          }
        : null,
    }))
  },

  setElementOpacity: (id: string, opacity: number) => {
    set((state) => ({
      document: state.document
        ? {
            ...state.document,
            pages: state.document.pages.map((p) => ({
              ...p,
              elements: p.elements.map((el) =>
                el.id === id ? { ...el, opacity: Math.max(0, Math.min(1, opacity)) } : el
              ),
            })),
          }
        : null,
    }))
  },

  startDrawing: (point: Point) => {
    const { activeTool } = get()
    const drawingTools = ['freehand', 'signature', 'line', 'arrow', 'rectangle', 'ellipse']
    if (!drawingTools.includes(activeTool)) return

    const id = get().addElement(activeTool, point)
    if (id) {
      set({ isDrawing: true, drawStartPoint: point, currentElementId: id })
    }
  },

  continueDrawing: (point: Point) => {
    const { isDrawing, currentElementId, drawStartPoint, activeTool } = get()
    if (!isDrawing || !currentElementId || !drawStartPoint) return

    const dx = point.x - drawStartPoint.x
    const dy = point.y - drawStartPoint.y

    if (activeTool === 'freehand' || activeTool === 'signature') {
      get().updateElement(currentElementId, {
        points: [{ x: dx, y: dy }],
      })
    } else if (['line', 'arrow', 'rectangle', 'ellipse'].includes(activeTool)) {
      get().updateElementTransform(currentElementId, { width: Math.abs(dx), height: Math.abs(dy) })
    }
  },

  endDrawing: () => {
    set({ isDrawing: false, drawStartPoint: null, currentElementId: null })
  },

  pushHistory: () => {
    set((state) => {
      if (!state.document) return state
      const page = state.document.pages[state.activePageIndex]
      const past = [...state.history.past, page.elements.map((el) => ({ ...el }))]
      if (past.length > MAX_HISTORY) past.shift()
      return { history: { past, future: [] } }
    })
  },

  undo: () => {
    set((state) => {
      if (state.history.past.length === 0) return state
      const previous = state.history.past[state.history.past.length - 1]
      const newPast = state.history.past.slice(0, -1)
      const page = state.document?.pages[state.activePageIndex]
      if (!page) return state

      return {
        document: state.document
          ? {
              ...state.document,
              pages: state.document.pages.map((p, i) =>
                i === state.activePageIndex
                  ? { ...p, elements: previous.map((el) => ({ ...el })) }
                  : p
              ),
            }
          : null,
        history: { past: newPast, future: [page.elements.map((el) => ({ ...el })), ...state.history.future] },
      }
    })
  },

  redo: () => {
    set((state) => {
      if (state.history.future.length === 0) return state
      const next = state.history.future[0]
      const newFuture = state.history.future.slice(1)
      const page = state.document?.pages[state.activePageIndex]
      if (!page) return state

      return {
        document: state.document
          ? {
              ...state.document,
              pages: state.document.pages.map((p, i) =>
                i === state.activePageIndex
                  ? { ...p, elements: next.map((el) => ({ ...el })) }
                  : p
              ),
            }
          : null,
        history: { past: [...state.history.past, page.elements.map((el) => ({ ...el }))], future: newFuture },
      }
    })
  },

  canUndo: () => get().history.past.length > 0,
  canRedo: () => get().history.future.length > 0,

  getSelectedElements: () => {
    const { document, activePageIndex } = get()
    if (!document) return []
    return document.pages[activePageIndex]?.elements.filter((el) => el.selected) ?? []
  },

  getElement: (id: string) => {
    const { document, activePageIndex } = get()
    if (!document) return undefined
    return document.pages[activePageIndex]?.elements.find((el) => el.id === id)
  },

  exportToBlob: async () => {
    const { document } = get()
    if (!document) return null
    const data = JSON.stringify(document, null, 2)
    return new Blob([data], { type: 'application/json' })
  },

  exportToImage: async () => {
    const { document: canvasDoc, activePageIndex } = get()
    if (!canvasDoc) return null
    const page = canvasDoc.pages[activePageIndex]
    const canvas = window.document.createElement('canvas')
    canvas.width = page.width
    canvas.height = page.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.fillStyle = page.backgroundColor
    ctx.fillRect(0, 0, page.width, page.height)
    // Note: Full rendering would need the renderer
    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    })
  },
}))