import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserCameraAdapter } from '../../infrastructure/camera/cameraAdapter'

describe('BrowserCameraAdapter', () => {
  let adapter: BrowserCameraAdapter
  let mockStream: MediaStream
  let mockVideoTrack: MediaStreamTrack

  beforeEach(() => {
    adapter = new BrowserCameraAdapter()
    mockVideoTrack = {
      stop: vi.fn(),
      kind: 'video',
      enabled: true,
      readyState: 'live',
      getSettings: vi.fn(),
      getCapabilities: vi.fn(),
      applyConstraints: vi.fn(),
      clone: vi.fn(),
    } as unknown as MediaStreamTrack

    mockStream = {
      getTracks: vi.fn(() => [mockVideoTrack]),
      getVideoTracks: vi.fn(() => [mockVideoTrack]),
      getAudioTracks: vi.fn(() => []),
    } as unknown as MediaStream

    vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockResolvedValue(mockStream)
    vi.spyOn(navigator.mediaDevices, 'enumerateDevices').mockResolvedValue([
      { deviceId: 'cam1', kind: 'videoinput', label: 'Back Camera', groupId: 'g1' },
      { deviceId: 'cam2', kind: 'videoinput', label: 'Front Camera', groupId: 'g2' },
    ] as MediaDeviceInfo[])
  })

  it('should enumerate video devices', async () => {
    const devices = await adapter.enumerateDevices()
    expect(devices).toHaveLength(2)
    expect(devices[0].label).toBe('Back Camera')
  })

  it('should request permission successfully', async () => {
    const result = await adapter.requestPermission()
    expect(result).toBe(true)
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ video: true })
  })

  it('should start stream with constraints', async () => {
    const result = await adapter.startStream({ facingMode: 'environment' })
    expect(result.stream).toBe(mockStream)
    expect(result.device).toBeDefined()
  })

  it('should stop stream and clean up', async () => {
    await adapter.startStream()
    await adapter.stopStream()
    expect(mockVideoTrack.stop).toHaveBeenCalled()
  })

  it('should capture frame when streaming', async () => {
    await adapter.startStream()
    const mockBlob = new Blob(['frame'], { type: 'image/jpeg' })

    const mockCanvas = {
      width: 1920,
      height: 1080,
      getContext: vi.fn(() => ({
        drawImage: vi.fn(),
      })),
      toBlob: vi.fn((cb) => cb(mockBlob)),
    }

    const mockVideo = {
      videoWidth: 1920,
      videoHeight: 1080,
      play: vi.fn(),
    } as unknown as HTMLVideoElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement)
    adapter.setVideoElement(mockVideo)

    const blob = await adapter.captureFrame()
    expect(blob).toBe(mockBlob)
  })

  it('should return null when not streaming', async () => {
    const blob = await adapter.captureFrame()
    expect(blob).toBeNull()
  })
})