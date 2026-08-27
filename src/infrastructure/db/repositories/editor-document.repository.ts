import { db } from '../dexie'
import type { EditorDocument } from '@core/types/editor.types'

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export class EditorDocumentRepository {
  async getById(id: string): Promise<EditorDocument | undefined> {
    return await db.editorDocuments.get(id)
  }

  async getByProjectId(projectId: string): Promise<EditorDocument[]> {
    return await db.editorDocuments.where('projectId').equals(projectId).toArray()
  }

  async save(document: EditorDocument): Promise<void> {
    await db.editorDocuments.put({
      ...toPlain(document),
      updatedAt: Date.now()
    })
  }

  async delete(id: string): Promise<void> {
    await db.editorDocuments.delete(id)
  }
}

export const editorDocumentRepository = new EditorDocumentRepository()
