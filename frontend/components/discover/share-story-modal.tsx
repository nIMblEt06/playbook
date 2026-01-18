'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { X, Download, Share2, Loader2, Check } from 'lucide-react'
import type { DiscoverReview } from '@/lib/api/services/discover'
import { ReviewStoryTemplate } from './review-story-template'

interface ShareStoryModalProps {
  review: DiscoverReview
  isOpen: boolean
  onClose: () => void
}

export function ShareStoryModal({ review, isOpen, onClose }: ShareStoryModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGeneratedImage(null)
      setIsGenerating(false)
      setCopySuccess(false)
    }
  }, [isOpen])

  const generateImage = useCallback(async () => {
    if (!templateRef.current) {
      console.error('Template ref not found')
      return
    }

    setIsGenerating(true)

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default

      // Get the actual story container inside the template
      const storyElement = templateRef.current.querySelector('.story-capture') as HTMLElement
      if (!storyElement) {
        throw new Error('Story element not found')
      }

      // Temporarily remove transform for accurate capture
      const originalTransform = storyElement.parentElement?.style.transform
      const originalWidth = storyElement.parentElement?.style.width
      const originalHeight = storyElement.parentElement?.style.height

      if (storyElement.parentElement) {
        storyElement.parentElement.style.transform = 'none'
        storyElement.parentElement.style.width = '1080px'
        storyElement.parentElement.style.height = '1920px'
      }

      const canvas = await html2canvas(storyElement, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0a0a0a',
        width: 1080,
        height: 1920,
        logging: false,
      })

      // Restore original transform
      if (storyElement.parentElement) {
        storyElement.parentElement.style.transform = originalTransform || ''
        storyElement.parentElement.style.width = originalWidth || ''
        storyElement.parentElement.style.height = originalHeight || ''
      }

      const dataUrl = canvas.toDataURL('image/png', 1.0)
      setGeneratedImage(dataUrl)
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const handleDownload = useCallback(() => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.download = `trackd-review-${review.album?.title?.replace(/\s+/g, '-').toLowerCase() || 'share'}.png`
    link.href = generatedImage
    link.click()
  }, [generatedImage, review.album?.title])

  const handleShare = useCallback(async () => {
    if (!generatedImage) return

    try {
      // Convert data URL to blob
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const file = new File([blob], 'trackd-review.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `My review of ${review.album?.title}`,
          text: `Check out my review on Trackd!`,
        })
      } else {
        // Fallback - just download
        handleDownload()
      }
    } catch (error) {
      // User cancelled or error - silently fail
      console.error('Share error:', error)
    }
  }, [generatedImage, review.album?.title, handleDownload])

  const handleCopyImage = useCallback(async () => {
    if (!generatedImage) return

    try {
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }, [generatedImage])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-background border-2 border-border shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border flex-shrink-0">
          <h2 className="text-lg font-bold">Share to Story</h2>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Story Preview */}
          <div className="relative mb-4">
            <div className="aspect-[9/16] w-full max-w-[280px] mx-auto bg-black overflow-hidden border border-border">
              {generatedImage ? (
                // Show generated image
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={generatedImage}
                  alt="Generated story"
                  className="w-full h-full object-contain"
                />
              ) : (
                // Show live preview (scaled down)
                <div
                  ref={templateRef}
                  className="w-full h-full"
                  style={{
                    transform: 'scale(0.259)',
                    transformOrigin: 'top left',
                    width: '1080px',
                    height: '1920px',
                  }}
                >
                  <ReviewStoryTemplate review={review} />
                </div>
              )}

              {/* Loading overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-sm text-white">Generating image...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <p className="text-sm text-muted-foreground text-center mb-4">
            {generatedImage
              ? 'Your story is ready! Download or share it directly to Instagram.'
              : 'Preview your story!.'}
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            {!generatedImage ? (
              <button
                onClick={generateImage}
                disabled={isGenerating}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Image'
                )}
              </button>
            ) : (
              <>
                {/* Share Button - Primary action */}
                <button
                  onClick={handleShare}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share to Instagram
                </button>

                {/* Secondary actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-2.5 border-2 border-border hover:border-primary text-foreground flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={handleCopyImage}
                    className="flex-1 py-2.5 border-2 border-border hover:border-primary text-foreground flex items-center justify-center gap-2 transition-colors"
                  >
                    {copySuccess ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      'Copy Image'
                    )}
                  </button>
                </div>

                {/* Regenerate option */}
                <button
                  onClick={() => setGeneratedImage(null)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground text-center py-2"
                >
                  Regenerate preview
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
