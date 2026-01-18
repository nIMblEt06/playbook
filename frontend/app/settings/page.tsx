'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuthStore } from '@/lib/store/auth-store'
import { usersService } from '@/lib/api/services/users'
import { User, Save, Loader2, X, Music2 } from 'lucide-react'
import Image from 'next/image'
import type { UpdateProfileRequest, AvatarType } from '@/lib/types'
import { PixelAvatarSelector, PixelAvatar } from '@/components/ui/pixel-avatar'

export default function SettingsPage() {
  const router = useRouter()
  const { user, updateUser, isAuthenticated } = useAuthStore()

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarType, setAvatarType] = useState<AvatarType>('custom')
  const [pixelAvatarId, setPixelAvatarId] = useState<number | null>(null)
  const [streamingLinks, setStreamingLinks] = useState({
    spotify: '',
    appleMusic: '',
    soundcloud: '',
    bandcamp: '',
    youtube: '',
  })

  // Feedback state
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setBio(user.bio || '')
      setAvatarUrl(user.avatarUrl || '')
      setAvatarType(user.avatarType || 'custom')
      setPixelAvatarId(user.pixelAvatarId || null)
      setStreamingLinks({
        spotify: user.streamingLinks?.spotify || '',
        appleMusic: user.streamingLinks?.appleMusic || '',
        soundcloud: user.streamingLinks?.soundcloud || '',
        bandcamp: user.streamingLinks?.bandcamp || '',
        youtube: user.streamingLinks?.youtube || '',
      })
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      if (!user) throw new Error('User not found')
      return usersService.updateProfile(user.username, data)
    },
    onSuccess: (updatedUser) => {
      updateUser(updatedUser)
      setSuccessMessage('Profile updated successfully!')
      setErrorMessage('')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error: any) => {
      setErrorMessage(error?.response?.data?.message || 'Failed to update profile')
      setSuccessMessage('')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Filter out empty streaming links
    const filteredStreamingLinks = Object.fromEntries(
      Object.entries(streamingLinks).filter(([_, value]) => value.trim() !== '')
    )

    const data: UpdateProfileRequest = {
      displayName: displayName.trim(),
      bio: bio.trim() || undefined,
      avatarUrl: avatarType === 'custom' ? (avatarUrl.trim() || undefined) : undefined,
      avatarType,
      pixelAvatarId: avatarType === 'pixel' ? pixelAvatarId : undefined,
      streamingLinks: Object.keys(filteredStreamingLinks).length > 0
        ? filteredStreamingLinks
        : undefined,
    }

    updateProfileMutation.mutate(data)
  }

  const handleCancel = () => {
    if (user) {
      router.push(`/profile/${user.username}`)
    } else {
      router.push('/')
    }
  }

  if (!user || !isAuthenticated) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout showRightSidebar={false}>
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="border-b-2 border-border pb-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-display font-bold uppercase mb-2">Edit Profile</h1>
          <p className="text-sm md:text-base text-muted-foreground">Update your profile information and streaming links</p>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-500/10 border-2 border-green-500 text-green-500">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500 text-red-500">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* Avatar Section */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-display font-bold uppercase mb-4">Profile Picture</h2>

            {/* Avatar Type Toggle */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
              <button
                type="button"
                onClick={() => setAvatarType('pixel')}
                className={`flex-1 p-3 md:p-4 border-2 transition-all ${
                  avatarType === 'pixel'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="text-sm font-bold uppercase mb-2">Pixel Avatar</div>
                <p className="text-xs text-muted-foreground">Choose from 5 retro 8-bit faces</p>
              </button>
              <button
                type="button"
                onClick={() => setAvatarType('custom')}
                className={`flex-1 p-3 md:p-4 border-2 transition-all ${
                  avatarType === 'custom'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="text-sm font-bold uppercase mb-2">Custom URL</div>
                <p className="text-xs text-muted-foreground">Use your own image URL</p>
              </button>
            </div>

            {avatarType === 'pixel' ? (
              /* Pixel Avatar Selector */
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                <div className="flex-shrink-0">
                  {pixelAvatarId ? (
                    <PixelAvatar avatarId={pixelAvatarId} size={96} seed={user?.displayName} />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted border-4 border-border shadow-md flex items-center justify-center">
                      <User className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 w-full">
                  <label className="block text-sm font-bold uppercase mb-3 text-center sm:text-left">
                    Choose Your Avatar
                  </label>
                  <PixelAvatarSelector
                    selectedId={pixelAvatarId}
                    onSelect={(id) => setPixelAvatarId(id)}
                    size={56}
                  />
                  <p className="text-xs text-muted-foreground mt-3 text-center sm:text-left">
                    Select one of the 5 retro pixel art avatars
                  </p>
                </div>
              </div>
            ) : (
              /* Custom Avatar URL */
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Avatar preview"
                    width={100}
                    height={100}
                    className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-border shadow-md"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted border-4 border-border shadow-md flex items-center justify-center">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 w-full">
                  <label htmlFor="avatarUrl" className="block text-sm font-bold uppercase mb-2">
                    Avatar URL
                  </label>
                  <input
                    id="avatarUrl"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="input w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter a URL to an image (jpg, png, gif)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Basic Info Section */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-display font-bold uppercase mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="displayName" className="block text-sm font-bold uppercase mb-2">
                  Display Name *
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Your display name"
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-bold uppercase mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={user.username}
                  disabled
                  className="input w-full opacity-50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Username cannot be changed
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-bold uppercase mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  className="input w-full resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {bio.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Streaming Links Section */}
          <div className="card p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-display font-bold uppercase mb-4 flex items-center gap-2">
              <Music2 className="w-5 h-5" />
              Streaming Links
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="spotify" className="text-sm font-bold uppercase mb-2 flex items-center gap-2">
                  <span className="text-green-500">●</span>
                  Spotify
                </label>
                <input
                  id="spotify"
                  type="url"
                  value={streamingLinks.spotify}
                  onChange={(e) => setStreamingLinks({ ...streamingLinks, spotify: e.target.value })}
                  placeholder="https://open.spotify.com/artist/..."
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="appleMusic" className="text-sm font-bold uppercase mb-2 flex items-center gap-2">
                  <span className="text-red-500">●</span>
                  Apple Music
                </label>
                <input
                  id="appleMusic"
                  type="url"
                  value={streamingLinks.appleMusic}
                  onChange={(e) => setStreamingLinks({ ...streamingLinks, appleMusic: e.target.value })}
                  placeholder="https://music.apple.com/..."
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="soundcloud" className="text-sm font-bold uppercase mb-2 flex items-center gap-2">
                  <span className="text-orange-500">●</span>
                  SoundCloud
                </label>
                <input
                  id="soundcloud"
                  type="url"
                  value={streamingLinks.soundcloud}
                  onChange={(e) => setStreamingLinks({ ...streamingLinks, soundcloud: e.target.value })}
                  placeholder="https://soundcloud.com/..."
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="bandcamp" className="text-sm font-bold uppercase mb-2 flex items-center gap-2">
                  <span className="text-cyan-500">●</span>
                  Bandcamp
                </label>
                <input
                  id="bandcamp"
                  type="url"
                  value={streamingLinks.bandcamp}
                  onChange={(e) => setStreamingLinks({ ...streamingLinks, bandcamp: e.target.value })}
                  placeholder="https://bandcamp.com/..."
                  className="input w-full"
                />
              </div>

              <div>
                <label htmlFor="youtube" className="text-sm font-bold uppercase mb-2 flex items-center gap-2">
                  <span className="text-red-600">●</span>
                  YouTube
                </label>
                <input
                  id="youtube"
                  type="url"
                  value={streamingLinks.youtube}
                  onChange={(e) => setStreamingLinks({ ...streamingLinks, youtube: e.target.value })}
                  placeholder="https://youtube.com/@..."
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-end pt-4 border-t-2 border-border">
            <button
              type="button"
              onClick={handleCancel}
              disabled={updateProfileMutation.isPending}
              className="btn-ghost w-full sm:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending || !displayName.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center w-full sm:w-auto"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
