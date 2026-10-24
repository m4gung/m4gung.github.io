import type { SourceAsset, DocumentPage } from '../../domain/documents'

export interface StorageAdapter {
  saveAsset: (asset: SourceAsset) => Promise<void>
  getAsset: (id: string) => Promise<SourceAsset | undefined>
  deleteAsset: (id: string) => Promise<void>
  getAssetsForDocument: (documentId: string) => Promise<SourceAsset[]>
  saveDocumentPage: (page: DocumentPage) => Promise<void>
  getDocumentPage: (id: string) => Promise<DocumentPage | undefined>
  deleteDocumentPage: (id: string) => Promise<void>
}

export class IndexedDBStorageAdapter implements StorageAdapter {
  async saveAsset(asset: SourceAsset): Promise<void> {
    // Implementation would use IndexedDB directly
    // This is a placeholder for now
  }

  async getAsset(id: string): Promise<SourceAsset | undefined> {
    // Implementation would use IndexedDB directly
    return undefined
  }

  async deleteAsset(id: string): Promise<void> {
    // Implementation would use IndexedDB directly
  }

  async getAssetsForDocument(documentId: string): Promise<SourceAsset[]> {
    // Implementation would use IndexedDB directly
    return []
  }

  async saveDocumentPage(page: DocumentPage): Promise<void> {
    // Implementation would use IndexedDB directly
  }

  async getDocumentPage(id: string): Promise<DocumentPage | undefined> {
    // Implementation would use IndexedDB directly
    return undefined
  }

  async deleteDocumentPage(id: string): Promise<void> {
    // Implementation would use IndexedDB directly
  }
}

export const storageAdapter = new IndexedDBStorageAdapter()
