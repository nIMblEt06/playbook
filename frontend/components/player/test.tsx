// Quick sanity check that imports work correctly
import { PlayButton, spotifyTrackToPlayerTrack, spotifyTracksToPlayerTracks } from './play-button'
import { usePlayerStore, type PlayerTrack } from '@/lib/store/player-store'
import { cn } from '@/lib/utils'

// Test that types are properly exported
const testTrack: PlayerTrack = {
  id: 'test-id',
  uri: 'spotify:track:test-id',
  name: 'Test Track',
  artists: ['Test Artist'],
  albumName: 'Test Album',
  albumId: 'test-album-id',
  coverUrl: null,
  duration: 180000,
  previewUrl: null,
}

console.log('✅ All imports successful!')
console.log('✅ PlayButton component exported')
console.log('✅ Helper functions exported')
console.log('✅ Types exported correctly')
