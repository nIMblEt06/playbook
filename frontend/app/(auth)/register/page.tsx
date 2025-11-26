'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import Image from 'next/image'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isRegistering, registerError } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      setError('Username can only contain lowercase letters, numbers, and underscores')
      return
    }

    register(
      { username, displayName, email, password },
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
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight">laybook</h1>
        </div>

        {/* Register Card */}
        <div className="card p-8">
          <h2 className="text-xl font-display font-bold uppercase mb-6">Sign Up</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                className="input w-full"
                placeholder="johndoe"
                pattern="[a-z0-9_]+"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lowercase letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input w-full"
                placeholder="John Doe"
                required
              />
            </div>

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
                minLength={8}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input w-full"
                placeholder="••••••••"
                required
              />
            </div>

            {(error || registerError) && (
              <div className="p-3 bg-destructive/10 border-2 border-destructive text-destructive text-sm">
                {error || (registerError as any)?.message || 'Registration failed'}
              </div>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isRegistering ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Log in
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
