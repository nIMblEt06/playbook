# Music Player Component

A neo-brutalist styled music player component for the Trackd frontend application.

## Features

- **Fixed bottom position** - Always visible at the bottom of the screen when a track is playing
- **Track information display** - Shows album art, track name, and artist(s)
- **Playback controls** - Play/pause, previous, next, shuffle, and repeat
- **Progress bar** - Visual progress indicator with seek functionality
- **Volume control** - Slider with mute/unmute functionality
- **Premium/Free tier support** - Adapts controls based on Spotify account type
- **Neo-brutalist design** - Matches the app's design system with bold borders and shadows

## Usage

### Basic Integration

Add the `MusicPlayer` component to your root layout:

```tsx
import { MusicPlayer } from '@/components/player'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <MusicPlayer />
        </Providers>
      </body>
    </html>
  )
}
```

### Playing a Track

Use the player store to control playback:

```tsx
import { usePlayerStore } from '@/lib/store/player-store'
import { useSpotifyPlayer } from '@/lib/hooks/use-spotify-player'

function TrackCard({ track }) {
  const { playTrack } = usePlayerStore()
  const { play } = useSpotifyPlayer()

  const handlePlay = () => {
    // Convert your track to PlayerTrack format
    const playerTrack = {
      id: track.id,
      uri: track.uri,
      name: track.name,
      artists: track.artists.map(a => a.name),
      albumName: track.album.name,
      albumId: track.album.id,
      coverUrl: track.album.images[0]?.url,
      duration: track.duration_ms,
      previewUrl: track.preview_url,
    }

    // Update the player store
    playTrack(playerTrack)

    // Start playback
    if (playerTrack.uri) {
      play(playerTrack.uri)
    }
  }

  return (
    <button onClick={handlePlay}>
      Play {track.name}
    </button>
  )
}
```

### Playing a Queue

To play multiple tracks in sequence:

```tsx
import { usePlayerStore } from '@/lib/store/player-store'

function AlbumPlayer({ tracks }) {
  const { playQueue } = usePlayerStore()

  const handlePlayAlbum = (startIndex = 0) => {
    const playerTracks = tracks.map(track => ({
      id: track.id,
      uri: track.uri,
      name: track.name,
      artists: track.artists.map(a => a.name),
      albumName: track.album.name,
      albumId: track.album.id,
      coverUrl: track.album.images[0]?.url,
      duration: track.duration_ms,
    }))

    playQueue(playerTracks, startIndex)
  }

  return (
    <button onClick={() => handlePlayAlbum()}>
      Play Album
    </button>
  )
}
```

## Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Album] Track Name            Controls          [Vol] ▬▬▬  │
│         Artist Name         ◄ ► ⏸ ► ►         🔊          │
│                              0:45 ▬▬▬▬ 3:24                │
└─────────────────────────────────────────────────────────────┘
```

## Layout Sections

### Left Section (~300px)
- Album artwork (56x56px)
- Track name (truncated)
- Artist name(s) (muted color)

### Center Section (flex-1)
- Control buttons row:
  - Shuffle toggle
  - Previous track
  - Play/Pause (larger, primary styled)
  - Next track
  - Repeat mode toggle
- Progress bar with timestamps

### Right Section (~200px)
- Mute/unmute button
- Volume slider

## Premium vs Free Features

**Premium (Spotify Premium users):**
- Full playback controls
- Previous/Next track navigation
- Shuffle and repeat modes
- Full track playback

**Free (Non-premium users):**
- Play/Pause only
- 30-second preview playback
- Previous/Next/Shuffle/Repeat disabled

## Styling

The component follows the app's neo-brutalist design system:

- **Colors**: Uses theme colors from tailwind.config.ts
- **Borders**: 2px solid borders (border-card-border)
- **Shadows**: Neo-brutalist offset shadows (4px 4px)
- **Typography**: Space Mono for UI text
- **Interactions**: Smooth transitions with hover states

## Time Formatting

Times are displayed in `mm:ss` format:
- `formatTime(45000)` → `"0:45"`
- `formatTime(204000)` → `"3:24"`

## Accessibility

- All buttons have `aria-label` attributes
- Disabled states for non-premium features
- Keyboard navigation supported
- Visual feedback for all interactive elements

## State Management

The player integrates with:

1. **`usePlayerStore`** - Global playback state (Zustand)
   - Current track
   - Play/pause state
   - Position, duration
   - Volume, shuffle, repeat
   - Queue management

2. **`useSpotifyPlayer`** - Spotify SDK integration
   - Premium: Full Spotify Web Playback SDK
   - Free: HTML5 audio with preview URLs
   - Playback control methods

## Browser Support

- Modern browsers with CSS Grid and Flexbox
- Spotify Web Playback SDK (Premium users)
- HTML5 Audio API (Free users)

## Notes

- Component only renders when `currentTrack` exists
- Fixed positioning with `z-50` to stay above content
- Responsive layout with max-width constraint
- Progress bar click-to-seek functionality
- Volume saved in player store
