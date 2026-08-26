import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { liveQuery, type Subscription } from 'dexie'
import type { WorkspaceBackupStatus } from '@core/types/project.types'
import { compareWorkspaceToManualSnapshot } from '../services/workspace-snapshot.service'

export const useWorkspaceBackupStore = defineStore('workspaceBackup', () => {
  const status = ref<WorkspaceBackupStatus>('checking')
  const initialized = ref(false)
  const isBusy = ref(false)
  let subscription: Subscription | null = null

  const isDirty = computed(() => status.value === 'dirty' || status.value === 'error')

  async function refresh() {
    if (!initialized.value || isBusy.value) return
    try {
      status.value = await compareWorkspaceToManualSnapshot()
    } catch {
      status.value = 'error'
    }
  }

  async function initialize() {
    subscription?.unsubscribe()
    initialized.value = true
    status.value = 'checking'
    subscription = liveQuery(compareWorkspaceToManualSnapshot).subscribe({
      next: (nextStatus) => {
        if (!isBusy.value) status.value = nextStatus
      },
      error: () => {
        if (!isBusy.value) status.value = 'error'
      }
    })
    await refresh()
  }

  function markDirty() {
    if (!initialized.value || isBusy.value || status.value === 'no_snapshot') return
    status.value = 'dirty'
  }

  function beginSaving() {
    isBusy.value = true
    status.value = 'saving'
  }

  async function finishSaving() {
    isBusy.value = false
    await refresh()
  }

  function failSaving() {
    isBusy.value = false
    status.value = 'error'
  }

  function dispose() {
    subscription?.unsubscribe()
    subscription = null
    initialized.value = false
  }

  return {
    status,
    initialized,
    isDirty,
    initialize,
    refresh,
    markDirty,
    beginSaving,
    finishSaving,
    failSaving,
    dispose
  }
})
