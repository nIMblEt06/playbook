'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { usersService } from '@/lib/api/services/users'
import { AppLayout } from '@/components/layout/app-layout'
import { PostCard } from '@/components/posts/post-card'
import { useAuthStore } from '@/lib/store/auth-store'
import { Music2, MapPin, Link as LinkIcon, Loader2, Settings } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function ProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params.username as string
  const { user: currentUser } = useAuthStore()
  const [isFollowing, setIsFollowing] = useState(false)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => usersService.getUser(username),
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', 'user', username],
    queryFn: () => usersService.getUserPosts(username),
  })

  const isOwnProfile = currentUser?.username === username

  const handleFollow = async () => {
    if (isFollowing) {
      await usersService.unfollowUser(username)
      setIsFollowing(false)
    } else {
      await usersService.followUser(username)
      setIsFollowing(true)
    }
  }

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="px-6 py-12 text-center">
          <h2 className="text-2xl font-display font-bold mb-4">User Not Found</h2>
          <button onClick={() => router.push('/')} className="btn-primary">
            Go Home
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div>
        {/* Profile Header */}
        <div className="border-b-2 border-border">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="flex gap-6 mb-6">
              {/* Avatar */}
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  width={120}
                  height={120}
                  className="w-24 h-24 md:w-32 md:h-32 border-4 border-border shadow-md"
                />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 bg-muted border-4 border-border shadow-md" />
              )}

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold uppercase mb-1">
                      {profile.displayName}
                    </h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                  {isOwnProfile ? (
                    <Link href="/settings" className="btn-ghost">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  ) : (
                    <button onClick={handleFollow} className="btn-primary">
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>

                {/* Badges */}
                {profile.isArtist && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-primary/20 border-2 border-primary text-primary text-xs font-bold uppercase">
                      Artist
                    </span>
                    {profile.artistName && (
                      <span className="text-sm text-muted-foreground">
                        {profile.artistName}
                      </span>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-6 mb-4">
                  <div>
                    <span className="font-bold text-foreground">
                      {profile._count?.posts || 0}
                    </span>{' '}
                    <span className="text-muted-foreground text-sm">posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">
                      {profile._count?.followers || 0}
                    </span>{' '}
                    <span className="text-muted-foreground text-sm">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">
                      {profile._count?.following || 0}
                    </span>{' '}
                    <span className="text-muted-foreground text-sm">following</span>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-foreground-muted mb-4">{profile.bio}</p>
                )}

                {/* Streaming Links */}
                {profile.streamingLinks && Object.keys(profile.streamingLinks).length > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    {profile.streamingLinks.spotify && (
                      <a
                        href={profile.streamingLinks.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-card-hover border-2 border-border text-xs font-medium transition-colors"
                      >
                        <Music2 className="w-3 h-3" />
                        Spotify
                      </a>
                    )}
                    {profile.streamingLinks.appleMusic && (
                      <a
                        href={profile.streamingLinks.appleMusic}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-card-hover border-2 border-border text-xs font-medium transition-colors"
                      >
                        <Music2 className="w-3 h-3" />
                        Apple Music
                      </a>
                    )}
                    {profile.streamingLinks.soundcloud && (
                      <a
                        href={profile.streamingLinks.soundcloud}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-1.5 bg-card hover:bg-card-hover border-2 border-border text-xs font-medium transition-colors"
                      >
                        <Music2 className="w-3 h-3" />
                        SoundCloud
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="max-w-3xl mx-auto">
          {postsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {!postsLoading && postsData?.items.length === 0 && (
            <div className="px-6 py-12 text-center text-muted-foreground">
              No posts yet
            </div>
          )}

          {postsData?.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
