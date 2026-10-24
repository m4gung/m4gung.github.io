import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

export interface PDFPageMetadata {
  pageNumber: number
  width: number
  height: number
  rotation: number
  viewport: {
    width: number
    height: number
  }
  textContent?: {
    items: Array<{
      str: string
      transform: number[]
      width: number
      height: number
      fontName: string
    }>
  }
}

export interface PDFDocumentInfo {
  numPages: number
  fingerprints?: string[]
  metadata?: {
    info?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }
}

export class PDFRenderingAdapter {
  private pdfDocument: pdfjsLib.PDFDocumentProxy | null = null

  async loadDocument(data: ArrayBuffer | Uint8Array | string): Promise<PDFDocumentInfo> {
    const loadingTask = pdfjsLib.getDocument({ data })
    this.pdfDocument = await loadingTask.promise

    return {
      numPages: this.pdfDocument.numPages,
      fingerprints: this.pdfDocument.fingerprints,
      metadata: {
        info: (await this.pdfDocument.getMetadata()).info as Record<string, unknown>,
        metadata: (await this.pdfDocument.getMetadata()).metadata as unknown as Record<string, unknown>,
      },
    }
  }

  async getPage(pageNumber: number): Promise<{
    page: pdfjsLib.PDFPageProxy
    metadata: PDFPageMetadata
  } | null> {
    if (!this.pdfDocument) return null

    const page = await this.pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale: 1 })

    const metadata: PDFPageMetadata = {
      pageNumber,
      width: viewport.width,
      height: viewport.height,
      rotation: page.rotate,
      viewport: {
        width: viewport.width,
        height: viewport.height,
      },
    }

    return { page, metadata }
  }

  async renderPageToCanvas(
    pageNumber: number,
    canvas: HTMLCanvasElement,
    scale = 1,
    rotation = 0
  ): Promise<void> {
    if (!this.pdfDocument) return

    const page = await this.pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale, rotation })

    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    await page.render({
      canvasContext: ctx,
      viewport,
      canvas,
    } as any).promise
  }

  async getPageTextContent(pageNumber: number): Promise<PDFPageMetadata['textContent']> {
    if (!this.pdfDocument) return undefined

    const page = await this.pdfDocument.getPage(pageNumber)
    const textContent = await page.getTextContent()

    return {
      items: textContent.items.map((item: any) => ({
        str: item.str,
        transform: item.transform,
        width: item.width,
        height: item.height,
        fontName: item.fontName,
      })),
    }
  }

  async getAllPagesMetadata(): Promise<PDFPageMetadata[]> {
    if (!this.pdfDocument) return []

    const pages: PDFPageMetadata[] = []
    for (let i = 1; i <= this.pdfDocument.numPages; i++) {
      const page = await this.pdfDocument.getPage(i)
      const viewport = page.getViewport({ scale: 1 })
      pages.push({
        pageNumber: i,
        width: viewport.width,
        height: viewport.height,
        rotation: page.rotate,
        viewport: { width: viewport.width, height: viewport.height },
      })
    }
    return pages
  }

  getNumPages(): number {
    return this.pdfDocument?.numPages ?? 0
  }

  destroy(): void {
    if (this.pdfDocument) {
      if (typeof (this.pdfDocument as any).destroy === 'function') {
        (this.pdfDocument as any).destroy()
      }
      this.pdfDocument = null
    }
  }
}

export class PDFThumbnailGenerator {
  static async generateThumbnail(
    data: ArrayBuffer | Uint8Array,
    pageNumber: number,
    maxDimension = 200
  ): Promise<string> {
    const loadingTask = pdfjsLib.getDocument({ data })
    const pdf = await loadingTask.promise
    const page = await pdf.getPage(pageNumber)

    const viewport = page.getViewport({ scale: 1 })
    const scale = Math.min(maxDimension / viewport.width, maxDimension / viewport.height)

    const canvas = document.createElement('canvas')
    const scaledViewport = page.getViewport({ scale })
    canvas.width = scaledViewport.width
    canvas.height = scaledViewport.height

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas context not available')

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
      canvas,
    } as any).promise

    return canvas.toDataURL('image/jpeg', 0.7)
  }
}

export const pdfRenderingAdapter = new PDFRenderingAdapter()