'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import Image from 'next/image'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoggingIn, loginError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login(
      { email, password },
      {
        onSuccess: () => {
          router.push('/')
        },
      }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-1 mb-8 text-primary">
          <Image
            src="/pb_logo.svg"
            alt="Play Book"
            width={64}
            height={32}
          />
        </div>

        {/* Login Card */}
        <div className="card p-8">
          <h2 className="text-xl font-display font-bold uppercase mb-6">Log In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-destructive/10 border-2 border-destructive text-destructive text-sm">
                Invalid email or password
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isLoggingIn ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Discover music through people you trust
        </p>
      </div>
    </div>
  )
}
