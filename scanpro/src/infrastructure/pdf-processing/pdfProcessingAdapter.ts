import { PDFDocument, PDFPage, rgb, StandardFonts, degrees } from 'pdf-lib'

export interface PDFPageOperation {
  type: 'rotate' | 'delete' | 'reorder' | 'insert'
  pageIndex: number
  data?: {
    rotation?: number
    newIndex?: number
    sourceDocument?: Uint8Array
    sourcePageIndex?: number
  }
}

export interface PDFExportOptions {
  pageIndices?: number[]
  compression?: boolean
  metadata?: {
    title?: string
    author?: string
    subject?: string
    keywords?: string[]
    creator?: string
    producer?: string
  }
}

export interface PDFMergeOptions {
  documents: Uint8Array[]
  pageRanges?: Array<{ start: number; end: number }>
}

export class PDFProcessingAdapter {
  async loadDocument(data: Uint8Array): Promise<PDFDocument> {
    return PDFDocument.load(data)
  }

  async createDocument(): Promise<PDFDocument> {
    return PDFDocument.create()
  }

  async getPageCount(pdfDoc: PDFDocument): Promise<number> {
    return pdfDoc.getPageCount()
  }

  async getPage(pdfDoc: PDFDocument, index: number): Promise<PDFPage> {
    return pdfDoc.getPage(index)
  }

  async rotatePage(pdfDoc: PDFDocument, pageIndex: number, rotation: number): Promise<void> {
    const page = pdfDoc.getPage(pageIndex)
    const currentRotation = page.getRotation()
    page.setRotation(degrees(currentRotation.angle + rotation))
  }

  async deletePage(pdfDoc: PDFDocument, pageIndex: number): Promise<void> {
    pdfDoc.removePage(pageIndex)
  }

  async reorderPages(pdfDoc: PDFDocument, newOrder: number[]): Promise<void> {
    const pages = pdfDoc.getPages()
    const reorderedPages = newOrder.map((i) => pages[i])
    pdfDoc.removePage(0)
    for (const page of reorderedPages) {
      pdfDoc.addPage(page)
    }
  }

  async copyPages(
    sourcePdf: PDFDocument,
    targetPdf: PDFDocument,
    pageIndices: number[]
  ): Promise<void> {
    const copiedPages = await targetPdf.copyPages(sourcePdf, pageIndices)
    for (const page of copiedPages) {
      targetPdf.addPage(page)
    }
  }

  async mergeDocuments(options: PDFMergeOptions): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create()

    for (let i = 0; i < options.documents.length; i++) {
      const doc = await PDFDocument.load(options.documents[i])
      const pageCount = doc.getPageCount()
      const start = options.pageRanges?.[i]?.start ?? 0
      const end = options.pageRanges?.[i]?.end ?? pageCount - 1
      const indices = Array.from({ length: end - start + 1 }, (_, k) => start + k)

      const copiedPages = await mergedPdf.copyPages(doc, indices)
      for (const page of copiedPages) {
        mergedPdf.addPage(page)
      }
    }

    return mergedPdf.save()
  }

  async splitDocument(
    pdfDoc: PDFDocument,
    splitPoints: number[]
  ): Promise<Uint8Array[]> {
    const results: Uint8Array[] = []
    const pages = pdfDoc.getPages()
    let start = 0

    for (const point of splitPoints) {
      const splitPdf = await PDFDocument.create()
      const indices = Array.from({ length: point - start }, (_, i) => start + i)
      const copiedPages = await splitPdf.copyPages(pdfDoc, indices)
      for (const page of copiedPages) {
        splitPdf.addPage(page)
      }
      results.push(await splitPdf.save())
      start = point
    }

    // Last split
    if (start < pages.length) {
      const splitPdf = await PDFDocument.create()
      const indices = Array.from({ length: pages.length - start }, (_, i) => start + i)
      const copiedPages = await splitPdf.copyPages(pdfDoc, indices)
      for (const page of copiedPages) {
        splitPdf.addPage(page)
      }
      results.push(await splitPdf.save())
    }

    return results
  }

  async extractPages(
    pdfDoc: PDFDocument,
    pageIndices: number[]
  ): Promise<Uint8Array> {
    const extractedPdf = await PDFDocument.create()
    const copiedPages = await extractedPdf.copyPages(pdfDoc, pageIndices)
    for (const page of copiedPages) {
      extractedPdf.addPage(page)
    }
    return extractedPdf.save()
  }

  async addTextWatermark(
    pdfDoc: PDFDocument,
    text: string,
    options: {
      opacity?: number
      fontSize?: number
      color?: { r: number; g: number; b: number }
      rotation?: number
    } = {}
  ): Promise<void> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()

    for (const page of pages) {
      const { width, height } = page.getSize()
      page.drawText(text, {
        x: width / 2,
        y: height / 2,
        size: options.fontSize ?? 48,
        font,
        color: rgb(options.color?.r ?? 0.5, options.color?.g ?? 0.5, options.color?.b ?? 0.5),
        opacity: options.opacity ?? 0.3,
        rotate: degrees(options.rotation ?? 45),
      })
    }
  }

  async addPageNumbers(pdfDoc: PDFDocument, options: {
    startNumber?: number
    fontSize?: number
    color?: { r: number; g: number; b: number }
    position?: 'bottom-center' | 'bottom-right' | 'top-center'
  } = {}): Promise<void> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()
    const start = options.startNumber ?? 1

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]
      const { width, height } = page.getSize()
      let x = width / 2
      let y = 30

      if (options.position === 'bottom-right') {
        x = width - 50
      } else if (options.position === 'top-center') {
        y = height - 30
      }

      page.drawText(String(start + i), {
        x,
        y,
        size: options.fontSize ?? 12,
        font,
        color: rgb(options.color?.r ?? 0, options.color?.g ?? 0, options.color?.b ?? 0),
      })
    }
  }

  async setMetadata(
    pdfDoc: PDFDocument,
    metadata: PDFExportOptions['metadata']
  ): Promise<void> {
    if (metadata?.title) pdfDoc.setTitle(metadata.title)
    if (metadata?.author) pdfDoc.setAuthor(metadata.author)
    if (metadata?.subject) pdfDoc.setSubject(metadata.subject)
    if (metadata?.keywords) pdfDoc.setKeywords(metadata.keywords)
    if (metadata?.creator) pdfDoc.setCreator(metadata.creator)
    if (metadata?.producer) pdfDoc.setProducer(metadata.producer)

    pdfDoc.setCreationDate(new Date())
    pdfDoc.setModificationDate(new Date())
  }

  async saveDocument(pdfDoc: PDFDocument, options: PDFExportOptions = {}): Promise<Uint8Array> {
    if (options.metadata) {
      await this.setMetadata(pdfDoc, options.metadata)
    }
    return pdfDoc.save({ useObjectStreams: options.compression ?? true })
  }
}

export const pdfProcessingAdapter = new PDFProcessingAdapter()