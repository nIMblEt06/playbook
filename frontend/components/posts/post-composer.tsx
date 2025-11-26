'use client'

import { useState } from 'react'
import { Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react'
import { useCreatePost } from '@/lib/hooks/use-posts'
import { useAuthStore } from '@/lib/store/auth-store'
import type { LinkType } from '@/lib/types'
import NextImage from 'next/image'

export function PostComposer() {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkType, setLinkType] = useState<LinkType>('track')
  const [showLinkInput, setShowLinkInput] = useState(false)

  const createPostMutation = useCreatePost()

  const handleSubmit = () => {
    if (!content.trim() && !linkUrl.trim()) return

    createPostMutation.mutate(
      {
        content: content.trim(),
        linkUrl: linkUrl.trim() || undefined,
        linkType: linkUrl.trim() ? linkType : undefined,
      },
      {
        onSuccess: () => {
          setContent('')
          setLinkUrl('')
          setShowLinkInput(false)
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
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share what you're listening to..."
            className="w-full bg-background-elevated border-2 border-input-border px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none resize-none min-h-[80px]"
            maxLength={2000}
          />

          {/* Link Input */}
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
                onClick={() => setShowLinkInput(!showLinkInput)}
                className={`p-2 transition-colors ${
                  showLinkInput
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && !linkUrl.trim()) || createPostMutation.isPending}
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
