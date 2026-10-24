import { create } from 'zustand'
import { documentRepository } from '../infrastructure/database/documentRepository'
import type { ScanProDocument } from '../infrastructure/database/database'

interface DocumentStoreState {
  documents: ScanProDocument[]
  isLoading: boolean
  error: string | null
  selectedDocumentId: string | null
  currentFolderId: string | null
  queryOptions: {
    page: number
    pageSize: number
    sortBy: 'name' | 'createdAt' | 'updatedAt' | 'accessedAt' | 'size'
    sortOrder: 'asc' | 'desc'
    status: 'active' | 'archived' | 'deleted'
    folderId: string | null
  }
  loadDocuments: (options?: any) => Promise<void>
  setSelectedDocument: (id: string | null) => void
  setCurrentFolder: (id: string | null) => void
  setQueryOptions: (options: Partial<any>) => void
  createDocument: (data: any) => Promise<ScanProDocument>
  updateDocument: (id: string, updates: any) => Promise<void>
  deleteDocument: (id: string, permanent?: boolean) => Promise<void>
  clearError: () => void
}

export const useDocumentStore = create<DocumentStoreState>((set, get) => ({
  documents: [],
  isLoading: false,
  error: null,
  selectedDocumentId: null,
  currentFolderId: null,
  queryOptions: {
    page: 1,
    pageSize: 20,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    status: 'active',
    folderId: null,
  },
  loadDocuments: async (options = {}) => {
    set({ isLoading: true, error: null })
    try {
      const queryOptions = {
        page: options.page ?? get().queryOptions.page,
        pageSize: options.pageSize ?? get().queryOptions.pageSize,
        sortBy: options.sortBy ?? get().queryOptions.sortBy,
        sortOrder: options.sortOrder ?? get().queryOptions.sortOrder,
        status: options.status ?? get().queryOptions.status,
        folderId: options.folderId ?? get().queryOptions.folderId,
      }
      const result = await documentRepository.getDocuments(queryOptions)
      set({ documents: result.documents, isLoading: false })
    } catch (error) {
      set({ isLoading: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  },
  setSelectedDocument: (id: string | null) => {
    set({ selectedDocumentId: id })
  },
  setCurrentFolder: (id: string | null) => {
    set({ currentFolderId: id, queryOptions: { ...get().queryOptions, folderId: id, page: 1 } })
  },
  setQueryOptions: (options: Partial<any>) => {
    set({ queryOptions: { ...get().queryOptions, ...options } })
  },
  createDocument: async (data) => {
    const result = await documentRepository.createDocument(data)
    await get().loadDocuments()
    return result
  },
  updateDocument: async (id, updates) => {
    await documentRepository.updateDocument(id, updates)
    await get().loadDocuments()
  },
  deleteDocument: async (id, permanent) => {
    await documentRepository.deleteDocument(id, permanent)
    await get().loadDocuments()
  },
  clearError: () => {
    set({ error: null })
  },
}))
