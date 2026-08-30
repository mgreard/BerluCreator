import { db } from '../db/dexie'

interface CacheEntry {
  url: string
  refCount: number
  timerId?: ReturnType<typeof setTimeout>
}

export interface BlobCacheDiagnostics {
  entries: number
  activeReferences: number
  pendingRevocations: number
}

export class BlobUrlCacheService {
  private cache = new Map<string, CacheEntry>()
  private readonly REVOCATION_DELAY_MS = 2000 // Révocation différée pour éviter le clignotement

  /**
   * Obtient ou génère une URL Blob pour un asset donné et incrémente son compteur de références.
   */
  async acquire(blobId: string, directBlob?: Blob): Promise<string> {
    const existing = this.cache.get(blobId)

    if (existing) {
      if (existing.timerId) {
        clearTimeout(existing.timerId)
        existing.timerId = undefined
      }
      existing.refCount++
      return existing.url
    }

    let blob = directBlob
    if (!blob) {
      const record = await db.assetBlobs.get(blobId)
      if (!record) {
        throw new Error(`Blob avec l'identifiant ${blobId} introuvable en base.`)
      }
      blob = record.data
    }

    const url = URL.createObjectURL(blob)
    this.cache.set(blobId, {
      url,
      refCount: 1
    })

    return url
  }

  /**
   * Retourne l'URL actuellement en cache si elle existe sans modifier les références.
   */
  getImmediateUrl(blobId: string): string | null {
    return this.cache.get(blobId)?.url ?? null
  }

  /**
   * Notifie que l'URL n'est plus utilisée par un composant.
   * Révocation automatique quand refCount atteint 0.
   */
  release(blobId: string): void {
    const entry = this.cache.get(blobId)
    if (!entry) return

    entry.refCount = Math.max(0, entry.refCount - 1)

    if (entry.refCount === 0 && !entry.timerId) {
      entry.timerId = setTimeout(() => {
        const currentEntry = this.cache.get(blobId)
        if (currentEntry && currentEntry.refCount === 0) {
          URL.revokeObjectURL(currentEntry.url)
          this.cache.delete(blobId)
        }
      }, this.REVOCATION_DELAY_MS)
    }
  }

  /**
   * Révocation totale de toutes les URLs actives (nettoyage global).
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      if (entry.timerId) clearTimeout(entry.timerId)
      URL.revokeObjectURL(entry.url)
    }
    this.cache.clear()
  }

  /**
   * Taille actuelle du cache (pour diagnostics & tests).
   */
  get size(): number {
    return this.cache.size
  }

  get diagnostics(): Readonly<BlobCacheDiagnostics> {
    let activeReferences = 0
    let pendingRevocations = 0
    for (const entry of this.cache.values()) {
      activeReferences += entry.refCount
      if (entry.timerId) pendingRevocations += 1
    }
    return Object.freeze({ entries: this.cache.size, activeReferences, pendingRevocations })
  }
}

export const blobCacheService = new BlobUrlCacheService()
