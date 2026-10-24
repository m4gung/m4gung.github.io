import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AppProviders } from '../../providers'
import { useDocumentStore } from '../../stores/documentStore'
import { useScannerStore } from '../../stores/scannerStore'
import { usePDFStore } from '../../stores/pdfStore'
import { useCanvasStore } from '../../stores/canvasStore'
import { useOcrStore } from '../../stores/ocrStore'
import { useAdvancedPDFStore } from '../../stores/advancedPDFStore'

// Custom render with providers
export function renderWithProviders(
  ui: React.ReactElement,
  options: Omit<RenderOptions, 'wrapper'> = {}
): RenderResult {
  return render(ui, {
    wrapper: ({ children }) => (
      <BrowserRouter>
        <AppProviders>
          {children}
        </AppProviders>
      </BrowserRouter>
    ),
    ...options,
  })
}

// Store reset helpers
export function resetAllStores(): void {
  useDocumentStore.setState({
    documents: [],
    isLoading: false,
    error: null,
    selectedDocumentId: null,
    currentFolderId: null,
    queryOptions: {
      page: 1,
      pageSize: 20,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      status: 'active',
      folderId: null,
    },
  })

  useScannerStore.setState({
    session: null,
    isStreaming: false,
    currentDevice: null,
    availableDevices: [],
    isProcessing: false,
    error: null,
    isRestoring: false,
  })

  usePDFStore.setState({
    currentDocument: null,
    pdfPages: [],
    isLoading: false,
    isProcessing: false,
    error: null,
  })

  useCanvasStore.setState({
    document: null,
    activePageIndex: 0,
    activeTool: 'select',
    history: { past: [], future: [] },
    grid: { enabled: true, size: 20, snap: true },
    viewport: { x: 0, y: 0, scale: 1 },
    isDrawing: false,
    drawStartPoint: null,
    currentElementId: null,
  })

  useOcrStore.setState({
    isInitialized: false,
    isProcessing: false,
    progress: 0,
    status: 'idle',
    currentPage: 0,
    totalPages: 0,
    results: new Map(),
    lastError: null,
  })

  useAdvancedPDFStore.setState({
    currentDocumentId: null,
    inspectionReport: null,
    annotations: new Map(),
    formFields: new Map(),
    isLoading: false,
    isProcessing: false,
    error: null,
  })
}

// Mock data factories
export const mockDocument = (overrides: Partial<any> = {}) => ({
  id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  name: 'Test Document',
  status: 'active',
  pages: [],
  version: 1,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
    accessCount: 0,
  },
  ...overrides,
})

export const mockDocumentPage = (overrides: Partial<any> = {}) => ({
  id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  documentId: 'doc_123',
  sourceType: 'scanned',
  sourceAssetId: 'asset_123',
  index: 0,
  width: 595,
  height: 842,
  rotation: 0,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ...overrides,
})

export const mockSourceAsset = (overrides: Partial<any> = {}) => ({
  id: `asset_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  name: 'test.jpg',
  type: 'image',
  mimeType: 'image/jpeg',
  size: 1024,
  storagePath: 'assets/test.jpg',
  checksum: 'abc123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const mockFolder = (overrides: Partial<any> = {}) => ({
  id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  name: 'Test Folder',
  documentCount: 0,
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ...overrides,
})

export const mockCanvasElement = (overrides: Partial<any> = {}) => ({
  id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
  type: 'text',
  transform: {
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
  },
  zIndex: 0,
  visible: true,
  locked: false,
  opacity: 1,
  content: 'Test text',
  fontFamily: 'system-ui',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  color: '#000000',
  textAlign: 'left',
  lineHeight: 1.4,
  padding: 4,
  style: {},
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ...overrides,
})

export const mockOcrResult = (overrides: Partial<any> = {}) => ({
  text: 'Test OCR text',
  confidence: 0.95,
  words: [
    { text: 'Test', confidence: 0.95, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } },
    { text: 'OCR', confidence: 0.93, bbox: { x0: 15, y0: 0, x1: 25, y1: 10 } },
    { text: 'text', confidence: 0.97, bbox: { x0: 30, y0: 0, x1: 45, y1: 10 } },
  ],
  lines: [
    { text: 'Test OCR text', confidence: 0.95, bbox: { x0: 0, y0: 0, x1: 45, y1: 10 } },
  ],
  blocks: [],
  processingTime: 100,
  language: 'eng',
  ...overrides,
})

// Async utilities for testing
export function waitFor(condition: () => boolean, timeout = 1000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      if (condition()) {
        resolve()
      } else if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for condition'))
      } else {
        setTimeout(check, 10)
      }
    }
    check()
  })
}

export function actAsync(fn: () => Promise<void>): Promise<void> {
  return fn()
}

// Mock file creator
export function createMockFile(name: string, type: string, size = 1024): File {
  const content = new Uint8Array(size)
  return new File([content], name, { type })
}

// Mock Image creator
export function createMockImage(width = 100, height = 100): HTMLImageElement {
  const img = new Image()
  img.width = width
  img.height = height
  img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  return img
}

// Mock Canvas creator
export function createMockCanvas(width = 100, height = 100): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

// Accessibility testing helpers
export function getByRole(container: HTMLElement, role: string, name?: string): HTMLElement | null {
  const elements = container.querySelectorAll<HTMLElement>(`[role="${role}"]`)
  if (name) {
    return Array.from(elements).find(el => 
      el.getAttribute('aria-label') === name || 
      el.getAttribute('aria-labelledby') === name ||
      el.textContent?.includes(name)
    ) || null
  }
  return elements[0] as HTMLElement || null
}

export function getByLabelText(container: HTMLElement, text: string): HTMLElement | null {
  const labels = container.querySelectorAll('label')
  for (const label of labels) {
    if (label.textContent?.includes(text)) {
      const forId = label.getAttribute('for')
      if (forId) {
        return document.getElementById(forId)
      }
      const input = label.querySelector('input, select, textarea')
      if (input) return input as HTMLElement
    }
  }
  return null
}

export function getByText(container: HTMLElement, text: string): HTMLElement | null {
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )
  let node
  while ((node = walker.nextNode())) {
    if (node.textContent?.includes(text)) {
      return node.parentElement as HTMLElement
    }
  }
  return null
}

// Keyboard testing helpers
export function fireKeyDown(element: HTMLElement, key: string, modifiers: { ctrlKey?: boolean; shiftKey?: boolean; altKey?: boolean; metaKey?: boolean } = {}): void {
  element.dispatchEvent(new KeyboardEvent('keydown', {
    key,
    ...modifiers,
    bubbles: true,
    cancelable: true,
  }))
}

export function fireKeyUp(element: HTMLElement, key: string): void {
  element.dispatchEvent(new KeyboardEvent('keyup', {
    key,
    bubbles: true,
    cancelable: true,
  }))
}

// Mouse testing helpers
export function fireClick(element: HTMLElement): void {
  element.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window,
  }))
}

export function fireMouseDown(element: HTMLElement, clientX: number, clientY: number): void {
  element.dispatchEvent(new MouseEvent('mousedown', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
  }))
}

export function fireMouseMove(element: HTMLElement, clientX: number, clientY: number): void {
  element.dispatchEvent(new MouseEvent('mousemove', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
  }))
}

export function fireMouseUp(element: HTMLElement, clientX: number, clientY: number): void {
  element.dispatchEvent(new MouseEvent('mouseup', {
    bubbles: true,
    cancelable: true,
    view: window,
    clientX,
    clientY,
  }))
}

// Drag and drop testing helpers
export function fireDragStart(element: HTMLElement, dataTransfer: DataTransfer): void {
  element.dispatchEvent(new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer,
  }))
}

export function fireDragOver(element: HTMLElement, dataTransfer: DataTransfer): void {
  element.dispatchEvent(new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer,
  }))
}

export function fireDrop(element: HTMLElement, dataTransfer: DataTransfer): void {
  element.dispatchEvent(new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer,
  }))
}

export function fireDragEnd(element: HTMLElement, dataTransfer: DataTransfer): void {
  element.dispatchEvent(new DragEvent('dragend', {
    bubbles: true,
    cancelable: true,
    dataTransfer,
  }))
}

// Form testing helpers
export function fireInputChange(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): void {
  element.value = value
  element.dispatchEvent(new Event('input', { bubbles: true }))
  element.dispatchEvent(new Event('change', { bubbles: true }))
}

export function fireFormSubmit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

// Wait for element helpers
export async function waitForElement(
  container: HTMLElement,
  selector: string,
  timeout = 1000
): Promise<HTMLElement | null> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const element = container.querySelector(selector)
    if (element) return element as HTMLElement
    await new Promise(r => setTimeout(r, 10))
  }
  return null
}

export async function waitForElementToDisappear(
  container: HTMLElement,
  selector: string,
  timeout = 1000
): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const element = container.querySelector(selector)
    if (!element) return true
    await new Promise(r => setTimeout(r, 10))
  }
  return false
}