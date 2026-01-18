'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, ThumbsUp, MessageCircle, Music, User, Disc3 } from 'lucide-react'
import type { ActivityItem } from '@/lib/types'
import { formatDistanceToNow } from '@/lib/utils/format'

interface ActivityCardProps {
  activity: ActivityItem
}

export function ActivityCard({ activity }: ActivityCardProps) {
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

  // Determine the target info based on type
  const getTargetInfo = () => {
    if (activity.targetType === 'album' && activity.album) {
      return {
        title: activity.album.title,
        subtitle: activity.album.artistName,
        imageUrl: activity.album.coverImageUrl,
        href: `/album/${activity.album.spotifyId}`,
      }
    }
    if (activity.targetType === 'track' && activity.track) {
      return {
        title: activity.track.title,
        subtitle: activity.track.artistName,
        imageUrl: null, // Tracks don't have cover images in our schema
        href: '#', // Could link to track page if we have one
      }
    }
    if (activity.targetType === 'artist' && activity.artist) {
      return {
        title: activity.artist.name,
        subtitle: 'Artist',
        imageUrl: activity.artist.imageUrl,
        href: `/artist/${activity.artist.spotifyId}`,
      }
    }
    return { title: 'Unknown', subtitle: '', imageUrl: null, href: '#' }
  }

  const target = getTargetInfo()

  // Determine action text based on whether there's content
  const getActionText = () => {
    if (activity.content || activity.title) {
      return 'reviewed'
    }
    return 'rated'
  }

  return (
    <div className="bg-card rounded-lg border border-border p-3 md:p-4">
      {/* Header - Author and action */}
      <div className="flex items-center gap-2 mb-3 text-xs md:text-sm flex-wrap">
        <Link
          href={`/profile/${activity.author.username}`}
          className="flex items-center gap-2 hover:text-primary transition-colors"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {activity.author.avatarUrl ? (
              <Image
                src={activity.author.avatarUrl}
                alt={activity.author.displayName}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <span className="font-medium">{activity.author.displayName}</span>
        </Link>
        <span className="text-muted-foreground">{getActionText()}</span>
        {activity.rating && (
          <span className="text-muted-foreground">
            {activity.targetType === 'album' ? 'this album' : activity.targetType === 'track' ? 'this track' : 'this artist'}
          </span>
        )}
        <span className="text-muted-foreground ml-auto text-[10px] md:text-xs">
          {formatDistanceToNow(new Date(activity.createdAt))}
        </span>
      </div>

      {/* Target info - Album/Track/Artist */}
      <div className="flex gap-2 md:gap-3 mb-3">
        <Link
          href={target.href}
          className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted hover:opacity-90 transition-opacity"
        >
          {target.imageUrl ? (
            <Image
              src={target.imageUrl}
              alt={target.title}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {activity.targetType === 'artist' ? (
                <User className="w-6 h-6 text-muted-foreground" />
              ) : activity.targetType === 'track' ? (
                <Disc3 className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Music className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link
            href={target.href}
            className="text-sm md:text-base font-medium hover:text-primary transition-colors line-clamp-1"
          >
            {target.title}
          </Link>
          <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
            {target.subtitle}
          </p>
          {activity.rating && (
            <div className="mt-1">{renderStars(activity.rating)}</div>
          )}
        </div>
      </div>

      {/* Review content (if any) */}
      {(activity.title || activity.content) && (
        <div className="mb-3 bg-muted/50 rounded-lg p-2 md:p-3">
          {activity.title && (
            <h3 className="text-sm md:text-base font-medium mb-1">{activity.title}</h3>
          )}
          {activity.content && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-3">
              {activity.content}
            </p>
          )}
        </div>
      )}

      {/* Footer - Stats */}
      <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3 md:w-3.5 md:h-3.5" />
          {activity.upvoteCount}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />
          {activity.commentCount}
        </span>
      </div>
    </div>
  )
}
