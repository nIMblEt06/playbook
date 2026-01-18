'use client'

import { useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/store/player-store'
import { useSpotifyPlayer } from '@/lib/hooks/use-spotify-player'

/**
 * Format milliseconds to mm:ss
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function MusicPlayer() {
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    isPremium,
    pendingPlay,
    toggleShuffle,
    cycleRepeatMode,
    toggleMute,
    setPosition,
    setPendingPlay,
    nextTrack: storeNextTrack,
    previousTrack: storePreviousTrack,
  } = usePlayerStore()

  const { play, pause, resume, seek, nextTrack, previousTrack, setVolume, isReady, error: playerError } =
    useSpotifyPlayer()

  // Track the previous track ID and ready state to detect changes
  const prevTrackIdRef = useRef<string | null>(null)
  const prevReadyRef = useRef(false)
  const hasTriggeredPlayRef = useRef(false)
  // Ref to store play function to avoid effect dependency issues
  const playRef = useRef(play)

  // Update play ref when callback changes
  useEffect(() => {
    playRef.current = play
  }, [play])

  // Auto-play when:
  // 1. Track changes while SDK is ready, OR
  // 2. SDK becomes ready with a pending playback request
  useEffect(() => {
    if (!currentTrack) {
      prevTrackIdRef.current = null
      hasTriggeredPlayRef.current = false
      return
    }

    const trackChanged = prevTrackIdRef.current !== currentTrack.id
    const sdkBecameReady = isReady && !prevReadyRef.current

    // Reset trigger guard when track changes
    if (trackChanged) {
      hasTriggeredPlayRef.current = false
    }

    // Determine if we should trigger playback
    const shouldPlay =
      !hasTriggeredPlayRef.current && (
        // New track selected while SDK is ready
        (isReady && trackChanged && isPlaying) ||
        // SDK just became ready with pending playback
        (sdkBecameReady && pendingPlay)
      )

    if (shouldPlay) {
      hasTriggeredPlayRef.current = true
      prevTrackIdRef.current = currentTrack.id
      console.log('[MusicPlayer] Triggering playback for:', currentTrack.name)

      // Get fresh track data from store to ensure we have latest values
      const track = usePlayerStore.getState().currentTrack
      if (!track) return

      // Call play directly using ref to avoid dependency issues
      if (isPremium && track.uri) {
        playRef.current(track.uri)
      } else if (track.previewUrl) {
        playRef.current(track.previewUrl)
      }

      // Clear pending flag after triggering playback
      if (pendingPlay) {
        setPendingPlay(false)
      }
    }

    // Update previous ready state for next comparison
    // Only set to true when SDK becomes ready, not back to false
    // This ensures sdkBecameReady can detect the transition
    if (isReady) {
      prevReadyRef.current = true
    }
  // Intentionally using only currentTrack?.id - we fetch fresh data from store when needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id, isPlaying, isReady, isPremium, pendingPlay, setPendingPlay])

  // Don't show player if there's no current track
  if (!currentTrack) {
    return null
  }

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause()
    } else {
      await resume()
    }
  }

  const handlePrevious = async () => {
    if (isPremium) {
      await previousTrack()
    } else {
      storePreviousTrack()
    }
  }

  const handleNext = async () => {
    if (isPremium) {
      await nextTrack()
    } else {
      storeNextTrack()
    }
  }

  const handleShuffle = () => {
    toggleShuffle()
  }

  const handleRepeat = () => {
    cycleRepeatMode()
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newPosition = percentage * duration
    setPosition(newPosition)
    seek(newPosition)
  }

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Volume range is 0-1 for the slider, but store uses 0-100
    const sliderValue = parseFloat(e.target.value)
    const volumeValue = Math.round(sliderValue * 100)
    await setVolume(volumeValue)
  }

  const handleMute = async () => {
    toggleMute()
    if (isMuted) {
      // Unmuting - restore previous volume
      await setVolume(volume)
    } else {
      // Muting
      await setVolume(0)
    }
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return VolumeX
    if (volume < 50) return Volume1
    return Volume2
  }

  const VolumeIcon = getVolumeIcon()
  const progressPercentage = duration > 0 ? (position / duration) * 100 : 0
  // Convert volume from 0-100 to 0-1 for slider
  const volumeSliderValue = volume / 100

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t-2 border-border bg-card">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center gap-4 px-4">
        {/* Track Info - Left Section */}
        <div className="flex w-[300px] items-center gap-3">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden border-2 border-card-border bg-background-secondary">
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.albumName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Play className="h-6 w-6" />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="truncate font-mono text-sm font-bold text-foreground">
              {currentTrack.name}
            </div>
            <div className="truncate font-mono text-xs text-muted-foreground">
              {currentTrack.artists.join(', ')}
            </div>
          </div>
        </div>

        {/* Main Controls - Center Section */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            {/* Shuffle */}
            <button
              onClick={handleShuffle}
              disabled={!isPremium}
              className={`p-2 transition-colors hover:bg-muted ${
                isShuffled ? 'text-primary' : 'text-foreground-muted'
              } ${!isPremium ? 'cursor-not-allowed opacity-30' : ''}`}
              aria-label="Shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </button>

            {/* Previous */}
            <button
              onClick={handlePrevious}
              disabled={!isPremium}
              className={`p-2 transition-colors hover:bg-muted ${
                !isPremium ? 'cursor-not-allowed opacity-30' : ''
              }`}
              aria-label="Previous track"
            >
              <SkipBack className="h-5 w-5 text-foreground" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="rounded-full bg-primary p-3 text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md active:scale-95"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5" fill="currentColor" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNext}
              disabled={!isPremium}
              className={`p-2 transition-colors hover:bg-muted ${
                !isPremium ? 'cursor-not-allowed opacity-30' : ''
              }`}
              aria-label="Next track"
            >
              <SkipForward className="h-5 w-5 text-foreground" />
            </button>

            {/* Repeat */}
            <button
              onClick={handleRepeat}
              disabled={!isPremium}
              className={`p-2 transition-colors hover:bg-muted ${
                repeatMode !== 'off' ? 'text-primary' : 'text-foreground-muted'
              } ${!isPremium ? 'cursor-not-allowed opacity-30' : ''}`}
              aria-label={`Repeat ${repeatMode}`}
            >
              {repeatMode === 'track' ? (
                <Repeat1 className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex w-full max-w-2xl items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">
              {formatTime(position)}
            </span>

            <div
              className="group relative h-1 flex-1 cursor-pointer bg-muted"
              onClick={handleProgressClick}
            >
              <div
                className="absolute h-full bg-primary transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
              <div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-opacity group-hover:opacity-100"
                style={{ left: `calc(${progressPercentage}% - 6px)` }}
              />
            </div>

            <span className="font-mono text-xs text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume & Extra - Right Section */}
        <div className="flex w-[200px] items-center justify-end gap-2">
          <button
            onClick={handleMute}
            className="p-2 text-foreground-muted transition-colors hover:bg-muted hover:text-foreground"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className="h-5 w-5" />
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volumeSliderValue}
            onChange={handleVolumeChange}
            className="h-1 w-24 cursor-pointer appearance-none bg-muted accent-primary"
            style={{
              background: `linear-gradient(to right, oklch(0.85 0.18 160) 0%, oklch(0.85 0.18 160) ${
                volume
              }%, oklch(0.20 0 0) ${volume}%, oklch(0.20 0 0) 100%)`,
            }}
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  )
}
