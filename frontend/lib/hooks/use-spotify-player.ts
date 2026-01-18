'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuthStore } from '../store/auth-store'
import { usePlayerStore, type PlayerTrack } from '../store/player-store'
import { apiClient } from '../api/client'

// Type declarations for Spotify Web Playback SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume: number
      }) => SpotifyPlayer
    }
  }
}

interface SpotifyPlayer {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: string, callback: (data: any) => void): boolean
  removeListener(event: string, callback?: (data: any) => void): boolean
  getCurrentState(): Promise<SpotifyPlaybackState | null>
  setName(name: string): Promise<void>
  getVolume(): Promise<number>
  setVolume(volume: number): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  togglePlay(): Promise<void>
  seek(position_ms: number): Promise<void>
  previousTrack(): Promise<void>
  nextTrack(): Promise<void>
  activateElement(): Promise<void>
}

interface SpotifyPlaybackState {
  context: {
    uri: string
    metadata: any
  }
  disallows: {
    pausing: boolean
    peeking_next: boolean
    peeking_prev: boolean
    resuming: boolean
    seeking: boolean
    skipping_next: boolean
    skipping_prev: boolean
  }
  paused: boolean
  position: number
  repeat_mode: number
  shuffle: boolean
  track_window: {
    current_track: SpotifySDKTrack
    previous_tracks: SpotifySDKTrack[]
    next_tracks: SpotifySDKTrack[]
  }
  duration: number
  loading: boolean
}

interface SpotifySDKTrack {
  uri: string
  id: string
  type: string
  media_type: string
  name: string
  is_playable: boolean
  album: {
    uri: string
    name: string
    images: Array<{ url: string }>
  }
  artists: Array<{
    uri: string
    name: string
  }>
  duration_ms: number
}

interface WebPlaybackError {
  message: string
}

export interface UseSpotifyPlayerReturn {
  isReady: boolean
  isPremium: boolean
  play: (uri?: string) => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  seek: (positionMs: number) => Promise<void>
  nextTrack: () => Promise<void>
  previousTrack: () => Promise<void>
  setVolume: (volume: number) => Promise<void>
  error: string | null
}

const SDK_SCRIPT_ID = 'spotify-player-sdk'
const SDK_URL = 'https://sdk.scdn.co/spotify-player.js'

export function useSpotifyPlayer(): UseSpotifyPlayerReturn {
  const user = useAuthStore((state) => state.user)
  const [error, setError] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Refs
  const playerRef = useRef<SpotifyPlayer | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const premiumPositionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initializedRef = useRef(false)
  const deviceTransferredRef = useRef(false)

  // Guards against duplicate operations
  const initializingRef = useRef(false)
  const playInProgressRef = useRef(false)
  const lastPlayCallRef = useRef<string | null>(null)
  const lastPlayTimeRef = useRef<number>(0)
  const mountedRef = useRef(true)
  const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isPremium = user?.spotifyPremium ?? false

  // Get store actions without subscribing to changes
  const getStoreActions = useCallback(() => {
    return usePlayerStore.getState()
  }, [])

  // Convert Spotify SDK track to our PlayerTrack type
  const convertTrack = useCallback((spotifyTrack: SpotifySDKTrack): PlayerTrack => {
    return {
      id: spotifyTrack.id,
      uri: spotifyTrack.uri,
      name: spotifyTrack.name,
      artists: spotifyTrack.artists.map((a) => a.name),
      albumName: spotifyTrack.album.name,
      albumId: spotifyTrack.album.uri.split(':')[2] || '',
      coverUrl: spotifyTrack.album.images[0]?.url || null,
      duration: spotifyTrack.duration_ms,
      previewUrl: null,
    }
  }, [])

  // Get fresh access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      const response = await apiClient.get<{ access_token: string }>(
        '/api/auth/spotify/token'
      )
      return response.data.access_token
    } catch (err) {
      console.error('Failed to get access token:', err)
      setError('Failed to authenticate with Spotify')
      return null
    }
  }, [])

  // Transfer playback to this device (required before play commands work)
  const transferPlayback = useCallback(
    async (deviceId: string, token: string): Promise<boolean> => {
      try {
        console.log('[Spotify Player] Transferring playback...')
        const response = await fetch('https://api.spotify.com/v1/me/player', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            device_ids: [deviceId],
            play: false, // Don't auto-play, we'll call play() after
          }),
        })
        console.log('[Spotify Player] Transfer response:', response.status)
        // 204 = success, 404 = no active device (acceptable)
        return response.ok || response.status === 204 || response.status === 404
      } catch (err) {
        console.error('[Spotify Player] Failed to transfer playback:', err)
        return false
      }
    },
    []
  )

  // Initialize Premium SDK player
  const initializePremiumPlayer = useCallback(async () => {
    // Guard against concurrent initialization
    if (initializedRef.current || initializingRef.current) {
      console.log('[Spotify Player] Already initialized or initializing, skipping')
      return
    }
    initializingRef.current = true

    try {
      // Load SDK script if not already loaded
      if (!document.getElementById(SDK_SCRIPT_ID)) {
        const script = document.createElement('script')
        script.id = SDK_SCRIPT_ID
        script.src = SDK_URL
        script.async = true
        document.body.appendChild(script)
      }

      // Wait for SDK to be ready
      await new Promise<void>((resolve) => {
        if (window.Spotify) {
          resolve()
        } else {
          window.onSpotifyWebPlaybackSDKReady = () => {
            resolve()
          }
        }
      })

      // Check if still mounted after async operation
      if (!mountedRef.current) {
        console.log('[Spotify Player] Component unmounted during initialization, aborting')
        return
      }

      // Create player instance
      const token = await getAccessToken()
      if (!token) {
        return
      }

      // Check again after token fetch
      if (!mountedRef.current) {
        return
      }

      const store = getStoreActions()
      const player = new window.Spotify.Player({
        name: 'Trackd Web Player',
        getOAuthToken: async (cb) => {
          const freshToken = await getAccessToken()
          if (freshToken) cb(freshToken)
        },
        volume: store.volume / 100,
      })

      // Setup event listeners
      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Spotify Web Playback SDK Ready with Device ID:', device_id)
        const s = getStoreActions()
        s.setDeviceId(device_id)
        s.setIsReady(true)
        s.setIsPremium(true)
        setIsReady(true)
        setError(null)
        // Reset device transfer flag so we transfer on first play
        deviceTransferredRef.current = false

        // Start position polling for smoother progress bar updates
        // The SDK's player_state_changed event fires infrequently (~30s)
        // Use the 'player' variable from closure since playerRef may not be set yet
        if (premiumPositionIntervalRef.current) {
          clearInterval(premiumPositionIntervalRef.current)
        }
        premiumPositionIntervalRef.current = setInterval(async () => {
          try {
            const state = await player.getCurrentState()
            if (state && !state.paused) {
              getStoreActions().setPosition(state.position)
            }
          } catch (err) {
            // Silently ignore errors during position polling
          }
        }, 500) // Poll every 500ms for smooth progress updates
      })

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.warn('Spotify Web Playback SDK Device has gone offline:', device_id)
        const s = getStoreActions()
        s.setIsReady(false)
        setIsReady(false)
      })

      player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
        if (!state) return
        const s = getStoreActions()
        const track = convertTrack(state.track_window.current_track)
        s.setTrack(track)
        s.setIsPlaying(!state.paused)
        s.setPosition(state.position)
      })

      player.addListener('initialization_error', ({ message }: WebPlaybackError) => {
        console.error('Spotify SDK Initialization Error:', message)
        setError(`Initialization failed: ${message}`)
        initializedRef.current = false
      })

      player.addListener('authentication_error', ({ message }: WebPlaybackError) => {
        console.error('Spotify SDK Authentication Error:', message)
        setError(`Authentication failed: ${message}`)
      })

      player.addListener('account_error', ({ message }: WebPlaybackError) => {
        console.error('Spotify SDK Account Error:', message)
        setError(`Account error: ${message}`)
      })

      player.addListener('playback_error', ({ message }: WebPlaybackError) => {
        console.error('Spotify SDK Playback Error:', message)
        setError(`Playback failed: ${message}`)
      })

      // Connect to the player
      const connected = await player.connect()
      if (connected) {
        playerRef.current = player
        initializedRef.current = true // Only set AFTER successful connection
        console.log('Successfully connected to Spotify Web Playback SDK')
      } else {
        setError('Failed to connect to Spotify')
      }
    } catch (err) {
      console.error('[Spotify Player] Initialization error:', err)
      setError('Failed to initialize player')
    } finally {
      initializingRef.current = false
    }
  }, [getAccessToken, convertTrack, getStoreActions])

  // Initialize Free tier audio player
  const initializeFreePlayer = useCallback(() => {
    // Guard against concurrent initialization
    if (initializedRef.current || initializingRef.current) {
      console.log('[Spotify Player] Free player already initialized or initializing, skipping')
      return
    }
    initializingRef.current = true

    try {
      if (!audioRef.current) {
        const store = getStoreActions()
        audioRef.current = new Audio()
        audioRef.current.volume = store.volume / 100

        // Setup audio element event listeners
        audioRef.current.addEventListener('play', () => {
          getStoreActions().setIsPlaying(true)
        })

        audioRef.current.addEventListener('pause', () => {
          getStoreActions().setIsPlaying(false)
        })

        audioRef.current.addEventListener('ended', () => {
          const s = getStoreActions()
          s.setIsPlaying(false)
          s.setPosition(0)
        })

        audioRef.current.addEventListener('error', () => {
          console.error('Audio playback error')
          setError('Failed to play preview')
          getStoreActions().setIsPlaying(false)
        })

        // Handle when new audio source is loaded - reset position and set actual duration
        audioRef.current.addEventListener('loadedmetadata', () => {
          const s = getStoreActions()
          // Reset position when new track loads
          s.setPosition(0)
          // Use actual audio duration (30s for previews) instead of full track duration
          if (audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
            s.setDuration(audioRef.current.duration * 1000)
          }
        })

        // Track position for free tier using timeupdate event (more reliable than setInterval)
        audioRef.current.addEventListener('timeupdate', () => {
          if (audioRef.current) {
            getStoreActions().setPosition(audioRef.current.currentTime * 1000)
          }
        })
      }

      const s = getStoreActions()
      s.setIsReady(true)
      s.setIsPremium(false)
      setIsReady(true)
      initializedRef.current = true
    } finally {
      initializingRef.current = false
    }
  }, [getStoreActions])

  // Refs to hold latest callbacks - prevents useEffect re-runs when callbacks change
  const initializePremiumPlayerRef = useRef(initializePremiumPlayer)
  const initializeFreePlayerRef = useRef(initializeFreePlayer)

  // Keep refs updated with latest callbacks
  useEffect(() => {
    initializePremiumPlayerRef.current = initializePremiumPlayer
    initializeFreePlayerRef.current = initializeFreePlayer
  }, [initializePremiumPlayer, initializeFreePlayer])

  // Initialize player based on premium status
  useEffect(() => {
    mountedRef.current = true

    // Cancel any pending cleanup from StrictMode's previous unmount
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current)
      cleanupTimeoutRef.current = null
    }

    if (!user) return

    if (isPremium) {
      initializePremiumPlayerRef.current()
    } else {
      initializeFreePlayerRef.current()
    }

    return () => {
      mountedRef.current = false

      // Delay cleanup to handle StrictMode double-invoke pattern
      // React StrictMode unmounts and remounts immediately in development
      cleanupTimeoutRef.current = setTimeout(() => {
        // Only cleanup if component is actually still unmounted
        if (!mountedRef.current) {
          if (playerRef.current) {
            playerRef.current.disconnect()
            playerRef.current = null
          }

          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ''
            audioRef.current = null
          }

          if (premiumPositionIntervalRef.current) {
            clearInterval(premiumPositionIntervalRef.current)
            premiumPositionIntervalRef.current = null
          }

          initializedRef.current = false
          initializingRef.current = false
          deviceTransferredRef.current = false
        }
      }, 100)
    }
  }, [user?.id, isPremium])

  // Playback control functions with retry logic
  const play = useCallback(
    async (uri?: string) => {
      console.log('[Spotify Player] play() called with uri:', uri)

      // Guard against concurrent play calls
      if (playInProgressRef.current) {
        console.log('[Spotify Player] Play already in progress, skipping')
        return
      }

      // Debounce: Skip if same URI was just requested within 500ms
      const playKey = uri || 'resume'
      const now = Date.now()
      if (lastPlayCallRef.current === playKey && now - lastPlayTimeRef.current < 500) {
        console.log('[Spotify Player] Duplicate play call detected, skipping')
        return
      }
      lastPlayCallRef.current = playKey
      lastPlayTimeRef.current = now
      playInProgressRef.current = true

      try {
        if (!user) {
          console.log('[Spotify Player] No user, aborting')
          setError('Please log in to play music')
          return
        }

        const store = getStoreActions()
        console.log('[Spotify Player] State check:', {
          isPremium,
          hasPlayerRef: !!playerRef.current,
          deviceId: store.deviceId,
          isReady: store.isReady,
        })

        if (isPremium && playerRef.current && store.deviceId) {
          const maxRetries = 2
          const deviceId = store.deviceId // Capture device ID to avoid stale reference

          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              // Check if player is still valid (component might have unmounted)
              if (!playerRef.current) {
                console.warn('[Spotify Player] Player ref became null, aborting')
                return
              }

              const token = await getAccessToken()
              if (!token) {
                setError('Authentication failed. Please log in again.')
                return
              }

              // Activate the player element (required by browser autoplay policy)
              try {
                await playerRef.current.activateElement()
                console.log('[Spotify Player] Player element activated')
              } catch (activateErr) {
                console.log('[Spotify Player] Activation note:', activateErr)
                // Continue anyway - activation might not be needed
              }

              // Transfer device on first play or on retry
              // This ensures Spotify knows which device to stream to
              if (!deviceTransferredRef.current || attempt > 0) {
                console.log('[Spotify Player] Transferring device...', { firstPlay: !deviceTransferredRef.current, attempt })
                const transferred = await transferPlayback(deviceId, token)
                if (transferred) {
                  deviceTransferredRef.current = true
                  // Wait for Spotify to register the device
                  await new Promise((resolve) => setTimeout(resolve, 300))
                } else if (attempt === maxRetries) {
                  throw new Error('Failed to transfer playback to this device')
                }
              }

              // Use Spotify Web API to start playback
              const endpoint = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`
              const body = uri ? { uris: [uri] } : {}

              console.log('[Spotify Player] Calling play API...', { endpoint, body })

              const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
              })

              console.log('[Spotify Player] Play API response:', response.status)

              if (response.ok || response.status === 204) {
                console.log('[Spotify Player] Playback started successfully!')
                setError(null)
                return // Success!
              }

              // Handle specific error codes
              if (response.status === 404) {
                // Device not found - retry with transfer
                console.warn('[Spotify Player] Device not found (404), will retry with transfer')
                if (attempt < maxRetries) continue
              }

              if (response.status === 401) {
                // Token expired - will get fresh one on retry
                console.warn('[Spotify Player] Token expired (401), retrying...')
                if (attempt < maxRetries) continue
              }

              if (response.status === 403) {
                // Try to get more info about the error
                const errorBody = await response.text()
                console.error('[Spotify Player] Forbidden (403):', errorBody)
                setError('Playback restricted. Make sure Spotify is not playing elsewhere.')
                return
              }

              if (response.status === 502 || response.status === 503) {
                // Spotify API temporary failure - retry
                console.warn('[Spotify Player] Spotify API error, retrying...')
                if (attempt < maxRetries) {
                  await new Promise((resolve) => setTimeout(resolve, 500))
                  continue
                }
              }

              // Log the error body for debugging
              const errorText = await response.text()
              console.error('[Spotify Player] Error response body:', errorText)

              throw new Error(`Playback failed: ${response.status}`)
            } catch (err) {
              console.error(`[Spotify Player] Play error (attempt ${attempt + 1}):`, err)
              if (attempt === maxRetries) {
                setError('Failed to start playback. Please try again.')
              }
            }
          }
        } else if (!isPremium && audioRef.current) {
          // For free tier, uri should be a preview URL
          if (uri) {
            audioRef.current.src = uri
            try {
              await audioRef.current.play()
              setError(null)
            } catch (err) {
              console.error('Audio play error:', err)
              setError('Failed to play preview')
            }
          } else {
            setError('No preview available for this track')
          }
        } else {
          console.log('[Spotify Player] Cannot play - missing requirements:', {
            isPremium,
            hasPlayerRef: !!playerRef.current,
            deviceId: store.deviceId,
            hasAudioRef: !!audioRef.current,
          })
        }
      } finally {
        playInProgressRef.current = false
      }
    },
    [user, isPremium, getAccessToken, getStoreActions, transferPlayback]
  )

  const pause = useCallback(async () => {
    if (isPremium && playerRef.current) {
      try {
        await playerRef.current.pause()
        setError(null)
      } catch (err) {
        console.error('Pause error:', err)
        setError('Failed to pause')
      }
    } else if (!isPremium && audioRef.current) {
      audioRef.current.pause()
    }
  }, [isPremium])

  const resume = useCallback(async () => {
    if (isPremium && playerRef.current) {
      try {
        await playerRef.current.resume()
        setError(null)
      } catch (err) {
        console.error('Resume error:', err)
        setError('Failed to resume')
      }
    } else if (!isPremium && audioRef.current) {
      try {
        await audioRef.current.play()
        setError(null)
      } catch (err) {
        console.error('Audio play error:', err)
        setError('Failed to play')
      }
    }
  }, [isPremium])

  const seek = useCallback(
    async (positionMs: number) => {
      if (isPremium && playerRef.current) {
        try {
          await playerRef.current.seek(positionMs)
          setError(null)
        } catch (err) {
          console.error('Seek error:', err)
          setError('Failed to seek')
        }
      } else if (!isPremium && audioRef.current) {
        audioRef.current.currentTime = positionMs / 1000
      }
    },
    [isPremium]
  )

  const nextTrack = useCallback(async () => {
    const store = getStoreActions()
    const { queue, queueIndex, repeatMode } = usePlayerStore.getState()

    // Handle repeat track mode - restart current track
    if (repeatMode === 'track') {
      if (isPremium && playerRef.current) {
        await playerRef.current.seek(0)
      }
      store.setPosition(0)
      return
    }

    // Calculate next index
    let nextIndex = queueIndex + 1

    // Handle end of queue
    if (nextIndex >= queue.length) {
      if (repeatMode === 'context') {
        nextIndex = 0
      } else {
        // Stop playback at end
        store.setIsPlaying(false)
        store.setPosition(0)
        return
      }
    }

    const nextTrackData = queue[nextIndex]
    if (!nextTrackData) return

    // Update store state first
    store.nextTrack()

    // Play the track
    if (isPremium && playerRef.current && nextTrackData.uri) {
      try {
        const token = await getAccessToken()
        if (!token) {
          setError('Authentication failed')
          return
        }

        // Get fresh device ID from store
        const deviceId = usePlayerStore.getState().deviceId
        if (!deviceId) {
          setError('No device available')
          return
        }

        console.log('[Spotify Player] nextTrack - playing:', nextTrackData.uri)

        // Activate player element first (browser autoplay policy)
        try {
          await playerRef.current.activateElement()
        } catch {
          // Continue anyway
        }

        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ uris: [nextTrackData.uri] }),
          }
        )

        if (!response.ok && response.status !== 204) {
          const errorText = await response.text()
          console.error('Next track API error:', response.status, errorText)

          // If device not found, try to transfer playback first
          if (response.status === 404) {
            console.log('[Spotify Player] Device not found, transferring playback...')
            await transferPlayback(deviceId, token)
            // Retry the play call
            const retryResponse = await fetch(
              `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ uris: [nextTrackData.uri] }),
              }
            )
            if (!retryResponse.ok && retryResponse.status !== 204) {
              setError('Failed to skip to next track')
            } else {
              setError(null)
            }
          } else {
            setError('Failed to skip to next track')
          }
        } else {
          setError(null)
        }
      } catch (err) {
        console.error('Next track error:', err)
        setError('Failed to skip to next track')
      }
    } else if (!isPremium && audioRef.current && nextTrackData.previewUrl) {
      // Free tier - play preview
      audioRef.current.src = nextTrackData.previewUrl
      try {
        await audioRef.current.play()
        setError(null)
      } catch (err) {
        console.error('Audio play error:', err)
        setError('Failed to play preview')
      }
    }
  }, [isPremium, getStoreActions, getAccessToken, transferPlayback])

  const previousTrack = useCallback(async () => {
    const store = getStoreActions()
    const { queue, queueIndex, position } = usePlayerStore.getState()

    // If more than 3 seconds into track, restart current track
    if (position > 3000) {
      if (isPremium && playerRef.current) {
        try {
          await playerRef.current.seek(0)
          setError(null)
        } catch (err) {
          console.error('Seek error:', err)
        }
      } else if (!isPremium && audioRef.current) {
        audioRef.current.currentTime = 0
      }
      store.setPosition(0)
      return
    }

    // Go to previous track
    const prevIndex = Math.max(0, queueIndex - 1)

    // If already at first track, just restart it
    if (prevIndex === queueIndex) {
      if (isPremium && playerRef.current) {
        try {
          await playerRef.current.seek(0)
          setError(null)
        } catch (err) {
          console.error('Seek error:', err)
        }
      } else if (!isPremium && audioRef.current) {
        audioRef.current.currentTime = 0
      }
      store.setPosition(0)
      return
    }

    const prevTrackData = queue[prevIndex]
    if (!prevTrackData) return

    // Update store state first
    store.previousTrack()

    // Play the track
    if (isPremium && playerRef.current && prevTrackData.uri) {
      try {
        const token = await getAccessToken()
        if (!token) {
          setError('Authentication failed')
          return
        }

        // Get fresh device ID from store
        const deviceId = usePlayerStore.getState().deviceId
        if (!deviceId) {
          setError('No device available')
          return
        }

        console.log('[Spotify Player] previousTrack - playing:', prevTrackData.uri)

        // Activate player element first (browser autoplay policy)
        try {
          await playerRef.current.activateElement()
        } catch {
          // Continue anyway
        }

        const response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ uris: [prevTrackData.uri] }),
          }
        )

        if (!response.ok && response.status !== 204) {
          const errorText = await response.text()
          console.error('Previous track API error:', response.status, errorText)

          // If device not found, try to transfer playback first
          if (response.status === 404) {
            console.log('[Spotify Player] Device not found, transferring playback...')
            await transferPlayback(deviceId, token)
            // Retry the play call
            const retryResponse = await fetch(
              `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ uris: [prevTrackData.uri] }),
              }
            )
            if (!retryResponse.ok && retryResponse.status !== 204) {
              setError('Failed to skip to previous track')
            } else {
              setError(null)
            }
          } else {
            setError('Failed to skip to previous track')
          }
        } else {
          setError(null)
        }
      } catch (err) {
        console.error('Previous track error:', err)
        setError('Failed to skip to previous track')
      }
    } else if (!isPremium && audioRef.current && prevTrackData.previewUrl) {
      // Free tier - play preview
      audioRef.current.src = prevTrackData.previewUrl
      try {
        await audioRef.current.play()
        setError(null)
      } catch (err) {
        console.error('Audio play error:', err)
        setError('Failed to play preview')
      }
    }
  }, [isPremium, getStoreActions, getAccessToken, transferPlayback])

  const setVolume = useCallback(
    async (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(100, volume))
      getStoreActions().setVolume(clampedVolume)

      if (isPremium && playerRef.current) {
        try {
          await playerRef.current.setVolume(clampedVolume / 100)
          setError(null)
        } catch (err) {
          console.error('Set volume error:', err)
          setError('Failed to set volume')
        }
      } else if (!isPremium && audioRef.current) {
        audioRef.current.volume = clampedVolume / 100
      }
    },
    [isPremium, getStoreActions]
  )

  return {
    isReady,
    isPremium,
    play,
    pause,
    resume,
    seek,
    nextTrack,
    previousTrack,
    setVolume,
    error,
  }
}
