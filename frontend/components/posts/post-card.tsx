'use client'

import { ArrowUp, MessageCircle, Bookmark, Share, Play } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Post } from '@/lib/types'
import { useUpvotePost, useSavePost } from '@/lib/hooks/use-posts'
import { formatDistanceToNow } from 'date-fns'
import { useState } from 'react'
import { PlaylistPostCard } from './playlist-post-card'

interface PostCardProps {
  post: Post
}

export function PostCard({ post }: PostCardProps) {
  // Use special playlist card only for internal custom playlists
  // Check if the linkUrl is an internal playlist (contains /playlist/ in the path)
  const isCustomPlaylist = post.linkType === 'playlist' && 
    post.linkUrl && 
    (post.linkUrl.includes('/playlist/') || post.linkUrl.startsWith('/playlist/'))
  
  if (isCustomPlaylist) {
    return <PlaylistPostCard post={post} />
  }
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
    <article className="px-6 py-5 hover:bg-card transition-colors border-b-2 border-border">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/u/${post.author.username}`}>
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt={post.author.displayName}
              width={40}
              height={40}
              className="w-10 h-10 border-2 border-border"
            />
          ) : (
            <div className="w-10 h-10 bg-muted border-2 border-border" />
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author Info */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Link
              href={`/u/${post.author.username}`}
              className="font-medium hover:underline"
            >
              {post.author.displayName}
            </Link>
            {post.author.isArtist && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold uppercase">
                Artist
              </span>
            )}
            {post.communities && post.communities[0] && (
              <Link
                href={`/${post.communities[0].type === 'artist' ? 'a' : 'c'}/${post.communities[0].slug}`}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {post.communities[0].type === 'artist' ? 'a/' : 'c/'}
                {post.communities[0].slug}
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          {/* Post Content */}
          <Link href={`/post/${post.id}`} className="block">
            <p className="text-foreground-muted leading-relaxed mb-4 whitespace-pre-wrap">
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
              <div className="flex items-center gap-3 p-3 bg-background-elevated border-2 border-border hover:border-primary transition-all mb-4 relative overflow-hidden">
                {/* Album Art */}
                <div className="w-14 h-14 flex-shrink-0 bg-muted border-2 border-border relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[15px] truncate">
                    {post.linkType === 'track' ? 'Track' : post.linkType === 'album' ? 'Album' : 'Playlist'}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {new URL(post.linkUrl).hostname}
                  </p>
                </div>

                {/* Play Button */}
                <div className="w-10 h-10 bg-primary border-2 border-border-strong flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                  <Play className="w-4 h-4 text-primary-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            </a>
          )}

          {/* Tags and Actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Tags */}
            <div className="flex gap-2 flex-wrap">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className={`text-xs ${tag === 'newandupcoming' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUpvote}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  hasUpvoted
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
                {upvoteCount}
              </button>
              <Link
                href={`/post/${post.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {post.commentCount}
              </Link>
              <button
                onClick={handleSave}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                  hasSaved
                    ? 'text-secondary bg-secondary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card'
                }`}
              >
                <Bookmark className="w-4 h-4" fill={hasSaved ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-card transition-colors"
              >
                <Share className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
