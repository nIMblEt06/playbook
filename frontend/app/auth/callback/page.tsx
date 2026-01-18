'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { authService } from '@/lib/api/services/auth'
import Image from 'next/image'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token')
      const errorParam = searchParams.get('error')

      if (errorParam) {
        setStatus('error')
        setError('Authentication failed. Please try again.')
        return
      }

      if (!token) {
        setStatus('error')
        setError('No authentication token received.')
        return
      }

      try {
        // Store the token temporarily to make the API call
        localStorage.setItem('token', token)

        // Fetch user profile from backend
        const { user } = await authService.me()

        // Store auth state
        setAuth(user, token)

        setStatus('success')

        // Redirect to home after a brief delay
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } catch (err) {
        console.error('Failed to fetch user profile:', err)
        localStorage.removeItem('token')
        setStatus('error')
        setError('Failed to complete authentication. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams, setAuth, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
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
        </div>

        {/* Status Card */}
        <div className="card p-8">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#1DB954] animate-spin" />
              <h2 className="text-xl font-display font-bold uppercase mb-2">
                Connecting...
              </h2>
              <p className="text-muted-foreground">
                Setting up your account with Spotify
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#1DB954]" />
              <h2 className="text-xl font-display font-bold uppercase mb-2">
                Welcome to Trackd!
              </h2>
              <p className="text-muted-foreground">
                Redirecting you to the app...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <h2 className="text-xl font-display font-bold uppercase mb-2">
                Something Went Wrong
              </h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <button
                onClick={() => router.push('/login')}
                className="btn-primary"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
