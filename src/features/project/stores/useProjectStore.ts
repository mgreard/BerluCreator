import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Project, StageSettings } from '@core/types/project.types'
import { DEFAULT_STAGE_RESOLUTION } from '@core/constants/editor'
import { projectRepository } from '@infrastructure/db/repositories/project.repository'

export const useProjectStore = defineStore('project', () => {
  const currentProject = ref<Project>({
    id: 'proj_default',
    stage: {
      width: DEFAULT_STAGE_RESOLUTION.width,
      height: DEFAULT_STAGE_RESOLUTION.height,
      backgroundColor: '#0c0d14'
    },
    editorDocumentId: 'doc_default',
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  const isSaving = ref(false)

  /** Charge l'unique espace de travail. */
  async function loadInitialProject(): Promise<Project> {
    const projects = await projectRepository.getAll()
    if (projects.length > 0) {
      currentProject.value = projects[0]
      if (!currentProject.value.editorDocumentId) {
        currentProject.value.editorDocumentId = 'doc_default'
      }
    } else {
      await projectRepository.create(currentProject.value)
    }
    return currentProject.value
  }

  async function updateStage(settings: Partial<StageSettings>) {
    currentProject.value.stage = {
      ...currentProject.value.stage,
      ...settings
    }
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

  return {
    currentProject,
    isSaving,
    loadInitialProject,
    updateStage,
    saveProject
  }
})
