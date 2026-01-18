'use client'

import { useEffect, useCallback, useSyncExternalStore } from 'react'
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

// =============================================================================
// SINGLETON STATE - Shared across all hook instances
// =============================================================================

interface SingletonState {
  player: SpotifyPlayer | null
  audio: HTMLAudioElement | null
  isReady: boolean
  error: string | null
  initialized: boolean
  initializing: boolean
  deviceTransferred: boolean
  positionInterval: NodeJS.Timeout | null
  currentUserId: string | null
  currentIsPremium: boolean | null
}

const singletonState: SingletonState = {
  player: null,
  audio: null,
  isReady: false,
  error: null,
  initialized: false,
  initializing: false,
  deviceTransferred: false,
  positionInterval: null,
  currentUserId: null,
  currentIsPremium: null,
}

// Guards for play operations
let playInProgress = false
let lastPlayCall: string | null = null
let lastPlayTime = 0

// Subscriber pattern for state changes
type Subscriber = () => void
const subscribers = new Set<Subscriber>()

// Reference counting for cleanup
let subscriberCount = 0

function notifySubscribers() {
  subscribers.forEach((callback) => callback())
}

function subscribe(callback: Subscriber): () => void {
  subscribers.add(callback)
  subscriberCount++
  return () => {
    subscribers.delete(callback)
    subscriberCount--
    // Only cleanup if no subscribers remain after a delay
    // This handles React StrictMode and quick navigation
    setTimeout(() => {
      if (subscriberCount === 0) {
        cleanupSingleton()
      }
    }, 1000)
  }
}

function getSnapshot(): SingletonState {
  return singletonState
}

function setError(error: string | null) {
  singletonState.error = error
  notifySubscribers()
}

function cleanupSingleton() {
  console.log('[Spotify Player Singleton] Cleaning up...')

  if (singletonState.player) {
    singletonState.player.disconnect()
    singletonState.player = null
  }

  if (singletonState.audio) {
    singletonState.audio.pause()
    singletonState.audio.src = ''
    singletonState.audio = null
  }

  if (singletonState.positionInterval) {
    clearInterval(singletonState.positionInterval)
    singletonState.positionInterval = null
  }

  singletonState.isReady = false
  singletonState.error = null
  singletonState.initialized = false
  singletonState.initializing = false
  singletonState.deviceTransferred = false
  singletonState.currentUserId = null
  singletonState.currentIsPremium = null

  // Reset play guards
  playInProgress = false
  lastPlayCall = null
  lastPlayTime = 0

  notifySubscribers()
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function convertTrack(spotifyTrack: SpotifySDKTrack): PlayerTrack {
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
}

async function getAccessToken(): Promise<string | null> {
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
}

async function transferPlayback(deviceId: string, token: string): Promise<boolean> {
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
        play: false,
      }),
    })
    console.log('[Spotify Player] Transfer response:', response.status)
    return response.ok || response.status === 204 || response.status === 404
  } catch (err) {
    console.error('[Spotify Player] Failed to transfer playback:', err)
    return false
  }
}

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

async function initializePremiumPlayer() {
  if (singletonState.initialized || singletonState.initializing) {
    console.log('[Spotify Player Singleton] Already initialized or initializing, skipping')
    return
  }
  singletonState.initializing = true
  notifySubscribers()

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

    // Create player instance
    const token = await getAccessToken()
    if (!token) {
      singletonState.initializing = false
      notifySubscribers()
      return
    }

    const store = usePlayerStore.getState()
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
      console.log('[Spotify Player Singleton] Ready with Device ID:', device_id)
      const s = usePlayerStore.getState()
      s.setDeviceId(device_id)
      s.setIsReady(true)
      s.setIsPremium(true)
      singletonState.isReady = true
      singletonState.error = null
      singletonState.deviceTransferred = false
      notifySubscribers()

      // Start position polling
      if (singletonState.positionInterval) {
        clearInterval(singletonState.positionInterval)
      }
      singletonState.positionInterval = setInterval(async () => {
        try {
          if (singletonState.player) {
            const state = await singletonState.player.getCurrentState()
            if (state && !state.paused) {
              usePlayerStore.getState().setPosition(state.position)
            }
          }
        } catch {
          // Silently ignore errors during position polling
        }
      }, 500)
    })

    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.warn('[Spotify Player Singleton] Device has gone offline:', device_id)
      usePlayerStore.getState().setIsReady(false)
      singletonState.isReady = false
      notifySubscribers()
    })

    player.addListener('player_state_changed', (state: SpotifyPlaybackState | null) => {
      if (!state) return
      const s = usePlayerStore.getState()
      const track = convertTrack(state.track_window.current_track)
      s.setTrack(track)
      s.setIsPlaying(!state.paused)
      s.setPosition(state.position)
    })

    player.addListener('initialization_error', ({ message }: WebPlaybackError) => {
      console.error('[Spotify Player Singleton] Initialization Error:', message)
      setError(`Initialization failed: ${message}`)
      singletonState.initialized = false
    })

    player.addListener('authentication_error', ({ message }: WebPlaybackError) => {
      console.error('[Spotify Player Singleton] Authentication Error:', message)
      setError(`Authentication failed: ${message}`)
    })

    player.addListener('account_error', ({ message }: WebPlaybackError) => {
      console.error('[Spotify Player Singleton] Account Error:', message)
      setError(`Account error: ${message}`)
    })

    player.addListener('playback_error', ({ message }: WebPlaybackError) => {
      console.error('[Spotify Player Singleton] Playback Error:', message)
      setError(`Playback failed: ${message}`)
    })

    // Connect to the player
    const connected = await player.connect()
    if (connected) {
      singletonState.player = player
      singletonState.initialized = true
      console.log('[Spotify Player Singleton] Successfully connected')
    } else {
      setError('Failed to connect to Spotify')
    }
  } catch (err) {
    console.error('[Spotify Player Singleton] Initialization error:', err)
    setError('Failed to initialize player')
  } finally {
    singletonState.initializing = false
    notifySubscribers()
  }
}

function initializeFreePlayer() {
  if (singletonState.initialized || singletonState.initializing) {
    console.log('[Spotify Player Singleton] Free player already initialized or initializing, skipping')
    return
  }
  singletonState.initializing = true
  notifySubscribers()

  try {
    if (!singletonState.audio) {
      const store = usePlayerStore.getState()
      singletonState.audio = new Audio()
      singletonState.audio.volume = store.volume / 100

      // Setup audio element event listeners
      singletonState.audio.addEventListener('play', () => {
        usePlayerStore.getState().setIsPlaying(true)
      })

      singletonState.audio.addEventListener('pause', () => {
        usePlayerStore.getState().setIsPlaying(false)
      })

      singletonState.audio.addEventListener('ended', () => {
        const s = usePlayerStore.getState()
        s.setIsPlaying(false)
        s.setPosition(0)
      })

      singletonState.audio.addEventListener('error', () => {
        console.error('Audio playback error')
        setError('Failed to play preview')
        usePlayerStore.getState().setIsPlaying(false)
      })

      singletonState.audio.addEventListener('loadedmetadata', () => {
        const s = usePlayerStore.getState()
        s.setPosition(0)
        if (singletonState.audio && singletonState.audio.duration && isFinite(singletonState.audio.duration)) {
          s.setDuration(singletonState.audio.duration * 1000)
        }
      })

      singletonState.audio.addEventListener('timeupdate', () => {
        if (singletonState.audio) {
          usePlayerStore.getState().setPosition(singletonState.audio.currentTime * 1000)
        }
      })
    }

    const s = usePlayerStore.getState()
    s.setIsReady(true)
    s.setIsPremium(false)
    singletonState.isReady = true
    singletonState.initialized = true
  } finally {
    singletonState.initializing = false
    notifySubscribers()
  }
}

// =============================================================================
// PLAYBACK CONTROL FUNCTIONS
// =============================================================================

async function play(uri?: string, isPremium?: boolean) {
  console.log('[Spotify Player] play() called with uri:', uri)

  if (playInProgress) {
    console.log('[Spotify Player] Play already in progress, skipping')
    return
  }

  // Debounce
  const playKey = uri || 'resume'
  const now = Date.now()
  if (lastPlayCall === playKey && now - lastPlayTime < 500) {
    console.log('[Spotify Player] Duplicate play call detected, skipping')
    return
  }
  lastPlayCall = playKey
  lastPlayTime = now
  playInProgress = true

  try {
    const store = usePlayerStore.getState()
    console.log('[Spotify Player] State check:', {
      isPremium,
      hasPlayer: !!singletonState.player,
      deviceId: store.deviceId,
      isReady: store.isReady,
    })

    if (isPremium && singletonState.player && store.deviceId) {
      const maxRetries = 2
      const deviceId = store.deviceId

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          if (!singletonState.player) {
            console.warn('[Spotify Player] Player became null, aborting')
            return
          }

          const token = await getAccessToken()
          if (!token) {
            setError('Authentication failed. Please log in again.')
            return
          }

          // Activate the player element
          try {
            await singletonState.player.activateElement()
            console.log('[Spotify Player] Player element activated')
          } catch (activateErr) {
            console.log('[Spotify Player] Activation note:', activateErr)
          }

          // Transfer device on first play or on retry
          if (!singletonState.deviceTransferred || attempt > 0) {
            console.log('[Spotify Player] Transferring device...', { firstPlay: !singletonState.deviceTransferred, attempt })
            const transferred = await transferPlayback(deviceId, token)
            if (transferred) {
              singletonState.deviceTransferred = true
              await new Promise((resolve) => setTimeout(resolve, 300))
            } else if (attempt === maxRetries) {
              throw new Error('Failed to transfer playback to this device')
            }
          }

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
            return
          }

          if (response.status === 404) {
            console.warn('[Spotify Player] Device not found (404), will retry with transfer')
            singletonState.deviceTransferred = false
            if (attempt < maxRetries) continue
          }

          if (response.status === 401) {
            console.warn('[Spotify Player] Token expired (401), retrying...')
            if (attempt < maxRetries) continue
          }

          if (response.status === 403) {
            const errorBody = await response.text()
            console.error('[Spotify Player] Forbidden (403):', errorBody)
            setError('Playback restricted. Make sure Spotify is not playing elsewhere.')
            return
          }

          if (response.status === 502 || response.status === 503) {
            console.warn('[Spotify Player] Spotify API error, retrying...')
            if (attempt < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 500))
              continue
            }
          }

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
    } else if (!isPremium && singletonState.audio) {
      if (uri) {
        singletonState.audio.src = uri
        try {
          await singletonState.audio.play()
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
        hasPlayer: !!singletonState.player,
        deviceId: store.deviceId,
        hasAudio: !!singletonState.audio,
      })
    }
  } finally {
    playInProgress = false
  }
}

async function pause(isPremium: boolean) {
  if (isPremium && singletonState.player) {
    try {
      await singletonState.player.pause()
      setError(null)
    } catch (err) {
      console.error('Pause error:', err)
      setError('Failed to pause')
    }
  } else if (!isPremium && singletonState.audio) {
    singletonState.audio.pause()
  }
}

async function resume(isPremium: boolean) {
  if (isPremium && singletonState.player) {
    try {
      await singletonState.player.resume()
      setError(null)
    } catch (err) {
      console.error('Resume error:', err)
      setError('Failed to resume')
    }
  } else if (!isPremium && singletonState.audio) {
    try {
      await singletonState.audio.play()
      setError(null)
    } catch (err) {
      console.error('Audio play error:', err)
      setError('Failed to play')
    }
  }
}

async function seek(positionMs: number, isPremium: boolean) {
  if (isPremium && singletonState.player) {
    try {
      await singletonState.player.seek(positionMs)
      setError(null)
    } catch (err) {
      console.error('Seek error:', err)
      setError('Failed to seek')
    }
  } else if (!isPremium && singletonState.audio) {
    singletonState.audio.currentTime = positionMs / 1000
  }
}

async function nextTrackFn(isPremium: boolean) {
  const store = usePlayerStore.getState()
  const { queue, queueIndex, repeatMode } = store

  if (repeatMode === 'track') {
    if (isPremium && singletonState.player) {
      await singletonState.player.seek(0)
    }
    store.setPosition(0)
    return
  }

  let nextIndex = queueIndex + 1

  if (nextIndex >= queue.length) {
    if (repeatMode === 'context') {
      nextIndex = 0
    } else {
      store.setIsPlaying(false)
      store.setPosition(0)
      return
    }
  }

  const nextTrackData = queue[nextIndex]
  if (!nextTrackData) return

  store.nextTrack()

  if (isPremium && singletonState.player && nextTrackData.uri) {
    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Authentication failed')
        return
      }

      const deviceId = usePlayerStore.getState().deviceId
      if (!deviceId) {
        setError('No device available')
        return
      }

      console.log('[Spotify Player] nextTrack - playing:', nextTrackData.uri)

      try {
        await singletonState.player.activateElement()
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

        if (response.status === 404) {
          console.log('[Spotify Player] Device not found, transferring playback...')
          await transferPlayback(deviceId, token)
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
  } else if (!isPremium && singletonState.audio && nextTrackData.previewUrl) {
    singletonState.audio.src = nextTrackData.previewUrl
    try {
      await singletonState.audio.play()
      setError(null)
    } catch (err) {
      console.error('Audio play error:', err)
      setError('Failed to play preview')
    }
  }
}

async function previousTrackFn(isPremium: boolean) {
  const store = usePlayerStore.getState()
  const { queue, queueIndex, position } = store

  if (position > 3000) {
    if (isPremium && singletonState.player) {
      try {
        await singletonState.player.seek(0)
        setError(null)
      } catch (err) {
        console.error('Seek error:', err)
      }
    } else if (!isPremium && singletonState.audio) {
      singletonState.audio.currentTime = 0
    }
    store.setPosition(0)
    return
  }

  const prevIndex = Math.max(0, queueIndex - 1)

  if (prevIndex === queueIndex) {
    if (isPremium && singletonState.player) {
      try {
        await singletonState.player.seek(0)
        setError(null)
      } catch (err) {
        console.error('Seek error:', err)
      }
    } else if (!isPremium && singletonState.audio) {
      singletonState.audio.currentTime = 0
    }
    store.setPosition(0)
    return
  }

  const prevTrackData = queue[prevIndex]
  if (!prevTrackData) return

  store.previousTrack()

  if (isPremium && singletonState.player && prevTrackData.uri) {
    try {
      const token = await getAccessToken()
      if (!token) {
        setError('Authentication failed')
        return
      }

      const deviceId = usePlayerStore.getState().deviceId
      if (!deviceId) {
        setError('No device available')
        return
      }

      console.log('[Spotify Player] previousTrack - playing:', prevTrackData.uri)

      try {
        await singletonState.player.activateElement()
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

        if (response.status === 404) {
          console.log('[Spotify Player] Device not found, transferring playback...')
          await transferPlayback(deviceId, token)
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
  } else if (!isPremium && singletonState.audio && prevTrackData.previewUrl) {
    singletonState.audio.src = prevTrackData.previewUrl
    try {
      await singletonState.audio.play()
      setError(null)
    } catch (err) {
      console.error('Audio play error:', err)
      setError('Failed to play preview')
    }
  }
}

async function setVolumeFn(volume: number, isPremium: boolean) {
  const clampedVolume = Math.max(0, Math.min(100, volume))
  usePlayerStore.getState().setVolume(clampedVolume)

  if (isPremium && singletonState.player) {
    try {
      await singletonState.player.setVolume(clampedVolume / 100)
      setError(null)
    } catch (err) {
      console.error('Set volume error:', err)
      setError('Failed to set volume')
    }
  } else if (!isPremium && singletonState.audio) {
    singletonState.audio.volume = clampedVolume / 100
  }
}

// =============================================================================
// THE HOOK
// =============================================================================

export function useSpotifyPlayer(): UseSpotifyPlayerReturn {
  const user = useAuthStore((state) => state.user)
  const isPremium = user?.spotifyPremium ?? false

  // Subscribe to singleton state changes using useSyncExternalStore
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // Initialize player when user/premium status changes
  useEffect(() => {
    if (!user) return

    // Check if we need to reinitialize (user or premium status changed)
    const needsReinit =
      singletonState.currentUserId !== user.id ||
      singletonState.currentIsPremium !== isPremium

    if (needsReinit && singletonState.initialized) {
      console.log('[Spotify Player Hook] User or premium status changed, reinitializing...')
      cleanupSingleton()
    }

    // Update tracking
    singletonState.currentUserId = user.id
    singletonState.currentIsPremium = isPremium

    // Initialize appropriate player
    if (isPremium) {
      initializePremiumPlayer()
    } else {
      initializeFreePlayer()
    }
  }, [user?.id, isPremium])

  // Create stable callback references
  const playFn = useCallback(
    async (uri?: string) => {
      if (!user) {
        setError('Please log in to play music')
        return
      }
      await play(uri, isPremium)
    },
    [user, isPremium]
  )

  const pauseFn = useCallback(async () => {
    await pause(isPremium)
  }, [isPremium])

  const resumeFn = useCallback(async () => {
    await resume(isPremium)
  }, [isPremium])

  const seekFn = useCallback(
    async (positionMs: number) => {
      await seek(positionMs, isPremium)
    },
    [isPremium]
  )

  const nextTrackCallback = useCallback(async () => {
    await nextTrackFn(isPremium)
  }, [isPremium])

  const previousTrackCallback = useCallback(async () => {
    await previousTrackFn(isPremium)
  }, [isPremium])

  const setVolumeCallback = useCallback(
    async (volume: number) => {
      await setVolumeFn(volume, isPremium)
    },
    [isPremium]
  )

  return {
    isReady: state.isReady,
    isPremium,
    play: playFn,
    pause: pauseFn,
    resume: resumeFn,
    seek: seekFn,
    nextTrack: nextTrackCallback,
    previousTrack: previousTrackCallback,
    setVolume: setVolumeCallback,
    error: state.error,
  }
}
