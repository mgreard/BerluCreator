import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EditorDocument, ViewportSnapshot } from '@core/types/editor.types'
import { viewportSnapshotRepository } from '@infrastructure/db/repositories/viewport-snapshot.repository'
import { generateId } from '@/lib/utils'

export const useViewportSnapshotStore = defineStore('viewportSnapshots', () => {
  const snapshots = ref<ViewportSnapshot[]>([])
  const isLoading = ref(false)

  async function loadSnapshots(): Promise<ViewportSnapshot[]> {
    isLoading.value = true
    try {
      snapshots.value = await viewportSnapshotRepository.getAll()
      return snapshots.value
    } finally {
      isLoading.value = false
    }
  }

  async function createSnapshot(
    document: EditorDocument,
    name: string,
    thumbnailDataUrl: string
  ): Promise<ViewportSnapshot> {
    const now = Date.now()
    const snapshot: ViewportSnapshot = {
      id: generateId('snap'),
      name: name.trim() || `Vue ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      thumbnailDataUrl,
      camera: { ...document.camera },
      character: { ...(document.character || { x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0, visible: true, zIndex: 10 }) },
      groups: JSON.parse(JSON.stringify(document.groups || [])),
      layers: JSON.parse(JSON.stringify(document.layers)),
      createdAt: now,
      updatedAt: now
    }

    await viewportSnapshotRepository.create(snapshot)
    snapshots.value.unshift(snapshot)
    return snapshot
  }

  async function deleteSnapshot(id: string): Promise<void> {
    await viewportSnapshotRepository.delete(id)
    snapshots.value = snapshots.value.filter((snap) => snap.id !== id)
  }

  return {
    snapshots,
    isLoading,
    loadSnapshots,
    createSnapshot,
    deleteSnapshot
  }
})
