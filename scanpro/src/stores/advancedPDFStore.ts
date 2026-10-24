import { create } from 'zustand'
import {
  InspectPDFUseCase,
  AddTextAnnotationUseCase,
  AddHighlightAnnotationUseCase,
  AddInkAnnotationUseCase,
  AddTextFieldUseCase,
  AddCheckBoxUseCase,
  AddRadioGroupUseCase,
  AddDropdownUseCase,
  FlattenFormUseCase,
  RedactAreaUseCase,
  AddTextOverlayUseCase,
  AddImageOverlayUseCase,
  AddWatermarkUseCase,
  CreateBackupUseCase,
  VerifyBackupUseCase,
  PDFAdvancedEditUseCase,
} from '../../application/use-cases/AdvancedPDFUseCases'
import type { PDFCapabilityReport, PDFAnnotation, PDFFormField } from '../../infrastructure/pdf-processing/advancedPDFAdapter'

const inspectPDF = new InspectPDFUseCase()
const addTextAnnotation = new AddTextAnnotationUseCase()
const addHighlightAnnotation = new AddHighlightAnnotationUseCase()
const addInkAnnotation = new AddInkAnnotationUseCase()
const addTextField = new AddTextFieldUseCase()
const addCheckBox = new AddCheckBoxUseCase()
const addRadioGroup = new AddRadioGroupUseCase()
const addDropdown = new AddDropdownUseCase()
const flattenForm = new FlattenFormUseCase()
const redactArea = new RedactAreaUseCase()
const addTextOverlay = new AddTextOverlayUseCase()
const addImageOverlay = new AddImageOverlayUseCase()
const addWatermark = new AddWatermarkUseCase()
const createBackup = new CreateBackupUseCase()
const verifyBackup = new VerifyBackupUseCase()
const advancedEdit = new PDFAdvancedEditUseCase()

interface AdvancedPDFStoreState {
  currentDocumentId: string | null
  inspectionReport: PDFCapabilityReport | null
  annotations: Map<number, any[]>
  formFields: Map<number, any[]>
  isLoading: boolean
  isProcessing: boolean
  error: string | null

  inspectPDF: (documentId: string) => Promise<void>
  addTextAnnotation: (annotation: any) => Promise<void>
  addHighlightAnnotation: (pageIndex: number, quads: any[], color?: any, opacity?: number) => Promise<void>
  addInkAnnotation: (pageIndex: number, paths: any[], color: any, width?: number, opacity?: number) => Promise<void>
  addTextField: (field: any) => Promise<void>
  addCheckBox: (field: any) => Promise<void>
  addRadioGroup: (groupName: string, fields: any[]) => Promise<void>
  addDropdown: (field: any) => Promise<void>
  flattenForm: () => Promise<Blob | null>
  redactArea: (pageIndex: number, rect: any, color?: any) => Promise<void>
  addTextOverlay: (pageIndex: number, text: string, position: any, options?: any) => Promise<void>
  addImageOverlay: (pageIndex: number, imageData: Uint8Array, position: any, opacity?: number) => Promise<void>
  addWatermark: (text: string, options?: any) => Promise<Blob | null>
  createBackup: () => Promise<string | null>
  verifyBackup: (backupId: string) => Promise<boolean>
  advancedEdit: (operations: any[]) => Promise<Blob | null>
  setError: (error: string | null) => void
  clearError: () => void
}

export const useAdvancedPDFStore = create<AdvancedPDFStoreState>((set, get) => ({
  currentDocumentId: null,
  inspectionReport: null,
  annotations: new Map(),
  formFields: new Map(),
  isLoading: false,
  isProcessing: false,
  error: null,

  inspectPDF: async (documentId: string) => {
    set({ isLoading: true, error: null, currentDocumentId: documentId })
    try {
      const result = await inspectPDF.execute(documentId)
      if (result.success) {
        set({ inspectionReport: result.report, isLoading: false })
      } else {
        set({ isLoading: false, error: result.error })
      }
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Inspeksi gagal' })
    }
  },

  addTextAnnotation: async (annotation) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addTextAnnotation.execute(currentDocumentId, annotation)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah anotasi' })
    }
  },

  addHighlightAnnotation: async (pageIndex, quads, color, opacity) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addHighlightAnnotation.execute(currentDocumentId, pageIndex, quads, color, opacity)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah highlight' })
    }
  },

  addInkAnnotation: async (pageIndex, paths, color, width, opacity) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addInkAnnotation.execute(currentDocumentId, pageIndex, paths, color, width, opacity)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah ink' })
    }
  },

  addTextField: async (field) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addTextField.execute(currentDocumentId, field)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah text field' })
    }
  },

  addCheckBox: async (field) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addCheckBox.execute(currentDocumentId, field)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah checkbox' })
    }
  },

  addRadioGroup: async (groupName, fields) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addRadioGroup.execute(currentDocumentId, groupName, fields)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah radio group' })
    }
  },

  addDropdown: async (field) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addDropdown.execute(currentDocumentId, field)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah dropdown' })
    }
  },

  flattenForm: async () => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return null
    set({ isProcessing: true, error: null })
    try {
      const result = await flattenForm.execute(currentDocumentId)
      set({ isProcessing: false })
      return result.blob ?? null
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal flatten form' })
      return null
    }
  },

  redactArea: async (pageIndex, rect, color) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await redactArea.execute(currentDocumentId, pageIndex, rect, color)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal redact' })
    }
  },

  addTextOverlay: async (pageIndex, text, position, options) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addTextOverlay.execute(currentDocumentId, pageIndex, text, position, options)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah text overlay' })
    }
  },

  addImageOverlay: async (pageIndex, imageData, position, opacity) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return
    set({ isProcessing: true, error: null })
    try {
      await addImageOverlay.execute(currentDocumentId, pageIndex, imageData, position, opacity)
      set({ isProcessing: false })
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah image overlay' })
    }
  },

  addWatermark: async (text, options) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return null
    set({ isProcessing: true, error: null })
    try {
      const result = await addWatermark.execute(currentDocumentId, text, options)
      set({ isProcessing: false })
      return result.blob ?? null
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal menambah watermark' })
      return null
    }
  },

  createBackup: async () => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return null
    set({ isProcessing: true, error: null })
    try {
      const result = await createBackup.execute(currentDocumentId)
      set({ isProcessing: false })
      return result.backupId ?? null
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Gagal backup' })
      return null
    }
  },

  verifyBackup: async (backupId) => {
    set({ isProcessing: true, error: null })
    try {
      const result = await verifyBackup.execute(backupId)
      set({ isProcessing: false })
      return result.verified ?? false
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Verifikasi gagal' })
      return false
    }
  },

  advancedEdit: async (operations) => {
    const { currentDocumentId } = get()
    if (!currentDocumentId) return null
    set({ isProcessing: true, error: null })
    try {
      const result = await advancedEdit.execute(currentDocumentId, operations)
      set({ isProcessing: false })
      return result.blob ?? null
    } catch (error) {
      set({ isProcessing: false, error: error instanceof Error ? error.message : 'Advanced edit gagal' })
      return null
    }
  },

  setError: (error: string | null) => set({ error }),
  clearError: () => set({ error: null }),
}))