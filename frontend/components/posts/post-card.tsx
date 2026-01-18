'use client'

import { ArrowUp, MessageCircle, Bookmark, Share, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/lib/types'
import { useUpvotePost, useSavePost } from '@/lib/hooks/use-posts'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  const [hasUpvoted, setHasUpvoted] = useState(post.hasUpvoted || false)
  const [hasSaved, setHasSaved] = useState(post.hasSaved || false)
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount)

  const upvoteMutation = useUpvotePost()
  const saveMutation = useSavePost()

  const handleUpvote = () => {
    const newUpvoted = !hasUpvoted
    setHasUpvoted(newUpvoted)
    setUpvoteCount((prev) => (newUpvoted ? prev + 1 : prev - 1))
    upvoteMutation.mutate({ id: post?.id, remove: !newUpvoted })
  }

  const handleSave = () => {
    const newSaved = !hasSaved
    setHasSaved(newSaved)
    saveMutation.mutate({ id: post.id, unsave: !newSaved })
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      // TODO: Show toast notification
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <article className="px-3 sm:px-6 py-4 sm:py-5 hover:bg-card transition-colors border-b-2 border-border">
      <div className="flex gap-2 sm:gap-3">
        {/* Avatar */}
        <Link href={`/profile/${post.author.username}`} className="flex-shrink-0">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-border"
            />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted border-2 border-border" />
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap text-sm">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-medium hover:underline truncate max-w-[150px] sm:max-w-none"
            >
              {post.author.displayName}
            </Link>
            {post.author.isArtist && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold uppercase flex-shrink-0">
                Artist
              </span>
            )}
            {post.communities && post.communities[0] && (
              <Link
                href={`/community/${post.communities[0].slug}`}
                className="text-xs sm:text-sm text-muted-foreground hover:text-foreground truncate max-w-[120px] sm:max-w-none"
              >
                {post.communities[0].name}
              </Link>
            )}
            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
              · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Post Content */}
          <Link href={`/post/${post.id}`} className="block">
            <p className="text-sm sm:text-base text-foreground-muted leading-relaxed mb-3 sm:mb-4 whitespace-pre-wrap break-words">
              {post.content}
            </p>
          </Link>

          {/* Music Link Card */}
          {post.linkUrl && (
            <a
              href={post.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-background-elevated border-2 border-border hover:border-primary transition-all mb-3 sm:mb-4 relative overflow-hidden">
                {/* Album Art */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-muted border-2 border-border relative overflow-hidden">
                  {post.linkMetadata?.imageUrl ? (
                    <Image
                      src={post.linkMetadata.imageUrl}
                      alt={post.linkMetadata.title || 'Album art'}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-[15px] truncate">
                    {post.linkMetadata?.title || (post.linkType === 'track' ? 'Track' : post.linkType === 'album' ? 'Album' : 'Playlist')}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {post.linkMetadata?.artist || post.linkMetadata?.platform || (() => {
                      try {
                        return new URL(post.linkUrl!).hostname
                      } catch {
                        return 'Music Link'
                      }
                    })()}
                  </p>
                </div>

                {/* Play Button */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary border-2 border-border-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm flex-shrink-0">
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            </a>
          )}

          {/* Tags and Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
            {/* Tags */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/discover?q=${encodeURIComponent(tag)}`}
                  className={`text-xs ${tag === 'newandupcoming' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  hasUpvoted
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
                aria-label="Upvote post"
              >
                <ArrowUp className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{upvoteCount}</span>
                <span className="xs:hidden">{upvoteCount}</span>
              </button>
              <Link
                href={`/post/${post.id}`}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors min-h-[44px] sm:min-h-0"
                aria-label="View comments"
              >
                <MessageCircle className="w-4 h-4 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{post.commentCount}</span>
                <span className="xs:hidden">{post.commentCount}</span>
              </Link>
              <button
                onClick={handleSave}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors min-h-[44px] sm:min-h-0 ${
                  hasSaved
                    ? 'text-secondary bg-secondary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
                aria-label={hasSaved ? 'Unsave post' : 'Save post'}
              >
                <Bookmark className="w-4 h-4 sm:w-4 sm:h-4" fill={hasSaved ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 sm:py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors min-h-[44px] sm:min-h-0"
                aria-label="Share post"
              >
                <Share className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
