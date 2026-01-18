'use client'

import { useState, useCallback, useRef } from 'react'
import { Link as LinkIcon, X, Loader2, ExternalLink } from 'lucide-react'
import { useCreatePost } from '@/lib/hooks/use-posts'
import { useAuthStore } from '@/lib/store/auth-store'
import type { LinkType } from '@/lib/types'
import NextImage from 'next/image'
import { extractFirstMusicUrl, getPlatformName, getContentTypeLabel, type LinkMetadata } from '@/lib/api/services/links'
import { useGetLinkMetadataMutation } from '@/lib/hooks/use-links'

export function PostComposer() {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState<LinkType>('track')
  const [showLinkInput, setShowLinkInput] = useState(false)

  // Auto-detected link state
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null)
  const [linkMetadata, setLinkMetadata] = useState<LinkMetadata | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const createPostMutation = useCreatePost()
  const getLinkMetadata = useGetLinkMetadataMutation()

  // Debounced URL detection from content
  const detectUrlInContent = useCallback((text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const url = extractFirstMusicUrl(text)
      if (url && url !== detectedUrl) {
        setDetectedUrl(url)
        // Fetch metadata for the detected URL
        getLinkMetadata.mutate(url, {
          onSuccess: (metadata) => {
            setLinkMetadata(metadata)
            // Auto-set the link type based on parsed content
            if (metadata.parsed.contentType !== 'unknown') {
              setLinkType(metadata.parsed.contentType as LinkType)
            }
          },
          onError: () => {
            setLinkMetadata(null)
          },
        })
      } else if (!url) {
        setDetectedUrl(null)
        setLinkMetadata(null)
      }
    }, 500)
  }, [detectedUrl, getLinkMetadata])

  // Handle content change with URL detection
  const handleContentChange = (text: string) => {
    setContent(text)
    detectUrlInContent(text)
  }

  // Clear detected link
  const clearDetectedLink = () => {
    setDetectedUrl(null)
    setLinkMetadata(null)
  }

  const handleSubmit = () => {
    // Use either detected URL or manually entered URL
    const finalLinkUrl = detectedUrl || linkUrl.trim()
    if (!content.trim() && !finalLinkUrl) return

    createPostMutation.mutate(
      {
        content: content.trim(),
        linkUrl: finalLinkUrl || undefined,
        linkType: finalLinkUrl ? linkType : undefined,
      },
      {
        onSuccess: () => {
          setContent('')
          setLinkUrl('')
          setShowLinkInput(false)
          setDetectedUrl(null)
          setLinkMetadata(null)
        },
      }
    )
  }

  if (!user) return null

  return (
    <div className="px-6 py-4 border-b-2 border-border">
      <div className="flex gap-3">
        {/* Avatar */}
        {user.avatarUrl ? (
          <NextImage
            src={user.avatarUrl}
            alt={user.displayName}
            width={40}
            height={40}
            className="w-10 h-10 border-2 border-border"
          />
        ) : (
          <div className="w-10 h-10 bg-muted border-2 border-border" />
        )}

        {/* Input Area */}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Share what you're listening to..."
            className="w-full bg-background-elevated border-2 border-input-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none min-h-[80px]"
            maxLength={2000}
          />

          {/* Auto-detected Link Preview */}
          {(detectedUrl || getLinkMetadata.isPending) && !showLinkInput && (
            <div className="mt-3 p-3 bg-background-elevated border-2 border-input-border">
              <div className="flex items-start gap-3">
                {getLinkMetadata.isPending ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Fetching link info...</span>
                  </div>
                ) : linkMetadata ? (
                  <>
                    {/* Album Art / Preview Image */}
                    {linkMetadata.imageUrl && (
                      <div className="w-16 h-16 flex-shrink-0 bg-muted border-2 border-border overflow-hidden">
                        <NextImage
                          src={linkMetadata.imageUrl}
                          alt={linkMetadata.title || 'Preview'}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-medium uppercase bg-primary/10 text-primary border border-primary/20">
                          {getContentTypeLabel(linkMetadata.parsed)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {getPlatformName(linkMetadata.parsed.type)}
                        </span>
                      </div>
                      {linkMetadata.title && (
                        <p className="font-medium text-sm truncate">{linkMetadata.title}</p>
                      )}
                      {linkMetadata.artist && (
                        <p className="text-xs text-muted-foreground truncate">{linkMetadata.artist}</p>
                      )}
                    </div>
                    <button
                      onClick={clearDetectedLink}
                      className="p-1 text-muted-foreground hover:text-foreground flex-shrink-0"
                      title="Remove link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : detectedUrl ? (
                  <div className="flex items-center gap-2 flex-1">
                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground truncate">{detectedUrl}</span>
                    <button
                      onClick={clearDetectedLink}
                      className="p-1 text-muted-foreground hover:text-foreground ml-auto flex-shrink-0"
                      title="Remove link"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Manual Link Input */}
          {showLinkInput && (
            <div className="mt-3 p-3 bg-background-elevated border-2 border-input-border">
              <div className="flex items-center gap-2 mb-2">
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as LinkType)}
                  className="px-3 py-1.5 bg-background border-2 border-border text-sm font-medium uppercase"
                >
                  <option value="track">Track</option>
                  <option value="album">Album</option>
                  <option value="playlist">Playlist</option>
                </select>
                <button
                  onClick={() => {
                    setShowLinkInput(false)
                    setLinkUrl('')
                  }}
                  className="ml-auto p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Paste Spotify, Apple Music, or other streaming link..."
                className="w-full bg-background border-2 border-input-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLinkInput(!showLinkInput)
                  // Clear detected link when switching to manual mode
                  if (!showLinkInput) {
                    clearDetectedLink()
                  }
                }}
                className={`p-2 transition-colors ${
                  showLinkInput
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
                title="Add link manually"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && !linkUrl.trim() && !detectedUrl) || createPostMutation.isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createPostMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>

          {/* Character Count */}
          <div className="text-xs text-muted-foreground text-right mt-2">
            {content.length} / 2000
          </div>
        </div>
      </div>
    </div>
  )
}
