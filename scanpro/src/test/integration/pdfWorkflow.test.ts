import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePDFStore } from '../../stores/pdfStore'
import { pdfRenderingAdapter } from '../../infrastructure/pdf-rendering/pdfRenderingAdapter'
import { pdfProcessingAdapter } from '../../infrastructure/pdf-processing/pdfProcessingAdapter'

vi.mock('../../infrastructure/pdf-rendering/pdfRenderingAdapter')
vi.mock('../../infrastructure/pdf-processing/pdfProcessingAdapter')

describe('PDF Editor Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePDFStore.setState({
      currentDocument: null,
      pdfPages: [],
      isLoading: false,
      isProcessing: false,
      error: null,
    })
  })

  it('should import PDF and load pages', async () => {
    const mockFile = new File(['%PDF-1.4...'], 'test.pdf', { type: 'application/pdf' })
    const mockPdfPages = [
      { pageNumber: 1, width: 595, height: 842, rotation: 0 },
      { pageNumber: 2, width: 595, height: 842, rotation: 0 },
    ]

    vi.mocked(pdfRenderingAdapter.loadDocument).mockResolvedValue({
      numPages: 2,
      fingerprints: ['fp1'],
    })
    vi.mocked(pdfRenderingAdapter.getAllPagesMetadata).mockResolvedValue(mockPdfPages)

    await usePDFStore.getState().importPDF(mockFile)

    const state = usePDFStore.getState()
    expect(state.pdfPages).toHaveLength(2)
    expect(state.pdfPages[0].pageNumber).toBe(1)
    expect(state.pdfPages[1].pageNumber).toBe(2)
  })

  it('should rotate page', async () => {
    usePDFStore.setState({
      currentDocument: { id: 'doc1', name: 'Test' } as any,
      pdfPages: [
        { pageNumber: 1, width: 595, height: 842, rotation: 0 },
        { pageNumber: 2, width: 595, height: 842, rotation: 0 },
      ],
    })

    vi.mocked(pdfProcessingAdapter.rotatePage).mockResolvedValue(undefined)

    await usePDFStore.getState().rotatePage('1', 90)

    const state = usePDFStore.getState()
    expect(state.pdfPages[0].rotation).toBe(90)
    expect(state.pdfPages[1].rotation).toBe(0)
  })

  it('should delete page and reindex', async () => {
    usePDFStore.setState({
      currentDocument: { id: 'doc1', name: 'Test' } as any,
      pdfPages: [
        { pageNumber: 1, width: 595, height: 842, rotation: 0 },
        { pageNumber: 2, width: 595, height: 842, rotation: 0 },
        { pageNumber: 3, width: 595, height: 842, rotation: 0 },
      ],
    })

    vi.mocked(pdfProcessingAdapter.deletePage).mockResolvedValue(undefined)

    await usePDFStore.getState().deletePage('2')

    const state = usePDFStore.getState()
    expect(state.pdfPages).toHaveLength(2)
    expect(state.pdfPages[0].pageNumber).toBe(1)
    expect(state.pdfPages[1].pageNumber).toBe(2) // Was page 3, now page 2
  })

  it('should reorder pages', async () => {
    usePDFStore.setState({
      currentDocument: { id: 'doc1', name: 'Test' } as any,
      pdfPages: [
        { pageNumber: 1, width: 595, height: 842, rotation: 0 },
        { pageNumber: 2, width: 595, height: 842, rotation: 0 },
        { pageNumber: 3, width: 595, height: 842, rotation: 0 },
      ],
    })

    vi.mocked(pdfProcessingAdapter.copyPages).mockResolvedValue(undefined)

    // Move page 3 to position 1
    await usePDFStore.getState().reorderPages(['3', '1', '2'])

    const state = usePDFStore.getState()
    expect(state.pdfPages[0].pageNumber).toBe(3)
    expect(state.pdfPages[1].pageNumber).toBe(1)
    expect(state.pdfPages[2].pageNumber).toBe(2)
  })

  it('should handle multi-page selection and batch rotate', async () => {
    usePDFStore.setState({
      currentDocument: { id: 'doc1', name: 'Test' } as any,
      pdfPages: [
        { pageNumber: 1, width: 595, height: 842, rotation: 0 },
        { pageNumber: 2, width: 595, height: 842, rotation: 0 },
        { pageNumber: 3, width: 595, height: 842, rotation: 0 },
      ],
    })

    // Simulate selecting pages 1 and 2, then rotating both
    const state = usePDFStore.getState()
    state.rotatePage('1', 90)
    state.rotatePage('2', 90)

    const newState = usePDFStore.getState()
    expect(newState.pdfPages[0].rotation).toBe(90)
    expect(newState.pdfPages[1].rotation).toBe(90)
    expect(newState.pdfPages[2].rotation).toBe(0)
  })

  it('should export PDF', async () => {
    usePDFStore.setState({
      currentDocument: { id: 'doc1', name: 'Test' } as any,
      pdfPages: [
        { pageNumber: 1, width: 595, height: 842, rotation: 0 },
      ],
    })

    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' })
    vi.mocked(pdfProcessingAdapter.saveDocument).mockResolvedValue(new Uint8Array([1, 2, 3]))

    const blob = await usePDFStore.getState().exportPDF()

    expect(blob).toBeInstanceOf(Blob)
  })

  it('should merge multiple PDFs', async () => {
    const mockBlob = new Blob(['merged'], { type: 'application/pdf' })
    vi.mocked(pdfProcessingAdapter.mergeDocuments).mockResolvedValue(new Uint8Array([1, 2, 3]))

    const blob = await usePDFStore.getState().mergePDFs(['doc1', 'doc2'])

    expect(blob).toBeInstanceOf(Blob)
    expect(pdfProcessingAdapter.mergeDocuments).toHaveBeenCalledWith({
      documents: expect.any(Array),
    })
  })

  it('should split PDF at specified points', async () => {
    usePDFStore.setState({
      currentDocument: { id: 'doc1', name: 'Test' } as any,
      pdfPages: [
        { pageNumber: 1, width: 595, height: 842, rotation: 0 },
        { pageNumber: 2, width: 595, height: 842, rotation: 0 },
        { pageNumber: 3, width: 595, height: 842, rotation: 0 },
        { pageNumber: 4, width: 595, height: 842, rotation: 0 },
      ],
    })

    const mockBlobs = [new Blob(['part1']), new Blob(['part2'])]
    vi.mocked(pdfProcessingAdapter.splitDocument).mockResolvedValue([new Uint8Array([1]), new Uint8Array([2])])

    const blobs = await usePDFStore.getState().splitPDF([2])

    expect(blobs).toHaveLength(2)
  })

  it('should extract specific pages', async () => {
    usePDFStore.setState({
      currentDocument: { id: 'doc1', name: 'Test' } as any,
      pdfPages: [
        { pageNumber: 1, width: 595, height: 842, rotation: 0 },
        { pageNumber: 2, width: 595, height: 842, rotation: 0 },
        { pageNumber: 3, width: 595, height: 842, rotation: 0 },
      ],
    })

    const mockBlob = new Blob(['extracted'], { type: 'application/pdf' })
    vi.mocked(pdfProcessingAdapter.extractPages).mockResolvedValue(new Uint8Array([1, 2, 3]))

    const blob = await usePDFStore.getState().extractPages([0, 2])

    expect(blob).toBeInstanceOf(Blob)
  })

  it('should handle import error gracefully', async () => {
    vi.mocked(pdfRenderingAdapter.loadDocument).mockRejectedValue(new Error('Invalid PDF'))

    await usePDFStore.getState().importPDF(new File(['invalid'], 'test.pdf', { type: 'application/pdf' }))

    const state = usePDFStore.getState()
    expect(state.error).toContain('Gagal mengimpor PDF')
  })

  it('should clear error', async () => {
    usePDFStore.setState({ error: 'Test error' })
    usePDFStore.getState().clearError()
    expect(usePDFStore.getState().error).toBeNull()
  })
})