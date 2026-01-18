# Music Player Integration Guide

## Quick Start

### 1. Add to Root Layout

The `MusicPlayer` should be added to your root layout so it's available across all pages:

```tsx
// app/layout.tsx
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

### 2. Add Bottom Padding to Main Content

Since the player is fixed at the bottom, add padding to your main content to prevent overlap:

```tsx
// app/page.tsx or your main layout
export default function Page() {
  return (
    <main className="pb-24"> {/* 24 = h-20 (player) + gap */}
      {/* Your content */}
    </main>
  )
}
```

## Playing Tracks

### Using the PlayButton Component

The easiest way to play tracks is using the existing `PlayButton`:

```tsx
import { PlayButton, spotifyTrackToPlayerTrack } from '@/components/player'
import type { SpotifyTrack } from '@/lib/api/services/spotify'

function TrackListItem({ track }: { track: SpotifyTrack }) {
  const playerTrack = spotifyTrackToPlayerTrack(track)

  return (
    <div className="flex items-center gap-4">
      <PlayButton track={playerTrack} size="md" variant="default" />
      <div>
        <p>{track.name}</p>
        <p className="text-sm text-muted-foreground">
          {track.artists.map(a => a.name).join(', ')}
        </p>
      </div>
    </div>
  )
}
```

### Direct Player Store Access

For more control, interact directly with the player store:

```tsx
import { usePlayerStore } from '@/lib/store/player-store'
import type { PlayerTrack } from '@/lib/store/player-store'

function CustomPlayer() {
  const { playTrack, currentTrack, isPlaying } = usePlayerStore()

  const handlePlay = () => {
    const track: PlayerTrack = {
      id: 'spotify-track-id',
      uri: 'spotify:track:xxxxx',
      name: 'Song Name',
      artists: ['Artist 1', 'Artist 2'],
      albumName: 'Album Name',
      albumId: 'album-id',
      coverUrl: 'https://i.scdn.co/image/xxxxx',
      duration: 240000, // in milliseconds
      previewUrl: null,
    }

    playTrack(track)
  }

  return (
    <button onClick={handlePlay}>
      Play Track
    </button>
  )
}
```

### Playing a Queue (Album/Playlist)

```tsx
import { usePlayerStore } from '@/lib/store/player-store'
import { spotifyTracksToPlayerTracks } from '@/components/player'

function AlbumPlayer({ tracks }: { tracks: SpotifyTrack[] }) {
  const { playAlbum } = usePlayerStore()

  const handlePlayAlbum = (startIndex = 0) => {
    const playerTracks = spotifyTracksToPlayerTracks(tracks)
    playAlbum(playerTracks, startIndex)
  }

  return (
    <div>
      <button onClick={() => handlePlayAlbum()}>
        Play Album
      </button>
      {tracks.map((track, index) => (
        <button
          key={track.id}
          onClick={() => handlePlayAlbum(index)}
        >
          {index + 1}. {track.name}
        </button>
      ))}
    </div>
  )
}
```

## Player State

### Accessing Current State

```tsx
import { usePlayerStore } from '@/lib/store/player-store'

function PlayerInfo() {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    repeatMode,
    isShuffled,
    isPremium,
  } = usePlayerStore()

  if (!currentTrack) return <p>No track playing</p>

  return (
    <div>
      <p>Now Playing: {currentTrack.name}</p>
      <p>Artists: {currentTrack.artists.join(', ')}</p>
      <p>Status: {isPlaying ? 'Playing' : 'Paused'}</p>
      <p>Position: {Math.floor(position / 1000)}s / {Math.floor(duration / 1000)}s</p>
      <p>Volume: {volume}%</p>
      <p>Repeat: {repeatMode}</p>
      <p>Shuffle: {isShuffled ? 'On' : 'Off'}</p>
      <p>Account: {isPremium ? 'Premium' : 'Free'}</p>
    </div>
  )
}
```

### Controlling Playback

```tsx
import { usePlayerStore } from '@/lib/store/player-store'

function PlaybackControls() {
  const {
    isPlaying,
    togglePlay,
    nextTrack,
    previousTrack,
    setVolume,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayerStore()

  return (
    <div>
      <button onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <button onClick={previousTrack}>Previous</button>
      <button onClick={nextTrack}>Next</button>
      <button onClick={toggleShuffle}>Toggle Shuffle</button>
      <button onClick={cycleRepeatMode}>Change Repeat</button>
      <input
        type="range"
        min="0"
        max="100"
        onChange={(e) => setVolume(Number(e.target.value))}
      />
    </div>
  )
}
```

## Premium vs Free Features

The player automatically adapts based on the user's Spotify account type:

**Premium Users:**
- Full Spotify SDK integration
- All playback controls enabled
- Previous/Next track navigation
- Shuffle and repeat modes
- Full track playback

**Free Users:**
- HTML5 audio fallback
- Play/Pause only
- 30-second preview playback
- Previous/Next/Shuffle/Repeat disabled (shown but grayed out)

## Styling Customization

The player uses Tailwind classes and follows the app's neo-brutalist theme. To customize:

### Change Player Height

```tsx
// In music-player.tsx, change:
<div className="fixed bottom-0 left-0 right-0 z-50 h-20 ...">
// To:
<div className="fixed bottom-0 left-0 right-0 z-50 h-24 ...">
```

### Change Colors

The player uses theme colors from `tailwind.config.ts`:
- `bg-card` - Player background
- `border-border` - Top border
- `bg-primary` - Play button and progress bar
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text

To override, modify the classes or add inline styles.

### Responsive Adjustments

The player is responsive by default with a max-width constraint. To adjust:

```tsx
// Change max-width:
<div className="mx-auto flex h-full max-w-screen-xl items-center ...">
```

## Progress Tracking

The player automatically tracks playback position. For premium users, this is handled by the Spotify SDK. For free users, it's tracked via the audio element.

To display progress elsewhere in your app:

```tsx
import { usePlayerStore } from '@/lib/store/player-store'

function ProgressDisplay() {
  const { position, duration } = usePlayerStore()
  const percentage = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div>
      <div className="w-full bg-gray-200 h-2">
        <div
          className="bg-primary h-2"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
```

## Event Handling

The player store updates automatically when playback state changes. Use it in any component:

```tsx
import { useEffect } from 'react'
import { usePlayerStore } from '@/lib/store/player-store'

function TrackChangeLogger() {
  const currentTrack = usePlayerStore(state => state.currentTrack)

  useEffect(() => {
    if (currentTrack) {
      console.log('Now playing:', currentTrack.name)
      // Send analytics, update last.fm, etc.
    }
  }, [currentTrack])

  return null
}
```

## Troubleshooting

### Player Not Showing

- Check that `currentTrack` is set in the player store
- Verify the player component is mounted in your layout
- Check browser console for errors

### No Sound (Premium)

- Ensure Spotify SDK is loaded (check Network tab)
- Verify access token is valid
- Check Spotify account status
- Try logging out and back in

### No Sound (Free)

- Check that track has a `previewUrl`
- Not all tracks have preview URLs available
- Check browser console for audio errors

### Controls Disabled

- Free users will see disabled Previous/Next/Shuffle/Repeat buttons
- This is expected behavior for non-premium accounts
- Only Play/Pause and Volume work for free users

## Best Practices

1. **Always provide player tracks with all required fields**
   - id, uri, name, artists, albumName, albumId, coverUrl, duration

2. **Use helper functions for conversion**
   - `spotifyTrackToPlayerTrack()` for single tracks
   - `spotifyTracksToPlayerTracks()` for arrays

3. **Handle missing data gracefully**
   - Check for null/undefined before accessing track properties
   - Provide fallback images for missing album art

4. **Consider mobile users**
   - Test on smaller screens
   - Ensure controls are touch-friendly
   - Consider reducing player height on mobile

5. **Monitor playback state**
   - Subscribe to player store updates
   - Handle track changes for analytics
   - Update UI based on play/pause state
