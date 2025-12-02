/**
 * Image upload utilities
 * For now, handles base64 encoding. In production, this should upload to a CDN like Cloudinary
 */

export interface ImageUploadOptions {
  maxSize?: number // in bytes
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0-1
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
}

/**
 * Resize and compress an image
 */
export async function resizeImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width
        let height = img.height

        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        // Create canvas and resize
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', opts.quality)
        resolve(base64)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 */
export function validateImageFile(file: File, options: ImageUploadOptions = {}): string | null {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  if (!file.type.startsWith('image/')) {
    return 'Please upload an image file'
  }

  if (file.size > opts.maxSize!) {
    const maxSizeMB = opts.maxSize! / (1024 * 1024)
    return `Image size should be less than ${maxSizeMB}MB`
  }

  return null
}

/**
 * Upload image to server (placeholder - implement with your backend)
 */
export async function uploadImage(file: File): Promise<string> {
  // For now, just return base64
  // In production, upload to Cloudinary or your backend
  const error = validateImageFile(file)
  if (error) {
    throw new Error(error)
  }

  return await resizeImage(file)
}

/**
 * Upload multiple images
 */
export async function uploadImages(files: File[]): Promise<string[]> {
  return Promise.all(files.map(uploadImage))
}

