'use client'

import { ArrowUp, MessageCircle, Bookmark, Share, Music, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Post, Playlist } from '@/lib/types'
import { useUpvotePost, useSavePost } from '@/lib/hooks/use-posts'
import { formatDistanceToNow } from 'date-fns'
import { useState, useEffect } from 'react'
import { playlistsService } from '@/lib/api/services/playlists'

interface PlaylistPostCardProps {
  post: Post
}

export function PlaylistPostCard({ post }: PlaylistPostCardProps) {
  const [hasUpvoted, setHasUpvoted] = useState(post.hasUpvoted || false)
  const [hasSaved, setHasSaved] = useState(post.hasSaved || false)
  const [upvoteCount, setUpvoteCount] = useState(post.upvoteCount)
  const [playlist, setPlaylist] = useState<Playlist | null>(null)
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(true)

  const upvoteMutation = useUpvotePost()
  const saveMutation = useSavePost()

  // Extract playlist ID from linkUrl
  useEffect(() => {
    const loadPlaylist = async () => {
      if (!post.linkUrl) return
      
      try {
        // Extract playlist ID from URL (e.g., /playlist/123 or http://domain/playlist/123)
        const match = post.linkUrl.match(/\/playlist\/([^/?]+)/)
        if (match && match[1]) {
          const playlistId = match[1]
          const data = await playlistsService.getPlaylist(playlistId)
          setPlaylist(data)
        }
      } catch (error) {
        console.error('Failed to load playlist:', error)
      } finally {
        setIsLoadingPlaylist(false)
      }
    }

    loadPlaylist()
  }, [post.linkUrl])

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

          {/* Playlist Display */}
          {isLoadingPlaylist ? (
            <div className="bg-background-elevated border-2 border-border p-6 mb-4">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          ) : playlist ? (
            <div className="bg-background-elevated border-2 border-border mb-4">
              {/* Playlist Header */}
              <div className="p-4 border-b-2 border-border">
                <div className="flex gap-4">
                  {/* Cover Image */}
                  {playlist.coverImageUrl ? (
                    <Image
                      src={playlist.coverImageUrl}
                      alt={playlist.name}
                      width={120}
                      height={120}
                      className="w-24 h-24 md:w-30 md:h-30 border-2 border-border object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-30 md:h-30 bg-muted border-2 border-border flex items-center justify-center flex-shrink-0">
                      <Music className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Playlist Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
                      Custom Playlist
                    </p>
                    <Link 
                      href={post.linkUrl || '#'}
                      className="block hover:text-primary transition-colors"
                    >
                      <h3 className="text-xl font-display font-bold mb-1 truncate">
                        {playlist.name}
                      </h3>
                    </Link>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {playlist.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {playlist.trackCount} {playlist.trackCount === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tracks List */}
              {playlist.tracks && playlist.tracks.length > 0 && (
                <div className="max-h-80 overflow-y-auto">
                  {playlist.tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                    >
                      {/* Track Number */}
                      <span className="text-sm text-muted-foreground font-medium w-6 text-center flex-shrink-0">
                        {index + 1}
                      </span>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>

                      {/* External Link */}
                      <a
                        href={track.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        title="Open in MusicBrainz"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* View Full Playlist Link */}
              <div className="p-3 bg-muted/30 border-t-2 border-border">
                <Link
                  href={post.linkUrl || '#'}
                  className="text-sm font-medium text-primary hover:underline flex items-center justify-center gap-2"
                >
                  View Full Playlist
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : null}

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

