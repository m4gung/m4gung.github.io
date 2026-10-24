import { db } from '../database/database'
import type {
  ScanProDocument,
  ScanProDocumentPage,
  ScanProFolder,
  ScanProAppSettings,
  ScanProDocumentVersion,
  ScanProProcessingJob,
} from '../database/database'

export interface DocumentQueryOptions {
  page?: number
  pageSize?: number
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'accessedAt' | 'size'
  sortOrder?: 'asc' | 'desc'
  status?: 'active' | 'archived' | 'deleted'
  folderId?: string
}

export interface DocumentQueryResult {
  documents: ScanProDocument[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export class DocumentRepository {
  async createDocument(
    data: Omit<ScanProDocument, 'id' | 'version' | 'metadata'>
  ): Promise<ScanProDocument> {
    const now = new Date()
    const document: ScanProDocument = {
      ...data,
      id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      version: 1,
      metadata: {
        createdAt: now,
        updatedAt: now,
        accessCount: 0,
      },
    }
    await db.documents.add(document)
    return document
  }

  async getDocument(id: string): Promise<ScanProDocument | undefined> {
    return db.documents.get(id)
  }

  async getDocuments(options: DocumentQueryOptions = {}): Promise<DocumentQueryResult> {
    const page = options.page ?? 1
    const pageSize = options.pageSize ?? 20
    const sortBy = options.sortBy ?? 'updatedAt'
    const sortOrder = options.sortOrder ?? 'desc'
    const status = options.status ?? 'active'
    const folderId = options.folderId

    let documents: ScanProDocument[] = await db.documents
      .where('status')
      .equals(status)
      .toArray()

    if (folderId) {
      documents = documents.filter((d) => d.folderId === folderId)
    }

    documents.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'createdAt':
          comparison = a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime()
          break
        case 'updatedAt':
          comparison = a.metadata.updatedAt.getTime() - b.metadata.updatedAt.getTime()
          break
        case 'accessedAt':
          comparison =
            (a.metadata.lastAccessedAt?.getTime() ?? 0) -
            (b.metadata.lastAccessedAt?.getTime() ?? 0)
          break
        case 'size':
          comparison = (a.pages.length * 1024) - (b.pages.length * 1024)
          break
        default:
          comparison = 0
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    const total = documents.length
    const start = (page - 1) * pageSize
    const paginated = documents.slice(start, start + pageSize)

    return {
      documents: paginated,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
    }
  }

  async updateDocument(
    id: string,
    updates: Partial<Omit<ScanProDocument, 'id' | 'version' | 'metadata'>>
  ): Promise<ScanProDocument | undefined> {
    const now = new Date()
    const existing = await this.getDocument(id)
    if (!existing) {
      return undefined
    }

    const updated: ScanProDocument = {
      ...existing,
      ...updates,
      version: existing.version + 1,
      metadata: {
        ...existing.metadata,
        updatedAt: now,
      },
    }

    await db.documents.put(updated)
    return updated
  }

  async updateDocumentMetadata(
    id: string,
    metadataUpdates: Partial<ScanProDocument['metadata']>
  ): Promise<ScanProDocument | undefined> {
    const existing = await this.getDocument(id)
    if (!existing) {
      return undefined
    }

    const updated: ScanProDocument = {
      ...existing,
      metadata: {
        ...existing.metadata,
        ...metadataUpdates,
        updatedAt: new Date(),
      },
    }

    await db.documents.put(updated)
    return updated
  }

  async deleteDocument(id: string, permanent = false): Promise<boolean> {
    const existing = await this.getDocument(id)
    if (!existing) {
      return false
    }

    if (permanent) {
      await db.documents.delete(id)
      return true
    }

    const updated: ScanProDocument = {
      ...existing,
      status: 'deleted',
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
      },
    }

    await db.documents.put(updated)
    return true
  }

  async createFolder(
    data: Omit<ScanProFolder, 'id' | 'documentCount' | 'metadata'>
  ): Promise<ScanProFolder> {
    const now = new Date()
    const folder: ScanProFolder = {
      ...data,
      id: `folder_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      documentCount: 0,
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    }
    await db.folders.add(folder)
    return folder
  }

  async getFolders(): Promise<ScanProFolder[]> {
    const folders = await db.folders.toArray()
    return folders.sort((a, b) => a.name.localeCompare(b.name))
  }

  async getFolder(id: string): Promise<ScanProFolder | undefined> {
    return db.folders.get(id)
  }

  async updateFolder(
    id: string,
    updates: Partial<Omit<ScanProFolder, 'id' | 'documentCount' | 'metadata'>>
  ): Promise<ScanProFolder | undefined> {
    const existing = await this.getFolder(id)
    if (!existing) {
      return undefined
    }

    const updated: ScanProFolder = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
      },
    }

    await db.folders.put(updated)
    return updated
  }

  async deleteFolder(id: string): Promise<boolean> {
    const existing = await this.getFolder(id)
    if (!existing) {
      return false
    }

    const updated: ScanProFolder = {
      ...existing,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
      },
    }

    await db.folders.put(updated)
    return true
  }

  async getSettings(): Promise<ScanProAppSettings | undefined> {
    const settings = await db.settings.toArray()
    return settings[0]
  }

  async updateSettings(updates: Partial<ScanProAppSettings>): Promise<ScanProAppSettings | undefined> {
    const existing = await this.getSettings()
    if (!existing) {
      return undefined
    }

    const updated: ScanProAppSettings = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date(),
      },
    }

    await db.settings.put(updated)
    return updated
  }

  async createDocumentVersion(
    data: Omit<ScanProDocumentVersion, 'id' | 'createdAt'>
  ): Promise<ScanProDocumentVersion> {
    const version: ScanProDocumentVersion = {
      ...data,
      id: `version_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      createdAt: new Date(),
    }
    await db.versions.add(version)
    return version
  }

  async getDocumentVersions(documentId: string): Promise<ScanProDocumentVersion[]> {
    const versions = await db.versions
      .where('documentId')
      .equals(documentId)
      .toArray()
    return versions.sort((a, b) => b.version - a.version)
  }

  async getProcessingJobs(): Promise<ScanProProcessingJob[]> {
    const documents = await db.documents.toArray()
    const allJobs: ScanProProcessingJob[] = []
    for (const doc of documents) {
      if (doc.processingJobs) {
        allJobs.push(...doc.processingJobs)
      }
    }
    return allJobs
  }

  async addProcessingJob(
    job: Omit<ScanProProcessingJob, 'id' | 'createdAt' | 'retries' | 'status'>
  ): Promise<ScanProProcessingJob> {
    const processingJob: ScanProProcessingJob = {
      ...job,
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      createdAt: new Date(),
      retries: 0,
      status: 'pending',
    }
    const documents = await db.documents.toArray()
    const doc = documents[0]
    if (doc?.processingJobs) {
      doc.processingJobs.push(processingJob)
      await db.documents.put(doc)
    }
    return processingJob
  }

  async updateProcessingJob(jobId: string, updates: Partial<ScanProProcessingJob>): Promise<void> {
    const documents = await db.documents.toArray()
    const doc = documents.find((d) => d.processingJobs?.some((j) => j.id === jobId))
    if (doc?.processingJobs) {
      const jobIndex = doc.processingJobs.findIndex((j) => j.id === jobId)
      if (jobIndex >= 0) {
        doc.processingJobs[jobIndex] = { ...doc.processingJobs[jobIndex], ...updates }
        await db.documents.put(doc)
      }
    }
  }
}

export const documentRepository = new DocumentRepository()
