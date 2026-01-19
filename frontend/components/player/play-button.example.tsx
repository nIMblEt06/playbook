/**
 * PlayButton Usage Examples
 *
 * This file demonstrates various ways to use the PlayButton component
 */

import Image from 'next/image'
import { PlayButton, spotifyTrackToPlayerTrack, spotifyTracksToPlayerTracks } from './play-button'
import type { SpotifyTrack } from '@/lib/api/services/spotify'

// Example 1: Play a single track
function TrackCard({ track }: { track: SpotifyTrack }) {
  const playerTrack = spotifyTrackToPlayerTrack(track)
  
  return (
    <div className="flex items-center gap-4 p-4">
      <Image src={track.album.images[0]?.url || ''} alt={track.name} width={64} height={64} className="w-16 h-16" />
      <div className="flex-1">
        <h3>{track.name}</h3>
        <p>{track.artists.map(a => a.name).join(', ')}</p>
      </div>
      <PlayButton track={playerTrack} />
    </div>
  )
}

// Example 2: Play album (all tracks)
function AlbumHeader({ album, tracks }: { album: any; tracks: SpotifyTrack[] }) {
  const playerTracks = spotifyTracksToPlayerTracks(tracks, album.images[0]?.url)
  
  return (
    <div className="flex items-center gap-6 p-8">
      <Image src={album.images[0]?.url || ''} alt={album.name} width={192} height={192} className="w-48 h-48" />
      <div>
        <h1 className="text-4xl font-bold">{album.name}</h1>
        <p className="text-xl">{album.artists.map((a: any) => a.name).join(', ')}</p>
        <div className="mt-4">
          <PlayButton
            tracks={playerTracks}
            size="lg"
            variant="default"
          />
        </div>
      </div>
    </div>
  )
}

// Example 3: Play track from album (with context)
function AlbumTrackRow({ track, allTracks, index }: { 
  track: SpotifyTrack
  allTracks: SpotifyTrack[]
  index: number 
}) {
  const playerTrack = spotifyTrackToPlayerTrack(track)
  const allPlayerTracks = spotifyTracksToPlayerTracks(allTracks)
  
  return (
    <div className="flex items-center gap-4 p-2 hover:bg-gray-100">
      <span className="w-8 text-center">{index + 1}</span>
      <div className="flex-1">
        <p className="font-medium">{track.name}</p>
      </div>
      {/* Play this track but include full album as context */}
      <PlayButton 
        track={playerTrack}
        tracks={allPlayerTracks}
        size="sm"
        variant="icon-only"
      />
    </div>
  )
}

// Example 4: Album cover overlay play button
function AlbumCover({ album, tracks }: { album: any; tracks: SpotifyTrack[] }) {
  const playerTracks = spotifyTracksToPlayerTracks(tracks, album.images[0]?.url)
  
  return (
    <div className="relative group cursor-pointer">
      <Image
        src={album.images[0]?.url || ''}
        alt={album.name}
        width={300}
        height={300}
        className="w-full aspect-square object-cover rounded-lg"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayButton
            tracks={playerTracks}
            size="lg"
            variant="overlay"
          />
        </div>
      </div>
    </div>
  )
}

// Example 5: Playlist
function PlaylistView({ playlist, tracks }: { playlist: any; tracks: SpotifyTrack[] }) {
  const playerTracks = spotifyTracksToPlayerTracks(tracks)
  
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">{playlist.name}</h1>
        <PlayButton tracks={playerTracks} size="md" />
      </div>
      
      {tracks.map((track, index) => {
        const playerTrack = spotifyTrackToPlayerTrack(track)
        return (
          <div key={track.id} className="flex items-center gap-4 p-2">
            <span>{index + 1}</span>
            <Image src={track.album.images[0]?.url || ''} alt={track.name} width={40} height={40} className="w-10 h-10" />
            <div className="flex-1">
              <p>{track.name}</p>
              <p className="text-sm text-gray-600">{track.artists.map(a => a.name).join(', ')}</p>
            </div>
            {/* Play from this track onwards in the playlist */}
            <PlayButton
              tracks={playerTracks}
              startIndex={index}
              size="sm"
            />
          </div>
        )
      })}
    </div>
  )
}
