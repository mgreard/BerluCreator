import { db } from '../db/dexie'
import type { Project } from '@core/types/project.types'

export class ProjectRepository {
  async getAll(): Promise<Project[]> {
    return await db.projects.toArray()
  }

  async getById(id: string): Promise<Project | undefined> {
    return await db.projects.get(id)
  }

  async create(project: Project): Promise<void> {
    await db.projects.put(project)
  }

  async update(id: string, changes: Partial<Project>): Promise<void> {
    await db.projects.update(id, {
      ...changes,
      updatedAt: Date.now()
    })
  }

  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.projects, db.sequences], async () => {
      await db.projects.delete(id)
      await db.sequences.where('projectId').equals(id).delete()
    })
  }
}

export const projectRepository = new ProjectRepository()
