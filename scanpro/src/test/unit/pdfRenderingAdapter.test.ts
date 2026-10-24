import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFRenderingAdapter } from '../../infrastructure/pdf-rendering/pdfRenderingAdapter'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
  version: '4.0.0',
}))

describe('PDFRenderingAdapter', () => {
  let adapter: PDFRenderingAdapter
  let mockPdfDocument: any
  let mockPage: any

  beforeEach(() => {
    adapter = new PDFRenderingAdapter()
    mockPage = {
      getViewport: vi.fn(() => ({ width: 595, height: 842 })),
      rotate: 0,
      render: vi.fn(() => ({ promise: Promise.resolve() })),
      getTextContent: vi.fn(() => Promise.resolve({ items: [] })),
    }
    mockPdfDocument = {
      numPages: 3,
      fingerprints: ['fp1'],
      getPage: vi.fn(() => Promise.resolve(mockPage)),
      getMetadata: vi.fn(() => Promise.resolve({ info: {}, metadata: {} })),
      destroy: vi.fn(),
    }
    vi.mocked(require('pdfjs-dist').getDocument).mockReturnValue({
      promise: Promise.resolve(mockPdfDocument),
    })
  })

  it('should load document and return info', async () => {
    const info = await adapter.loadDocument(new ArrayBuffer(8))
    expect(info.numPages).toBe(3)
    expect(info.fingerprints).toEqual(['fp1'])
  })

  it('should get page metadata', async () => {
    await adapter.loadDocument(new ArrayBuffer(8))
    const result = await adapter.getPage(1)
    expect(result).toBeDefined()
    expect(result?.metadata.pageNumber).toBe(1)
    expect(result?.metadata.width).toBe(595)
    expect(result?.metadata.height).toBe(842)
  })

  it('should get all pages metadata', async () => {
    await adapter.loadDocument(new ArrayBuffer(8))
    const pages = await adapter.getAllPagesMetadata()
    expect(pages).toHaveLength(3)
    expect(pages[0].pageNumber).toBe(1)
  })

  it('should return null for invalid page number', async () => {
    await adapter.loadDocument(new ArrayBuffer(8))
    const result = await adapter.getPage(999)
    expect(result).toBeNull()
  })

  it('should destroy document', async () => {
    await adapter.loadDocument(new ArrayBuffer(8))
    adapter.destroy()
    expect(mockPdfDocument.destroy).toHaveBeenCalled()
  })
})