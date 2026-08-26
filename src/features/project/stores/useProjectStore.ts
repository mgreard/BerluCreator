import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project, StageSettings } from '@core/types/project.types'
import { DEFAULT_STAGE_RESOLUTION } from '@core/constants/timeline'
import { projectRepository } from '@infrastructure/db/repositories/project.repository'
import { generateId } from '@/lib/utils'

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project>({
    id: 'proj_default',
    name: 'Studio JT 20H - BerluCreator',
    description: 'Scène de plateau télévisé avec présentateur stop-motion',
    stage: {
      width: DEFAULT_STAGE_RESOLUTION.width,
      height: DEFAULT_STAGE_RESOLUTION.height,
      backgroundColor: '#0c0d14'
    },
    activeSequenceId: 'seq_default',
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  const isSaving = ref(false)

  async function loadInitialProject(): Promise<Project> {
    const projects = await projectRepository.getAll()
    if (projects.length > 0) {
      currentProject.value = projects[0]
    } else {
      await projectRepository.create(currentProject.value)
    }
    return currentProject.value
  }

  async function loadProject(projectId: string): Promise<Project> {
    const project = await projectRepository.getById(projectId)
    if (!project) throw new Error('Le projet sauvegardé est introuvable.')
    currentProject.value = project
    return project
  }

  async function updateStage(settings: Partial<StageSettings>) {
    currentProject.value.stage = {
      ...currentProject.value.stage,
      ...settings
    }
    await saveProject()
  }

  async function updateProjectMeta(name: string, description?: string) {
    currentProject.value.name = name
    if (description !== undefined) currentProject.value.description = description
    await saveProject()
  }

  async function saveProject() {
    isSaving.value = true
    try {
      await projectRepository.update(currentProject.value.id, currentProject.value)
    } finally {
      isSaving.value = false
    }
  }

  async function createNewProject(name: string): Promise<Project> {
    const newProj: Project = {
      id: generateId('proj'),
      name,
      stage: {
        width: DEFAULT_STAGE_RESOLUTION.width,
        height: DEFAULT_STAGE_RESOLUTION.height,
        backgroundColor: '#0c0d14'
      },
      activeSequenceId: generateId('seq'),
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await projectRepository.create(newProj)
    currentProject.value = newProj
    return newProj
  }

  return {
    currentProject,
    isSaving,
    loadInitialProject,
    loadProject,
    updateStage,
    updateProjectMeta,
    saveProject,
    createNewProject
  }
})
