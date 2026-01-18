/**
 * Image caching utilities for optimized loading
 * Uses IndexedDB for persistent storage and in-memory cache for quick access
 */

const CACHE_NAME = 'trackd-image-cache'
const CACHE_VERSION = 1
const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
const CACHE_EXPIRY_DAYS = 7

interface CachedImage {
  url: string
  data: string // base64 or blob URL
  timestamp: number
  size: number
}

class ImageCache {
  private memoryCache: Map<string, string> = new Map()
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      this.initPromise = this.initDB()
    }
  }

  private async initDB(): Promise<void> {
    // Guard against SSR
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.resolve()
    }
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_NAME, CACHE_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'url' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  private async ensureDB(): Promise<IDBDatabase | null> {
    // Return null if not in browser
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return null
    }
    
    if (this.initPromise) {
      await this.initPromise
    }
    if (!this.db) {
      throw new Error('Database not initialized')
    }
    return this.db
  }

  async get(url: string): Promise<string | null> {
    // Check memory cache first
    if (this.memoryCache.has(url)) {
      return this.memoryCache.get(url)!
    }

    // Check IndexedDB (only in browser)
    try {
      const db = await this.ensureDB()
      if (!db) return null // Not in browser environment
      
      const transaction = db.transaction(['images'], 'readonly')
      const store = transaction.objectStore('images')
      const request = store.get(url)

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const cached = request.result as CachedImage | undefined
          if (cached) {
            // Check if expired
            const age = Date.now() - cached.timestamp
            if (age > CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
              this.delete(url)
              resolve(null)
            } else {
              // Add to memory cache
              this.memoryCache.set(url, cached.data)
              resolve(cached.data)
            }
          } else {
            resolve(null)
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error reading from cache:', error)
      return null
    }
  }

  async set(url: string, data: string): Promise<void> {
    // Add to memory cache
    this.memoryCache.set(url, data)

    // Add to IndexedDB (only in browser)
    try {
      const db = await this.ensureDB()
      if (!db) return // Not in browser environment
      
      const size = new Blob([data]).size

      // Check cache size and cleanup if needed
      await this.cleanupIfNeeded(size)

      const cached: CachedImage = {
        url,
        data,
        timestamp: Date.now(),
        size,
      }

      const transaction = db.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')
      store.put(cached)

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      console.error('Error writing to cache:', error)
    }
  }

  async delete(url: string): Promise<void> {
    this.memoryCache.delete(url)

    try {
      const db = await this.ensureDB()
      if (!db) return // Not in browser environment
      
      const transaction = db.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')
      store.delete(url)

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      console.error('Error deleting from cache:', error)
    }
  }

  private async cleanupIfNeeded(newSize: number): Promise<void> {
    try {
      const db = await this.ensureDB()
      if (!db) return // Not in browser environment
      
      const transaction = db.transaction(['images'], 'readonly')
      const store = transaction.objectStore('images')
      const request = store.getAll()

      return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
          const items = request.result as CachedImage[]
          const totalSize = items.reduce((sum, item) => sum + item.size, 0)

          if (totalSize + newSize > MAX_CACHE_SIZE) {
            // Sort by timestamp (oldest first)
            items.sort((a, b) => a.timestamp - b.timestamp)

            // Delete oldest items until we have enough space
            let freedSpace = 0
            const deleteTransaction = db.transaction(['images'], 'readwrite')
            const deleteStore = deleteTransaction.objectStore('images')

            for (const item of items) {
              if (totalSize - freedSpace + newSize <= MAX_CACHE_SIZE * 0.8) {
                break
              }
              deleteStore.delete(item.url)
              this.memoryCache.delete(item.url)
              freedSpace += item.size
            }

            deleteTransaction.oncomplete = () => resolve()
            deleteTransaction.onerror = () => reject(deleteTransaction.error)
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    } catch (error) {
      console.error('Error cleaning up cache:', error)
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear()

    try {
      const db = await this.ensureDB()
      if (!db) return // Not in browser environment
      
      const transaction = db.transaction(['images'], 'readwrite')
      const store = transaction.objectStore('images')
      store.clear()

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve()
        transaction.onerror = () => reject(transaction.error)
      })
    } catch (error) {
      console.error('Error clearing cache:', error)
    }
  }
}

export const imageCache = new ImageCache()

/**
 * Fetch and cache an image with optimization
 */
export async function fetchAndCacheImage(url: string): Promise<string | null> {
  // Check cache first
  const cached = await imageCache.get(url)
  if (cached) {
    return cached
  }

  try {
    // Fetch the image
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    const blob = await response.blob()
    
    // Convert to base64 for storage
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        await imageCache.set(url, base64)
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error fetching image:', error)
    return null
  }
}

/**
 * Preload multiple images in parallel with concurrency control
 */
export async function preloadImages(
  urls: string[],
  concurrency: number = 3
): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>()
  const queue = [...urls]

  const worker = async () => {
    while (queue.length > 0) {
      const url = queue.shift()
      if (url) {
        const data = await fetchAndCacheImage(url)
        results.set(url, data)
      }
    }
  }

  // Run workers in parallel
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker())
  await Promise.all(workers)

  return results
}

