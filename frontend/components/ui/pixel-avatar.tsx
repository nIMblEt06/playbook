'use client'

import { useMemo } from 'react'

interface PixelAvatarProps {
  avatarId: number // 1-5
  size?: number // in pixels
  className?: string
  seed?: string // optional seed for color generation
}

// 5 different 8-bit retro face designs
// Each design is a 8x8 grid where 1 = filled, 0 = empty
const AVATAR_DESIGNS = [
  // Avatar 1: Classic smiley face
  [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ],
  // Avatar 2: Cool sunglasses dude
  [
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [0, 1, 1, 0, 0, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ],
  // Avatar 3: Robot face
  [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
  ],
  // Avatar 4: Cat face
  [
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 1, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 0, 1, 1, 1],
    [1, 1, 0, 1, 1, 0, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
  ],
  // Avatar 5: Alien face
  [
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 0, 0, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 0, 0, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 0, 0, 0, 0, 1, 0],
  ],
]

// Color palettes for each avatar type - neo-brutalist style
const COLOR_PALETTES = [
  // Palette 1: Electric blues
  { primary: '#00D4FF', secondary: '#0066CC', background: '#001133' },
  // Palette 2: Hot pink/magenta
  { primary: '#FF3366', secondary: '#CC0044', background: '#330011' },
  // Palette 3: Acid green
  { primary: '#66FF33', secondary: '#33CC00', background: '#113300' },
  // Palette 4: Sunset orange
  { primary: '#FF9933', secondary: '#CC6600', background: '#331A00' },
  // Palette 5: Royal purple
  { primary: '#9933FF', secondary: '#6600CC', background: '#1A0033' },
]

// Generate a deterministic random color based on seed
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function PixelAvatar({ avatarId, size = 40, className = '', seed }: PixelAvatarProps) {
  // Validate avatarId (1-5)
  const validId = Math.max(1, Math.min(5, avatarId || 1))
  const design = AVATAR_DESIGNS[validId - 1]

  // Get color palette - use seed to vary if provided
  const palette = useMemo(() => {
    if (seed) {
      const hash = hashString(seed)
      return COLOR_PALETTES[hash % COLOR_PALETTES.length]
    }
    return COLOR_PALETTES[validId - 1]
  }, [validId, seed])

  const pixelSize = size / 8

  return (
    <div
      className={`flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: palette.background,
        display: 'grid',
        gridTemplateColumns: `repeat(8, ${pixelSize}px)`,
        gridTemplateRows: `repeat(8, ${pixelSize}px)`,
        border: '2px solid currentColor',
        imageRendering: 'pixelated',
      }}
      role="img"
      aria-label={`Pixel avatar ${validId}`}
    >
      {design.flat().map((pixel, index) => (
        <div
          key={index}
          style={{
            backgroundColor: pixel === 1 ? palette.primary : 'transparent',
            boxShadow: pixel === 1 ? `inset -1px -1px 0 ${palette.secondary}` : 'none',
          }}
        />
      ))}
    </div>
  )
}

// Component to display all available pixel avatars for selection
interface PixelAvatarSelectorProps {
  selectedId: number | null
  onSelect: (id: number) => void
  size?: number
}

export function PixelAvatarSelector({ selectedId, onSelect, size = 48 }: PixelAvatarSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {[1, 2, 3, 4, 5].map((id) => (
        <button
          key={id}
          onClick={() => onSelect(id)}
          className={`p-1 transition-all ${
            selectedId === id
              ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
              : 'hover:scale-105 opacity-70 hover:opacity-100'
          }`}
          type="button"
          aria-label={`Select pixel avatar ${id}`}
          aria-pressed={selectedId === id}
        >
          <PixelAvatar avatarId={id} size={size} />
        </button>
      ))}
    </div>
  )
}

// Avatar display component that shows either custom avatar URL or pixel avatar
interface UserAvatarProps {
  avatarUrl: string | null
  avatarType?: 'custom' | 'pixel'
  pixelAvatarId?: number | null
  displayName: string
  size?: number
  className?: string
}

export function UserAvatar({
  avatarUrl,
  avatarType = 'custom',
  pixelAvatarId,
  displayName,
  size = 40,
  className = '',
}: UserAvatarProps) {
  // If pixel avatar is selected and we have a valid ID
  if (avatarType === 'pixel' && pixelAvatarId && pixelAvatarId >= 1 && pixelAvatarId <= 5) {
    return (
      <PixelAvatar
        avatarId={pixelAvatarId}
        size={size}
        className={className}
        seed={displayName}
      />
    )
  }

  // Custom avatar URL
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
        width={size}
        height={size}
        className={`border-2 border-border ${className}`}
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    )
  }

  // Default fallback - show first letter
  return (
    <div
      className={`bg-muted border-2 border-border flex items-center justify-center font-bold text-muted-foreground ${className}`}
      style={{ width: size, height: size }}
    >
      {displayName.charAt(0).toUpperCase()}
    </div>
  )
}
