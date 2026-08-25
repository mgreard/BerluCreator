import { describe, it, expect, beforeEach } from 'vitest'
import { BlobUrlCacheService } from './blob-cache.service'

describe('BlobUrlCacheService', () => {
  let cacheService: BlobUrlCacheService

  beforeEach(() => {
    cacheService = new BlobUrlCacheService()
  })

  it('should acquire and cache an ObjectURL with ref count tracking', async () => {
    const dummyBlob = new Blob(['test-png-data'], { type: 'image/png' })
    const url1 = await cacheService.acquire('blob_123', dummyBlob)

    expect(url1).toBeDefined()
    expect(cacheService.size).toBe(1)

    // Deuxième acquisition pour le même blob
    const url2 = await cacheService.acquire('blob_123')
    expect(url2).toBe(url1)
    expect(cacheService.size).toBe(1)
  })

  it('should clear all cached entries on clear()', async () => {
    const dummyBlob = new Blob(['data'], { type: 'image/png' })
    await cacheService.acquire('blob_1', dummyBlob)
    await cacheService.acquire('blob_2', dummyBlob)

    expect(cacheService.size).toBe(2)
    cacheService.clear()
    expect(cacheService.size).toBe(0)
  })
})
