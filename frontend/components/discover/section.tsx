'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface SectionProps {
  title: string
  subtitle?: string
  href?: string
  children: React.ReactNode
}

export function Section({ title, subtitle, href, children }: SectionProps) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap flex-shrink-0"
          >
            See all
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

interface HorizontalScrollProps {
  children: React.ReactNode
}

export function HorizontalScroll({ children }: HorizontalScrollProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
      {children}
    </div>
  )
}

interface GridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
}

export function Grid({ children, columns = 4 }: GridProps) {
  const colClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }

  return (
    <div className={`grid ${colClasses[columns]} gap-4`}>
      {children}
    </div>
  )
}
