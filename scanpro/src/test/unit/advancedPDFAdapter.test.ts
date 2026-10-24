import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFInspectionAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { PDFAnnotationAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { PDFFormAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { PDFRedactionAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { PDFOverlayAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'
import { PDFBackupAdapter } from '../../infrastructure/pdf-processing/advancedPDFAdapter'

vi.mock('pdf-lib', () => {
  const mockPage = {
    getSize: vi.fn(() => ({ width: 595, height: 842 })),
    getRotation: vi.fn(() => ({ angle: 0 })),
    getAnnotations: vi.fn(() => []),
    node: { Resources: {}, Annots: [] },
    drawText: vi.fn(),
    drawRectangle: vi.fn(),
    drawLines: vi.fn(),
    drawImage: vi.fn(),
  }
  const mockForm = {
    getFields: vi.fn(() => []),
    createTextField: vi.fn(() => ({
      setText: vi.fn(),
      setMaxLength: vi.fn(),
      enableMultiline: vi.fn(),
      enablePassword: vi.fn(),
      addToPage: vi.fn(),
      setFontSize: vi.fn(),
      setTextColor: vi.fn(),
      setBackgroundColor: vi.fn(),
      setBorderColor: vi.fn(),
      setBorderWidth: vi.fn(),
    })),
    createCheckBox: vi.fn(() => ({
      check: vi.fn(),
      uncheck: vi.fn(),
      addToPage: vi.fn(),
    })),
    createRadioGroup: vi.fn(() => ({
      addButtonToGroup: vi.fn(() => ({ addToPage: vi.fn() })),
      select: vi.fn(),
    })),
    createDropdown: vi.fn(() => ({
      addOption: vi.fn(),
      select: vi.fn(),
      addToPage: vi.fn(),
    })),
    createButton: vi.fn(() => ({
      setOnClickAction: vi.fn(),
      addToPage: vi.fn(),
    })),
    flatten: vi.fn(),
  }
  const mockPdfDoc = {
    getPageCount: vi.fn(() => 2),
    getPage: vi.fn(() => mockPage),
    getPages: vi.fn(() => [mockPage, mockPage]),
    getFonts: vi.fn(() => []),
    getForm: vi.fn(() => mockForm),
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
    destroy: vi.fn(),
  }
  const mockPdfDocument = {
    numPages: 2,
    fingerprints: ['fp1'],
    getPage: vi.fn(() => Promise.resolve(mockPage)),
    getMetadata: vi.fn(() => Promise.resolve({ info: {}, metadata: {} })),
    destroy: vi.fn(),
  }

  return {
    PDFDocument: {
      load: vi.fn(() => Promise.resolve(mockPdfDoc)),
      create: vi.fn(() => Promise.resolve(mockPdfDoc)),
    },
    rgb: vi.fn((r, g, b) => ({ r, g, b })),
    degrees: vi.fn((d) => d),
    StandardFonts: { Helvetica: 'Helvetica', HelveticaBold: 'HelveticaBold' },
    getDocument: vi.fn(() => ({ promise: Promise.resolve(mockPdfDocument) })),
    version: '4.0.0',
  }
})

describe('Advanced PDF Adapters', () => {
  describe('PDFInspectionAdapter', () => {
    let adapter: PDFInspectionAdapter

    beforeEach(() => {
      adapter = new PDFInspectionAdapter()
    })

    it('should inspect document and return capability report', async () => {
      const report = await adapter.inspectDocument(new Uint8Array([1, 2, 3]))
      
      expect(report).toBeDefined()
      expect(report.canExtractText).toBe(true)
      expect(report.canAddAnnotations).toBe(true)
      expect(report.canAddFormFields).toBe(true)
      expect(report.canSign).toBe(true)
      expect(report.pages).toHaveLength(2)
    })
  })

  describe('PDFAnnotationAdapter', () => {
    let adapter: PDFAnnotationAdapter

    beforeEach(() => {
      adapter = new PDFAnnotationAdapter()
    })

    it('should add text annotation', async () => {
      const result = await adapter.addTextAnnotation(new Uint8Array([1]), {
        pageIndex: 0,
        type: 'text',
        rect: { x0: 100, y0: 100, x1: 200, y1: 150 },
        contents: 'Test annotation',
      })
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should add highlight annotation', async () => {
      const result = await adapter.addHighlightAnnotation(new Uint8Array([1]), 0, [{
        x0: 100, y0: 100, x1: 200, y1: 100, x2: 200, y2: 150, x3: 100, y3: 150
      }])
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should add ink annotation', async () => {
      const result = await adapter.addInkAnnotation(new Uint8Array([1]), 0, [[{ x: 100, y: 100 }, { x: 200, y: 200 }]], { r: 1, g: 0, b: 0 })
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('PDFFormAdapter', () => {
    let adapter: PDFFormAdapter

    beforeEach(() => {
      adapter = new PDFFormAdapter()
    })

    it('should add text field', async () => {
      const result = await adapter.addTextField(new Uint8Array([1]), {
        id: 'field1',
        pageIndex: 0,
        type: 'text',
        name: 'field1',
        rect: { x0: 100, y0: 100, x1: 300, y1: 130 },
        fontSize: 12,
      })
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should add checkbox', async () => {
      const result = await adapter.addCheckBox(new Uint8Array([1]), {
        id: 'check1',
        pageIndex: 0,
        type: 'checkbox',
        name: 'check1',
        rect: { x0: 100, y0: 100, x1: 120, y1: 120 },
        value: 'Off',
      })
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should add radio group', async () => {
      const result = await adapter.addRadioGroup(new Uint8Array([1]), 'group1', [
        { pageIndex: 0, type: 'radio', name: 'group1', rect: { x0: 100, y0: 100, x1: 120, y1: 120 }, exportValue: 'opt1', value: 'opt1' },
      ])
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should add dropdown', async () => {
      const result = await adapter.addDropdown(new Uint8Array([1]), {
        id: 'dropdown1',
        pageIndex: 0,
        type: 'dropdown',
        name: 'dropdown1',
        rect: { x0: 100, y0: 100, x1: 300, y1: 130 },
        options: ['A', 'B'],
      })
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should flatten form', async () => {
      const result = await adapter.flattenForm(new Uint8Array([1]))
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('PDFRedactionAdapter', () => {
    let adapter: PDFRedactionAdapter

    beforeEach(() => {
      adapter = new PDFRedactionAdapter()
    })

    it('should redact area', async () => {
      const result = await adapter.redactArea(new Uint8Array([1]), 0, { x0: 100, y0: 100, x1: 200, y1: 200 })
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('PDFOverlayAdapter', () => {
    let adapter: PDFOverlayAdapter

    beforeEach(() => {
      adapter = new PDFOverlayAdapter()
    })

    it('should add text overlay', async () => {
      const result = await adapter.addTextOverlay(new Uint8Array([1]), 0, 'Test', { x: 100, y: 100 }, { fontSize: 12 })
      expect(result).toBeInstanceOf(Uint8Array)
    })

    it('should add watermark', async () => {
      const result = await adapter.addWatermark(new Uint8Array([1]), 'CONFIDENTIAL')
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('PDFBackupAdapter', () => {
    let adapter: PDFBackupAdapter

    beforeEach(() => {
      adapter = new PDFBackupAdapter()
    })

    it('should create backup', async () => {
      const backup = await adapter.createBackup(new Uint8Array([1, 2, 3]))
      expect(backup).toBeInstanceOf(Uint8Array)
    })

    it('should verify integrity', async () => {
      const original = new Uint8Array([1, 2, 3])
      const backup = new Uint8Array([1, 2, 3])
      const verified = await adapter.verifyIntegrity(original, backup)
      expect(verified).toBe(true)
    })

    it('should detect corrupted backup', async () => {
      const original = new Uint8Array([1, 2, 3])
      const backup = new Uint8Array([1, 2, 4])
      const verified = await adapter.verifyIntegrity(original, backup)
      expect(verified).toBe(false)
    })
  })
})