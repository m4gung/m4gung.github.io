export interface CameraDevice {
  deviceId: string
  label: string
  kind: 'videoinput'
  groupId: string
}

export interface CameraConstraints {
  facingMode?: 'user' | 'environment'
  width?: { ideal: number; max: number }
  height?: { ideal: number; max: number }
  frameRate?: { ideal: number; max: number }
}

export interface CameraStream {
  stream: MediaStream
  device: CameraDevice
  constraints: CameraConstraints
}

export interface ICameraAdapter {
  enumerateDevices(): Promise<CameraDevice[]>
  requestPermission(): Promise<boolean>
  startStream(constraints?: CameraConstraints): Promise<CameraStream>
  stopStream(): Promise<void>
  captureFrame(): Promise<Blob | null>
  getCurrentStream(): MediaStream | null
  isStreaming(): boolean
}

export class BrowserCameraAdapter implements ICameraAdapter {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private currentDevice: CameraDevice | null = null

  async enumerateDevices(): Promise<CameraDevice[]> {
    try {
      await navigator.mediaDevices.getUserMedia({ video: true })
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices
        .filter((d) => d.kind === 'videoinput')
        .map((d) => ({
          deviceId: d.deviceId,
          label: d.label || `Camera ${d.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const,
          groupId: d.groupId,
        }))
    } catch {
      return []
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
      return true
    } catch {
      return false
    }
  }

  async startStream(constraints: CameraConstraints = {}): Promise<CameraStream> {
    this.stopStream()

    const videoConstraints: MediaTrackConstraints = {
      facingMode: constraints.facingMode || 'environment',
      width: { ideal: constraints.width?.ideal || 1920, max: constraints.width?.max || 4096 },
      height: { ideal: constraints.height?.ideal || 1080, max: constraints.height?.max || 4096 },
      frameRate: { ideal: constraints.frameRate?.ideal || 30, max: constraints.frameRate?.max || 60 },
    }

    const stream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
    this.stream = stream

    const devices = await this.enumerateDevices()
    this.currentDevice = devices.find((d) => d.label.includes('back') || d.label.includes('environment')) || devices[0] || null

    return {
      stream,
      device: this.currentDevice!,
      constraints,
    }
  }

  async stopStream(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null
      this.videoElement = null
    }
  }

  async captureFrame(): Promise<Blob | null> {
    if (!this.stream || !this.videoElement) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = this.videoElement.videoWidth
    canvas.height = this.videoElement.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    ctx.drawImage(this.videoElement, 0, 0)
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9)
    })
  }

  getCurrentStream(): MediaStream | null {
    return this.stream
  }

  isStreaming(): boolean {
    return this.stream !== null && this.stream.active
  }

  setVideoElement(video: HTMLVideoElement): void {
    this.videoElement = video
    if (this.stream) {
      video.srcObject = this.stream
      video.play().catch(() => {})
    }
  }
}

export const cameraAdapter = new BrowserCameraAdapter()