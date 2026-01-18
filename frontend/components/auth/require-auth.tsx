'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { Loader2 } from 'lucide-react'

interface RequireAuthProps {
  children: React.ReactNode
  /** URL to redirect to when not authenticated. Defaults to '/login' */
  redirectTo?: string
  /** If true, shows a loading spinner during hydration. If false, renders nothing. */
  showLoader?: boolean
}

/**
 * A wrapper component that protects routes requiring authentication.
 * Redirects unauthenticated users to the login page.
 *
 * Usage:
 * ```tsx
 * export default function ProtectedPage() {
 *   return (
 *     <RequireAuth>
 *       <YourPageContent />
 *     </RequireAuth>
 *   )
 * }
 * ```
 */
export function RequireAuth({
  children,
  redirectTo = '/login',
  showLoader = true
}: RequireAuthProps) {
  const router = useRouter()
  const { isAuthenticated, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for hydration before checking auth
    if (_hasHydrated && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [_hasHydrated, isAuthenticated, router, redirectTo])

  // Show loading state while hydrating
  if (!_hasHydrated) {
    if (!showLoader) return null
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render content if not authenticated (will redirect)
  if (!isAuthenticated) {
    if (!showLoader) return null
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
