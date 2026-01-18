'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Music } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://trackd.site'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check for error from OAuth callback
  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam) {
      switch (errorParam) {
        case 'spotify_denied':
          setError('You denied access to Spotify. Please try again.')
          break
        case 'auth_failed':
          setError('Authentication failed. Please try again.')
          break
        case 'state_mismatch':
          setError('Security check failed. Please try again.')
          break
        default:
          setError('Something went wrong. Please try again.')
      }
    }
  }, [searchParams])

  const handleSpotifyLogin = () => {
    setIsLoading(true)
    setError(null)
    // Redirect to backend Spotify OAuth endpoint
    window.location.href = `${API_URL}/api/auth/spotify`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <Image
            src="/trackd_logo.svg"
            alt="Trackd"
            width={64}
            height={64}
            className="w-16 h-16"
          />
          <span className="text-4xl font-display font-bold uppercase tracking-tight text-[#36f1a4]">
            Trackd
          </span>
          <p className="text-muted-foreground text-center">
            Discover music through people you trust
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Music className="w-5 h-5 text-[#1DB954]" />
            <h2 className="text-xl font-display font-bold uppercase">
              Connect with Spotify
            </h2>
          </div>

          <p className="text-sm text-muted-foreground text-center mb-6">
            Sign in with your Spotify account to access your playlists,
            listening history, and start logging your music.
          </p>

          {error && (
            <div className="p-3 mb-4 bg-destructive/10 border-2 border-destructive text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleSpotifyLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-[#1DB954] hover:bg-[#1ed760] text-white font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                Continue with Spotify
              </>
            )}
          </button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing, you agree to Trackd&apos;s Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            We&apos;ll access your Spotify library to help you log and discover music.
            <br />
            Your listening data stays private.
          </p>
        </div>
      </div>
    </div>
  )
}
