'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'
import { authService } from '@/lib/api/services/auth'
import { Loader2 } from 'lucide-react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { _hasHydrated, isAuthenticated, token, setAuth, clearAuth } = useAuthStore()
  const [isValidating, setIsValidating] = useState(true)

  useEffect(() => {
    // Wait for the store to hydrate from localStorage
    if (!_hasHydrated) {
      return
    }

    // If we have a token, validate it with the backend
    const validateToken = async () => {
      if (token && isAuthenticated) {
        try {
          const user = await authService.me()
          // Update user data in case it changed
          setAuth(user, token)
        } catch (error) {
          // Token is invalid, clear auth
          console.error('Token validation failed:', error)
          clearAuth()
        }
      }
      setIsValidating(false)
    }

    validateToken()
  }, [_hasHydrated, token, isAuthenticated, setAuth, clearAuth])

  // Show loading state while hydrating or validating
  if (!_hasHydrated || isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}

