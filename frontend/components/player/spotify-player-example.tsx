'use client'

import { useEffect, useState } from 'react'
import { useSpotifyPlayer } from '@/lib/hooks/use-spotify-player'
import { usePlayerStore } from '@/lib/store/player-store'

/**
 * Example component demonstrating how to use the useSpotifyPlayer hook
 *
 * This component shows:
 * - How to check if player is ready and premium status
 * - How to play tracks (both Spotify URIs for Premium and preview URLs for Free)
 * - How to control playback (pause, resume, seek, volume)
 * - How to display current playback state
 * - How to handle errors
 */
export function SpotifyPlayerExample() {
  const {
    isReady,
    isPremium,
    play,
    pause,
    resume,
    seek,
    nextTrack,
    previousTrack,
    setVolume,
    getCurrentState,
    error,
  } = useSpotifyPlayer()

  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
  } = usePlayerStore()

  const [testUri, setTestUri] = useState('spotify:track:3n3Ppam7vgaVa1iaRUc9Lp') // Example track URI

  // Format milliseconds to MM:SS
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Handle play button
  const handlePlay = async () => {
    if (isPremium) {
      // For Premium users, play Spotify URI
      await play(testUri)
    } else {
      // For Free users, you would typically pass a preview URL
      // This is usually obtained from Spotify API track objects
      const previewUrl = currentTrack?.previewUrl
      if (previewUrl) {
        await play(previewUrl)
      } else {
        console.warn('No preview URL available for this track')
      }
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = parseFloat(e.target.value)
    seek(newPosition)
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Spotify Player</h2>

        {/* Status indicators */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isReady ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isReady ? 'Ready' : 'Not Ready'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Account:</span>
            <span>{isPremium ? 'Premium' : 'Free (Preview only)'}</span>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
      </div>

      {/* Current track info */}
      {currentTrack && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <div className="flex gap-4">
            {currentTrack.albumArt && (
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.album}
                className="w-20 h-20 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{currentTrack.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 truncate">
                {currentTrack.artists.join(', ')}
              </p>
              <p className="text-sm text-gray-500 truncate">{currentTrack.album}</p>
            </div>
          </div>
        </div>
      )}

      {/* Playback controls */}
      <div className="space-y-4">
        <div className="flex justify-center gap-4">
          <button
            onClick={previousTrack}
            disabled={!isReady || !isPremium}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {isPlaying ? (
            <button
              onClick={pause}
              disabled={!isReady}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={currentTrack ? resume : handlePlay}
              disabled={!isReady}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentTrack ? 'Resume' : 'Play'}
            </button>
          )}

          <button
            onClick={nextTrack}
            disabled={!isReady || !isPremium}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        {/* Progress bar */}
        {currentTrack && (
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={duration}
              value={position}
              onChange={handleSeek}
              disabled={!isReady}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{formatTime(position)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        {/* Volume control */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium min-w-fit">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              disabled={!isReady}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-fit">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Test controls */}
      <div className="border-t pt-4 space-y-3">
        <h3 className="font-medium">Test Controls</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={testUri}
            onChange={(e) => setTestUri(e.target.value)}
            placeholder="Spotify URI or Preview URL"
            className="flex-1 px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          />
          <button
            onClick={handlePlay}
            disabled={!isReady}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Play URI
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {isPremium
            ? 'Enter a Spotify URI (spotify:track:xxx) to play full tracks'
            : 'Enter a preview URL to play 30-second previews'}
        </p>
      </div>

      {/* Debug info */}
      <details className="border-t pt-4">
        <summary className="cursor-pointer font-medium">Debug Info</summary>
        <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
          {JSON.stringify(
            {
              isReady,
              isPremium,
              isPlaying,
              position,
              duration,
              volume,
              currentTrack: currentTrack ? {
                name: currentTrack.name,
                uri: currentTrack.uri,
                artists: currentTrack.artists,
              } : null,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  )
}
