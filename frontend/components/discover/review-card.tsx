'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ThumbsUp, MessageCircle, Music, User, Share2 } from 'lucide-react'
import type { DiscoverReview } from '@/lib/api/services/discover'
import { formatDistanceToNow } from '@/lib/utils/format'
import { useUpvoteReview } from '@/lib/hooks/use-reviews'
import { ShareStoryModal } from './share-story-modal'

interface ReviewCardProps {
  review: DiscoverReview
  compact?: boolean
  onCommentClick?: () => void
}

export function ReviewCard({ review, compact = false, onCommentClick }: ReviewCardProps) {
  const [hasUpvoted, setHasUpvoted] = useState(review.hasUpvoted || false)
  const [upvoteCount, setUpvoteCount] = useState(review.upvoteCount)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)

  const upvoteMutation = useUpvoteReview()

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsShareModalOpen(true)
  }

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newUpvoted = !hasUpvoted
    setHasUpvoted(newUpvoted)
    setUpvoteCount((prev) => (newUpvoted ? prev + 1 : prev - 1))
    upvoteMutation.mutate({ id: review.id, remove: !newUpvoted })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    )
  }

  if (compact) {
    return (
      <Link
        href={`/album/${review.album?.spotifyId}#review-${review.id}`}
        className="flex gap-3 p-3 rounded-lg bg-card hover:bg-muted/50 transition-colors border border-border"
      >
        {/* Album Cover */}
        <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
          {review.album?.coverImageUrl ? (
            <Image
              src={review.album.coverImageUrl}
              alt={review.album.title}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {review.rating && renderStars(review.rating)}
            <span className="text-xs text-muted-foreground">
              by {review.author.displayName}
            </span>
          </div>
          <p className="text-sm font-medium truncate">
            {review.album?.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {review.album?.artistName}
          </p>
        </div>
      </Link>
    )
  }

  return (
    <div className="bg-card rounded-lg border border-border p-4 flex flex-col">
      {/* Header - Album info */}
      <div className="flex gap-3 mb-3">
        <Link
          href={`/album/${review.album?.spotifyId}`}
          className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted hover:opacity-90 transition-opacity"
        >
          {review.album?.coverImageUrl ? (
            <Image
              src={review.album.coverImageUrl}
              alt={review.album.title}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={`/album/${review.album?.spotifyId}`}
            className="font-medium hover:text-primary transition-colors line-clamp-1"
          >
            {review.album?.title}
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {review.album?.artistName}
          </p>
          {review.rating && (
            <div className="mt-1">{renderStars(review.rating)}</div>
          )}
        </div>
      </div>

      {/* Review content */}
      {(review.title || review.content) && (
        <div className="mb-3">
          {review.title && (
            <h3 className="font-medium mb-1">{review.title}</h3>
          )}
          {review.content && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {review.content}
            </p>
          )}
        </div>
      )}

      {/* Footer - Author and stats */}
      <div className="flex items-center justify-between text-sm mt-auto pt-3">
        <Link
          href={`/profile/${review.author.username}`}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {review.author.avatarUrl ? (
              <Image
                src={review.author.avatarUrl}
                alt={review.author.displayName}
                width={24}
                height={24}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
          <span className="text-muted-foreground">
            {review.author.displayName}
          </span>
        </Link>

        <div className="flex items-center gap-3 text-muted-foreground">
          <button
            onClick={handleUpvote}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
              hasUpvoted
                ? 'text-primary bg-primary/10'
                : 'hover:text-foreground hover:bg-muted'
            }`}
            aria-label={hasUpvoted ? 'Remove upvote' : 'Upvote review'}
          >
            <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-current' : ''}`} />
            <span>{upvoteCount}</span>
          </button>
          {onCommentClick ? (
            <button
              onClick={onCommentClick}
              className="flex items-center gap-1 px-2 py-1 rounded hover:text-foreground hover:bg-muted transition-colors"
              aria-label="View comments"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{review.commentCount}</span>
            </button>
          ) : (
            <Link
              href={`/album/${review.album?.spotifyId}#review-${review.id}`}
              className="flex items-center gap-1 px-2 py-1 rounded hover:text-foreground hover:bg-muted transition-colors"
              aria-label="View comments"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{review.commentCount}</span>
            </Link>
          )}
          <button
            onClick={handleShareClick}
            className="flex items-center gap-1 px-2 py-1 rounded hover:text-foreground hover:bg-muted transition-colors md:hidden"
            aria-label="Share to story"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs">
            {formatDistanceToNow(new Date(review.createdAt))}
          </span>
        </div>
      </div>

      {/* Share Story Modal */}
      <ShareStoryModal
        review={review}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  )
}
