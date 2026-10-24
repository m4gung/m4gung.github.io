export interface Point {
  x: number
  y: number
}

export interface PerspectivePoints {
  topLeft: Point
  topRight: Point
  bottomRight: Point
  bottomLeft: Point
}

export interface ImageProcessingOptions {
  crop?: {
    x: number
    y: number
    width: number
    height: number
  }
  rotation?: number
  perspective?: PerspectivePoints
  enhance?: {
    contrast?: number
    brightness?: number
    sharpen?: boolean
    grayscale?: boolean
  }
}

export interface ProcessedImageResult {
  blob: Blob
  width: number
  height: number
  dataUrl: string
}

export class ImageProcessingAdapter {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  async loadImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(blob)
    })
  }

  async processImage(
    blob: Blob,
    options: ImageProcessingOptions
  ): Promise<ProcessedImageResult> {
    const img = await this.loadImage(blob)

    let { width, height } = img
    let sourcePoints: PerspectivePoints | null = null

    if (options.perspective) {
      sourcePoints = options.perspective
      const destWidth = Math.max(
        this.distance(sourcePoints.topLeft, sourcePoints.topRight),
        this.distance(sourcePoints.bottomLeft, sourcePoints.bottomRight)
      )
      const destHeight = Math.max(
        this.distance(sourcePoints.topLeft, sourcePoints.bottomLeft),
        this.distance(sourcePoints.topRight, sourcePoints.bottomRight)
      )
      width = Math.round(destWidth)
      height = Math.round(destHeight)
    }

    if (options.crop) {
      width = Math.round(options.crop.width)
      height = Math.round(options.crop.height)
    }

    this.canvas.width = width
    this.canvas.height = height
    this.ctx.clearRect(0, 0, width, height)

    this.ctx.save()

    if (sourcePoints) {
      const matrix = this.getPerspectiveTransform(
        sourcePoints,
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: height },
        { x: 0, y: height }
      )
      this.ctx.transform(
        matrix[0], matrix[1], matrix[3], matrix[4], matrix[6], matrix[7]
      )
    } else if (options.crop) {
      this.ctx.translate(-options.crop.x, -options.crop.y)
    }

    if (options.rotation) {
      const rad = (options.rotation * Math.PI) / 180
      this.ctx.translate(width / 2, height / 2)
      this.ctx.rotate(rad)
      this.ctx.translate(-width / 2, -height / 2)
    }

    this.ctx.drawImage(img, 0, 0, img.width, img.height)

    if (options.enhance) {
      this.applyEnhancement(options.enhance)
    }

    this.ctx.restore()

    const dataUrl = this.canvas.toDataURL('image/jpeg', 0.9)
    const processedBlob = await this.dataUrlToBlob(dataUrl)

    return {
      blob: processedBlob,
      width,
      height,
      dataUrl,
    }
  }

  private applyEnhancement(enhance: NonNullable<ImageProcessingOptions['enhance']>): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const data = imageData.data

    const contrast = enhance.contrast ?? 1
    const brightness = enhance.brightness ?? 0

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        let val = data[i + c]
        val = (val - 128) * contrast + 128 + brightness * 255
        data[i + c] = Math.max(0, Math.min(255, val))
      }
    }

    if (enhance.grayscale) {
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        data[i] = data[i + 1] = data[i + 2] = gray
      }
    }

    if (enhance.sharpen) {
      const sharpened = this.applySharpenFilter(data, this.canvas.width, this.canvas.height)
      for (let i = 0; i < data.length; i++) {
        data[i] = sharpened[i]
      }
    }

    this.ctx.putImageData(imageData, 0, 0)
  }

  private applySharpenFilter(data: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
    const result = new Uint8ClampedArray(data.length)
    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0]

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c
              sum += data[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
            }
          }
          result[(y * width + x) * 4 + c] = Math.max(0, Math.min(255, sum))
        }
        result[(y * width + x) * 4 + 3] = data[(y * width + x) * 4 + 3]
      }
    }

    return result
  }

  private distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2)
  }

  private getPerspectiveTransform(
    src: PerspectivePoints,
    dstTL: Point, dstTR: Point, dstBR: Point, dstBL: Point
  ): number[] {
    const srcPts = [src.topLeft, src.topRight, src.bottomRight, src.bottomLeft]
    const dstPts = [dstTL, dstTR, dstBR, dstBL]

    const A = []
    const B = []

    for (let i = 0; i < 4; i++) {
      const [sx, sy] = [srcPts[i].x, srcPts[i].y]
      const [dx, dy] = [dstPts[i].x, dstPts[i].y]

      A.push([sx, sy, 1, 0, 0, 0, -dx * sx, -dx * sy])
      A.push([0, 0, 0, sx, sy, 1, -dy * sx, -dy * sy])
      B.push(dx, dy)
    }

    const h = this.solveLinearSystem(A, B)
    return [...h, 1]
  }

  private solveLinearSystem(A: number[][], B: number[]): number[] {
    const n = A[0].length
    const M = A.map((row, i) => [...row, B[i]])

    for (let col = 0; col < n; col++) {
      let pivot = col
      for (let row = col + 1; row < n; row++) {
        if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) {
          pivot = row
        }
      }
      if (Math.abs(M[pivot][col]) < 1e-10) continue
      if (pivot !== col) {
        ;[M[pivot], M[col]] = [M[col], M[pivot]]
      }

      const pivotVal = M[col][col]
      for (let j = col; j <= n; j++) {
        M[col][j] /= pivotVal
      }

      for (let row = 0; row < n; row++) {
        if (row !== col) {
          const factor = M[row][col]
          for (let j = col; j <= n; j++) {
            M[row][j] -= factor * M[col][j]
          }
        }
      }
    }

    return M.map((row) => row[n])
  }

  private dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return fetch(dataUrl).then((res) => res.blob())
  }

  createPreviewUrl(blob: Blob): string {
    return URL.createObjectURL(blob)
  }

  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
  }
}

export const imageProcessingAdapter = new ImageProcessingAdapter()