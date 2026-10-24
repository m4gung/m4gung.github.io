import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageProcessingAdapter } from '../../infrastructure/image-processing/imageProcessingAdapter'

describe('ImageProcessingAdapter', () => {
  let adapter: ImageProcessingAdapter
  let mockBlob: Blob
  let mockImage: HTMLImageElement
  let mockCanvas: HTMLCanvasElement
  let mockContext: CanvasRenderingContext2D

  beforeEach(() => {
    adapter = new ImageProcessingAdapter()
    mockBlob = new Blob(['fake image'], { type: 'image/jpeg' })

    mockImage = {
      width: 100,
      height: 100,
      onload: null,
      onerror: null,
      src: '',
    } as unknown as HTMLImageElement

    mockContext = {
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(40000),
        width: 100,
        height: 100,
      })),
      putImageData: vi.fn(),
      transform: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,fake'),
    } as unknown as HTMLCanvasElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  it('should load image from blob', async () => {
    const loadPromise = adapter.loadImage(mockBlob)
    mockImage.onload?.(new Event('load'))
    const img = await loadPromise
    expect(img).toBe(mockImage)
  })

  it('should process image with rotation', async () => {
    vi.spyOn(adapter, 'loadImage').mockResolvedValue(mockImage)

    const result = await adapter.processImage(mockBlob, { rotation: 90 })

    expect(mockContext.rotate).toHaveBeenCalled()
    expect(result.blob).toBeDefined()
    expect(result.width).toBeDefined()
    expect(result.height).toBeDefined()
  })

  it('should process image with crop', async () => {
    vi.spyOn(adapter, 'loadImage').mockResolvedValue(mockImage)

    const result = await adapter.processImage(mockBlob, {
      crop: { x: 10, y: 10, width: 50, height: 50 },
    })

    expect(mockContext.translate).toHaveBeenCalledWith(-10, -10)
    expect(result.blob).toBeDefined()
  })

  it('should apply enhancement (contrast, brightness)', async () => {
    vi.spyOn(adapter, 'loadImage').mockResolvedValue(mockImage)

    const mockImageData = {
      data: new Uint8ClampedArray(40000),
      width: 100,
      height: 100,
    }
    mockContext.getImageData.mockReturnValue(mockImageData)

    const result = await adapter.processImage(mockBlob, {
      enhance: { contrast: 1.5, brightness: 0.2 },
    })

    expect(mockContext.getImageData).toHaveBeenCalled()
    expect(mockContext.putImageData).toHaveBeenCalled()
    expect(result.blob).toBeDefined()
  })

  it('should apply grayscale enhancement', async () => {
    vi.spyOn(adapter, 'loadImage').mockResolvedValue(mockImage)
    const mockImageData = {
      data: new Uint8ClampedArray(40000),
      width: 100,
      height: 100,
    }
    mockContext.getImageData.mockReturnValue(mockImageData)

    const result = await adapter.processImage(mockBlob, {
      enhance: { grayscale: true },
    })

    expect(result.blob).toBeDefined()
  })

  it('should apply sharpen enhancement', async () => {
    vi.spyOn(adapter, 'loadImage').mockResolvedValue(mockImage)
    const mockImageData = {
      data: new Uint8ClampedArray(40000),
      width: 100,
      height: 100,
    }
    mockContext.getImageData.mockReturnValue(mockImageData)

    const result = await adapter.processImage(mockBlob, {
      enhance: { sharpen: true },
    })

    expect(result.blob).toBeDefined()
  })

  it('should create and revoke preview URLs', () => {
    const blob = new Blob(['test'], { type: 'image/jpeg' })
    const url = adapter.createPreviewUrl(blob)
    expect(url).toContain('blob:')

    adapter.revokePreviewUrl(url)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(url)
  })
})