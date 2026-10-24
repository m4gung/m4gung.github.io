import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TesseractOcrAdapter } from '../../infrastructure/ocr/ocrAdapter'

vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(),
  PSM: {},
  OEM: {},
}))

describe('TesseractOcrAdapter', () => {
  let adapter: TesseractOcrAdapter
  let mockWorker: any

  beforeEach(() => {
    adapter = new TesseractOcrAdapter()
    mockWorker = {
      recognize: vi.fn(),
      setLogger: vi.fn(),
      terminate: vi.fn().mockResolvedValue(undefined),
    }
    vi.mocked(require('tesseract.js').createWorker).mockResolvedValue(mockWorker)
  })

  it('should initialize with languages', async () => {
    await adapter.initialize(['eng', 'ind'])
    expect(require('tesseract.js').createWorker).toHaveBeenCalledWith(['eng', 'ind'], expect.any(Object))
    expect(adapter.isInitialized()).toBe(true)
  })

  it('should recognize image', async () => {
    mockWorker.recognize.mockResolvedValue({
      data: {
        text: 'Test text',
        confidence: 95,
        words: [{ text: 'Test', confidence: 95, bbox: { x0: 0, y0: 0, x1: 10, y1: 10 } }],
        lines: [{ text: 'Test text', confidence: 95, bbox: { x0: 0, y0: 0, x1: 100, y1: 20 } }],
        blocks: [{ text: 'Test text', confidence: 95, bbox: { x0: 0, y0: 0, x1: 100, y1: 20 }, lines: [] }],
      },
    })

    await adapter.initialize(['eng'])
    const result = await adapter.recognize('test-image')

    expect(result.text).toBe('Test text')
    expect(result.confidence).toBe(95)
    expect(result.words).toHaveLength(1)
  })

  it('should recognize page with metadata', async () => {
    mockWorker.recognize.mockResolvedValue({
      data: {
        text: 'Page 1 text',
        confidence: 90,
        words: [],
        lines: [],
        blocks: [],
      },
    })

    await adapter.initialize(['eng'])
    const result = await adapter.recognizePage('test-image', 1)

    expect(result.pageNumber).toBe(1)
    expect(result.text).toBe('Page 1 text')
    expect(result.confidence).toBe(90)
    expect(result.processingTime).toBeGreaterThanOrEqual(0)
  })

  it('should set logger', async () => {
    const logger = vi.fn()
    await adapter.initialize(['eng'])
    adapter.setLogger(logger)
    expect(mockWorker.setLogger).toHaveBeenCalledWith(logger)
  })

  it('should terminate worker', async () => {
    await adapter.initialize(['eng'])
    await adapter.terminate()
    expect(mockWorker.terminate).toHaveBeenCalled()
    expect(adapter.isInitialized()).toBe(false)
  })

  it('should return supported languages', () => {
    const langs = adapter.getSupportedLanguages()
    expect(langs).toContain('eng')
    expect(langs).toContain('ind')
    expect(langs).toContain('eng+ind')
  })
})