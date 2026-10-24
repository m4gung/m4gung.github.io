import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFProcessingAdapter } from '../../infrastructure/pdf-processing/pdfProcessingAdapter'
import { PDFDocument } from 'pdf-lib'

vi.mock('pdf-lib')

describe('PDFProcessingAdapter', () => {
  let adapter: PDFProcessingAdapter
  let mockPdfDoc: any
  let mockPage: any

  beforeEach(() => {
    adapter = new PDFProcessingAdapter()
    mockPage = {
      getRotation: vi.fn(() => ({ angle: 0 })),
      setRotation: vi.fn(),
      getSize: vi.fn(() => ({ width: 595, height: 842 })),
      drawText: vi.fn(),
    }
    mockPdfDoc = {
      getPageCount: vi.fn(() => 3),
      getPage: vi.fn((i) => mockPage),
      getPages: vi.fn(() => [mockPage, mockPage, mockPage]),
      removePage: vi.fn(),
      addPage: vi.fn(),
      copyPages: vi.fn(() => Promise.resolve([mockPage])),
      save: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
      setTitle: vi.fn(),
      setAuthor: vi.fn(),
      setSubject: vi.fn(),
      setKeywords: vi.fn(),
      setCreator: vi.fn(),
      setProducer: vi.fn(),
      setCreationDate: vi.fn(),
      setModificationDate: vi.fn(),
    }
    vi.mocked(PDFDocument.load).mockResolvedValue(mockPdfDoc)
    vi.mocked(PDFDocument.create).mockResolvedValue(mockPdfDoc)
  })

  it('should load document', async () => {
    const data = new Uint8Array([1, 2, 3])
    const doc = await adapter.loadDocument(data)
    expect(doc).toBe(mockPdfDoc)
    expect(PDFDocument.load).toHaveBeenCalledWith(data)
  })

  it('should create new document', async () => {
    const doc = await adapter.createDocument()
    expect(doc).toBe(mockPdfDoc)
    expect(PDFDocument.create).toHaveBeenCalled()
  })

  it('should get page count', async () => {
    const count = await adapter.getPageCount(mockPdfDoc)
    expect(count).toBe(3)
  })

  it('should rotate page', async () => {
    await adapter.rotatePage(mockPdfDoc, 0, 90)
    expect(mockPage.setRotation).toHaveBeenCalled()
  })

  it('should delete page', async () => {
    await adapter.deletePage(mockPdfDoc, 1)
    expect(mockPdfDoc.removePage).toHaveBeenCalledWith(1)
  })

  it('should merge documents', async () => {
    const doc1 = new Uint8Array([1])
    const doc2 = new Uint8Array([2])
    const result = await adapter.mergeDocuments({ documents: [doc1, doc2] })
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('should split document', async () => {
    const results = await adapter.splitDocument(mockPdfDoc, [1, 2])
    expect(Array.isArray(results)).toBe(true)
  })

  it('should extract pages', async () => {
    const result = await adapter.extractPages(mockPdfDoc, [0, 2])
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('should add page numbers', async () => {
    await adapter.addPageNumbers(mockPdfDoc, { startNumber: 1 })
    expect(mockPage.drawText).toHaveBeenCalled()
  })

  it('should set metadata', async () => {
    await adapter.setMetadata(mockPdfDoc, {
      title: 'Test',
      author: 'Author',
      subject: 'Subject',
      keywords: ['tag1', 'tag2'],
      creator: 'Creator',
      producer: 'Producer',
    })
    expect(mockPdfDoc.setTitle).toHaveBeenCalledWith('Test')
    expect(mockPdfDoc.setAuthor).toHaveBeenCalledWith('Author')
  })
})