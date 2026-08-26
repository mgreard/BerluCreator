import { db } from '../dexie'
import type { Project } from '@core/types/project.types'

function toPlain<T>(data: T): T {
  return JSON.parse(JSON.stringify(data))
}

export class ProjectRepository {
  async getAll(): Promise<Project[]> {
    return await db.projects.toArray()
  }

  async create(project: Project): Promise<void> {
    await db.projects.put(toPlain(project))
  }

  async update(id: string, changes: Partial<Project>): Promise<void> {
    await db.projects.update(id, {
      ...toPlain(changes),
      updatedAt: Date.now()
    })
  }

}

export const projectRepository = new ProjectRepository()
