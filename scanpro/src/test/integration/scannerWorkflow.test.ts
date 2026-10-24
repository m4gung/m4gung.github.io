import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useScannerStore } from '../../stores/scannerStore'
import { cameraAdapter } from '../../infrastructure/camera/cameraAdapter'
import { imageProcessingAdapter } from '../../infrastructure/image-processing/imageProcessingAdapter'
import { scannerSessionRepository } from '../../infrastructure/database/scannerDatabase'

vi.mock('../../infrastructure/camera/cameraAdapter')
vi.mock('../../infrastructure/image-processing/imageProcessingAdapter')
vi.mock('../../infrastructure/database/scannerDatabase')

describe('Scanner Workflow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useScannerStore.setState({
      session: null,
      isStreaming: false,
      isProcessing: false,
      error: null,
    })
  })

  it('should complete full scan-to-document workflow', async () => {
    const mockBlob = new Blob(['scan'], { type: 'image/jpeg' })
    const mockProcessedBlob = new Blob(['processed'], { type: 'image/jpeg' })
    const mockPreviewUrl = 'blob:preview-url'

    vi.mocked(cameraAdapter.enumerateDevices).mockResolvedValue([
      { deviceId: 'cam1', kind: 'videoinput', label: 'Back Camera', groupId: 'g1' },
    ])
    vi.mocked(cameraAdapter.startStream).mockResolvedValue({
      stream: {} as MediaStream,
      device: { deviceId: 'cam1', kind: 'videoinput', label: 'Back Camera', groupId: 'g1' },
      constraints: {},
    })
    vi.mocked(cameraAdapter.captureFrame).mockResolvedValue(mockBlob)
    vi.mocked(cameraAdapter.stopStream).mockResolvedValue(undefined)

    vi.mocked(imageProcessingAdapter.createPreviewUrl).mockReturnValue(mockPreviewUrl)
    vi.mocked(imageProcessingAdapter.revokePreviewUrl).mockImplementation(() => {})
    vi.mocked(imageProcessingAdapter.processImage).mockResolvedValue({
      blob: mockProcessedBlob,
      width: 100,
      height: 100,
      dataUrl: 'data:image/jpeg;base64,fake',
    })

    vi.mocked(scannerSessionRepository.saveSession).mockResolvedValue(undefined)
    vi.mocked(scannerSessionRepository.deleteSession).mockResolvedValue(undefined)

    // 1. Start session
    await useScannerStore.getState().startSession('Test Scan')
    let session = useScannerStore.getState().session
    expect(session).toBeDefined()
    expect(session?.name).toBe('Test Scan')
    expect(session?.pages).toHaveLength(0)

    // 2. Initialize camera
    await useScannerStore.getState().initializeCamera('environment')
    expect(useScannerStore.getState().isStreaming).toBe(true)

    // 3. Capture page
    await useScannerStore.getState().capturePage()
    session = useScannerStore.getState().session
    expect(session?.pages).toHaveLength(1)
    expect(session?.pages[0].status).toBe('captured')

    // 4. Process page (perspective + rotation)
    const pageId = session!.pages[0].id
    await useScannerStore.getState().processPage(pageId, {
      rotation: 90,
      perspective: {
        topLeft: { x: 0.1, y: 0.1 },
        topRight: { x: 0.9, y: 0.1 },
        bottomRight: { x: 0.9, y: 0.9 },
        bottomLeft: { x: 0.1, y: 0.9 },
      },
      enhancement: { contrast: 1.2, sharpen: true },
    })
    session = useScannerStore.getState().session
    expect(session?.pages[0].status).toBe('processed')
    expect(session?.pages[0].rotation).toBe(90)

    // 5. Save session (creates document)
    await useScannerStore.getState().saveSession()
    expect(useScannerStore.getState().session).toBeNull()
    expect(useScannerStore.getState().isStreaming).toBe(false)

    // Verify document was created via saveSession use case
    expect(scannerSessionRepository.deleteSession).toHaveBeenCalled()
  })

  it('should handle multi-page session with reorder and delete', async () => {
    const mockBlob = new Blob(['scan'], { type: 'image/jpeg' })
    const mockPreviewUrl = 'blob:preview-url'

    vi.mocked(cameraAdapter.enumerateDevices).mockResolvedValue([])
    vi.mocked(cameraAdapter.startStream).mockResolvedValue({
      stream: {} as MediaStream,
      device: { deviceId: 'cam1', kind: 'videoinput', label: 'Back Camera', groupId: 'g1' },
      constraints: {},
    })
    vi.mocked(cameraAdapter.captureFrame).mockResolvedValue(mockBlob)
    vi.mocked(imageProcessingAdapter.createPreviewUrl).mockReturnValue(mockPreviewUrl)
    vi.mocked(imageProcessingAdapter.revokePreviewUrl).mockImplementation(() => {})

    await useScannerStore.getState().startSession('Multi Page')
    await useScannerStore.getState().initializeCamera()

    // Capture 3 pages
    await useScannerStore.getState().capturePage()
    await useScannerStore.getState().capturePage()
    await useScannerStore.getState().capturePage()

    let session = useScannerStore.getState().session
    expect(session?.pages).toHaveLength(3)

    // Reorder: move page 3 to position 1
    useScannerStore.getState().reorderPage(2, 0)
    session = useScannerStore.getState().session
    expect(session?.pages[0].index).toBe(0)

    // Delete middle page
    const middlePageId = session!.pages[1].id
    useScannerStore.getState().removePage(middlePageId)
    session = useScannerStore.getState().session
    expect(session?.pages).toHaveLength(2)
    expect(session?.pages.every((p, i) => p.index === i)).toBe(true)
  })

  it('should persist and restore session', async () => {
    const mockSessionRecord = {
      id: 'session_restore_test',
      name: 'Restore Test',
      pages: [{
        id: 'page_1',
        sessionId: 'session_restore_test',
        originalBlob: new Blob(['original'], { type: 'image/jpeg' }),
        processedBlob: new Blob(['processed'], { type: 'image/jpeg' }),
        previewUrl: 'blob:preview',
        index: 0,
        rotation: 0,
        status: 'processed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active' as const,
    }

    vi.mocked(scannerSessionRepository.getSession).mockResolvedValue(mockSessionRecord)

    await useScannerStore.getState().restoreSession('session_restore_test')

    const session = useScannerStore.getState().session
    expect(session).toBeDefined()
    expect(session?.id).toBe('session_restore_test')
    expect(session?.pages).toHaveLength(1)
    expect(session?.pages[0].status).toBe('processed')
  })

  it('should list saved sessions', async () => {
    const mockSessions = [
      { id: 's1', name: 'Session 1', pages: [{}, {}], updatedAt: new Date('2024-01-02') },
      { id: 's2', name: 'Session 2', pages: [{}], updatedAt: new Date('2024-01-01') },
    ]
    vi.mocked(scannerSessionRepository.getAllSessions).mockResolvedValue(mockSessions as any)

    const sessions = await useScannerStore.getState().listSessions()
    expect(sessions).toHaveLength(2)
    expect(sessions[0].name).toBe('Session 1') // Most recent first
  })

  it('should handle camera permission denial gracefully', async () => {
    vi.mocked(cameraAdapter.enumerateDevices).mockRejectedValue(new Error('Permission denied'))

    await useScannerStore.getState().initializeCamera()
    expect(useScannerStore.getState().error).toContain('Gagal memulai kamera')
    expect(useScannerStore.getState().isStreaming).toBe(false)
  })

  it('should auto-save session periodically', async () => {
    const mockBlob = new Blob(['scan'], { type: 'image/jpeg' })
    const mockPreviewUrl = 'blob:preview-url'

    vi.mocked(cameraAdapter.enumerateDevices).mockResolvedValue([])
    vi.mocked(cameraAdapter.startStream).mockResolvedValue({
      stream: {} as MediaStream,
      device: { deviceId: 'cam1', kind: 'videoinput', label: 'Back Camera', groupId: 'g1' },
      constraints: {},
    })
    vi.mocked(cameraAdapter.captureFrame).mockResolvedValue(mockBlob)
    vi.mocked(imageProcessingAdapter.createPreviewUrl).mockReturnValue(mockPreviewUrl)
    vi.mocked(imageProcessingAdapter.revokePreviewUrl).mockImplementation(() => {})
    vi.mocked(scannerSessionRepository.saveSession).mockResolvedValue(undefined)

    await useScannerStore.getState().startSession('Auto Save Test')
    await useScannerStore.getState().initializeCamera()
    await useScannerStore.getState().capturePage()

    expect(scannerSessionRepository.saveSession).toHaveBeenCalled()
  })
})