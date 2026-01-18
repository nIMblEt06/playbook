# PlayButton Component

A reusable, accessible play button component for the Trackd music app. Supports playing single tracks, albums, and playlists with proper state management via Zustand.

## Features

- ✅ Play single tracks
- ✅ Play albums/playlists (queue management)
- ✅ Toggle play/pause for currently playing track
- ✅ Three size variants (sm, md, lg)
- ✅ Three style variants (default, overlay, icon-only)
- ✅ Fully accessible (ARIA labels, keyboard navigation)
- ✅ TypeScript support
- ✅ Responsive and mobile-friendly

## Installation

The component is already set up with all required dependencies:
- `zustand` - State management
- `lucide-react` - Icons
- `clsx` & `tailwind-merge` - Utility for class merging

## Basic Usage

```tsx
import { PlayButton, spotifyTrackToPlayerTrack } from '@/components/player'
import { spotifyService, type SpotifyTrack } from '@/lib/api/services/spotify'

// Get a track from Spotify API
const track = await spotifyService.getTrack('track-id')
const playerTrack = spotifyTrackToPlayerTrack(track)

// Render the play button
<PlayButton track={playerTrack} />
```

## Props

```typescript
interface PlayButtonProps {
  // For single track
  track?: {
    id: string
    uri?: string  // spotify:track:xxx
    name: string
    artists: string[]
    albumName: string
    albumId: string
    coverUrl: string | null
    duration: number
    previewUrl?: string | null
  }
  
  // For album/playlist (array of tracks)
  tracks?: Array<{...}>
  
  // Optional: start from specific index when playing album
  startIndex?: number
  
  // Styling variants
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'overlay' | 'icon-only'
  className?: string
}
```

## Size Variants

- `sm`: 32×32px button, 16px icon - for compact lists
- `md`: 40×40px button, 20px icon - default size
- `lg`: 56×56px button, 28px icon - for hero sections

## Style Variants

- `default`: Primary colored background (green by default)
- `overlay`: Semi-transparent black background with backdrop blur - perfect for album covers
- `icon-only`: Transparent background - for minimal designs

## Examples

### 1. Single Track

```tsx
<PlayButton 
  track={playerTrack}
  size="md"
  variant="default"
/>
```

### 2. Album with All Tracks

```tsx
const albumTracks = await spotifyService.getAlbumTracks(albumId)
const playerTracks = spotifyTracksToPlayerTracks(albumTracks)

<PlayButton 
  tracks={playerTracks}
  size="lg"
  variant="default"
/>
```

### 3. Track with Album Context

Play a specific track but include the full album in the queue:

```tsx
<PlayButton 
  track={currentTrack}
  tracks={allAlbumTracks}
  size="sm"
/>
```

### 4. Album Cover Overlay

```tsx
<div className="relative group">
  <img src={album.cover} className="w-full" />
  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
    <PlayButton 
      tracks={albumTracks}
      size="lg"
      variant="overlay"
    />
  </div>
</div>
```

### 5. Playlist with Start Index

Start playing from the 5th track:

```tsx
<PlayButton 
  tracks={playlistTracks}
  startIndex={4}
  size="md"
/>
```

## Helper Functions

### spotifyTrackToPlayerTrack

Converts a single SpotifyTrack to PlayerTrack format:

```tsx
import { spotifyTrackToPlayerTrack } from '@/components/player'

const track = await spotifyService.getTrack('id')
const playerTrack = spotifyTrackToPlayerTrack(track, customCoverUrl)
```

### spotifyTracksToPlayerTracks

Converts an array of SpotifyTracks:

```tsx
import { spotifyTracksToPlayerTracks } from '@/components/player'

const tracks = await spotifyService.getAlbumTracks(albumId)
const playerTracks = spotifyTracksToPlayerTracks(tracks, albumCoverUrl)
```

## Behavior

1. **Click on inactive track**: Starts playing the track/album
2. **Click on active track**: Toggles between play and pause
3. **Icon state**: Shows pause icon when track is playing, play icon otherwise
4. **Queue management**: Automatically managed via `usePlayerStore`

## Player Store

The component uses `usePlayerStore` from `@/lib/store/player-store`:

```tsx
const { 
  playTrack,     // Play single track
  playAlbum,     // Play array of tracks
  togglePlay,    // Toggle play/pause
  isPlaying,     // Current play state
  currentTrack   // Currently playing track
} = usePlayerStore()
```

## Accessibility

- Proper ARIA labels (Play/Pause)
- Keyboard navigation support
- Focus visible states with ring
- Semantic HTML button element

## Styling

Uses Tailwind CSS with proper:
- Focus states
- Hover effects
- Transition animations
- Responsive sizing

Custom styles can be added via `className` prop:

```tsx
<PlayButton 
  track={track}
  className="shadow-lg ring-2 ring-green-500"
/>
```

## Integration with Other Components

See `play-button.example.tsx` for complete examples of:
- Track cards
- Album headers
- Track rows with context
- Album covers with hover overlay
- Playlist views

## Performance Considerations

- Component uses Zustand for state (minimal re-renders)
- Click handlers use `e.stopPropagation()` to prevent event bubbling
- Icons are lazy-loaded from lucide-react

## Browser Support

Works in all modern browsers that support:
- ES6
- CSS custom properties
- Backdrop filter (for overlay variant)

## File Locations

- Component: `/frontend/components/player/play-button.tsx`
- Store: `/frontend/lib/store/player-store.ts`
- Utils: `/frontend/lib/utils.ts`
- Examples: `/frontend/components/player/play-button.example.tsx`
