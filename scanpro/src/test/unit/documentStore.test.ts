import { describe, it, expect, vi } from 'vitest'
import { documentRepository } from '../../infrastructure/database/documentRepository'
import { useDocumentStore } from '../../stores/documentStore'

vi.mock('../../infrastructure/database/documentRepository', () => ({
  documentRepository: {
    createDocument: vi.fn(),
    getDocuments: vi.fn(),
    deleteDocument: vi.fn(),
    updateDocument: vi.fn(),
  },
}))

describe('Document Store', () => {
  it('should have initial state', () => {
    const store = useDocumentStore.getState()
    expect(store.documents).toEqual([])
    expect(store.isLoading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('should set error', () => {
    useDocumentStore.setState({ error: 'Test error' })
    const store = useDocumentStore.getState()
    expect(store.error).toBe('Test error')
  })

  it('should clear error', () => {
    useDocumentStore.setState({ error: 'Test error' })
    const store = useDocumentStore.getState()
    store.clearError()
    expect(store.error).toBeNull()
  })
})
