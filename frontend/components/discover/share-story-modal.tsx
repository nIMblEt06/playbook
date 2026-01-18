'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import type { DiscoverReview } from '@/lib/api/services/discover'
import { ReviewStoryTemplate } from './review-story-template'

interface ShareStoryModalProps {
  review: DiscoverReview
  isOpen: boolean
  onClose: () => void
}

export function ShareStoryModal({ review, isOpen, onClose }: ShareStoryModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasShared, setHasShared] = useState(false)
  const templateRef = useRef<HTMLDivElement>(null)

  const handleDownload = useCallback((dataUrl: string) => {
    const link = document.createElement('a')
    link.download = `trackd-review-${review.album?.title?.replace(/\s+/g, '-').toLowerCase() || 'share'}.png`
    link.href = dataUrl
    link.click()
  }, [review.album?.title])

  const handleShare = useCallback(async (dataUrl: string) => {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl)
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
        handleDownload(dataUrl)
      }
    } catch (error) {
      // User cancelled or error - silently fail
      console.error('Share error:', error)
    }
  }, [review.album?.title, handleDownload])

  const generateAndShare = useCallback(async () => {
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

      // Immediately trigger share
      await handleShare(dataUrl)
      setHasShared(true)

      // Close modal after sharing
      onClose()
    } catch (error) {
      console.error('Error generating image:', error)
      alert('Failed to generate image. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [handleShare, onClose])

  // Auto-generate and share when modal opens
  useEffect(() => {
    if (isOpen && !isGenerating && !hasShared) {
      // Small delay to ensure the template is rendered
      const timer = setTimeout(() => {
        generateAndShare()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isGenerating, hasShared, generateAndShare])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsGenerating(false)
      setHasShared(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content - Just a loading indicator */}
      <div className="relative bg-background border-2 border-border shadow-xl p-6 flex flex-col items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Preparing your story...</p>

        {/* Hidden template for generation */}
        <div
          ref={templateRef}
          className="absolute -left-[9999px] -top-[9999px]"
          style={{
            width: '1080px',
            height: '1920px',
          }}
        >
          <ReviewStoryTemplate review={review} />
        </div>
      </div>
    </div>
  )
}
