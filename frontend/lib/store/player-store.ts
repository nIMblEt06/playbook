import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PlayerTrack {
  id: string           // Spotify track ID
  uri: string          // Spotify URI (spotify:track:xxx)
  name: string
  artists: string[]
  albumName: string
  albumId: string
  coverUrl: string | null
  duration: number     // in ms
  previewUrl: string | null  // 30-sec preview for non-premium
}

interface PlayerState {
  // Current state
  currentTrack: PlayerTrack | null
  queue: PlayerTrack[]
  queueIndex: number
  isPlaying: boolean
  position: number      // Current position in ms
  duration: number      // Track duration in ms
  volume: number        // 0-100
  isMuted: boolean
  isShuffled: boolean
  repeatMode: 'off' | 'track' | 'context'

  // Device/SDK state
  deviceId: string | null
  isReady: boolean
  isPremium: boolean
  pendingPlay: boolean  // True when playback requested but SDK not ready yet
  _hasHydrated: boolean

  // Actions
  setTrack: (track: PlayerTrack) => void
  setQueue: (tracks: PlayerTrack[], startIndex?: number) => void
  addToQueue: (track: PlayerTrack) => void
  clearQueue: () => void

  play: () => void
  pause: () => void
  togglePlay: () => void
  nextTrack: () => void
  previousTrack: () => void

  setPosition: (position: number) => void
  setVolume: (volume: number) => void
  toggleMute: () => void
  toggleShuffle: () => void
  cycleRepeatMode: () => void

  setDeviceId: (deviceId: string | null) => void
  setIsReady: (ready: boolean) => void
  setIsPremium: (premium: boolean) => void
  setIsPlaying: (playing: boolean) => void
  setPendingPlay: (pending: boolean) => void
  setHasHydrated: (hasHydrated: boolean) => void
  setDuration: (duration: number) => void

  // Helper to play a track immediately
  playTrack: (track: PlayerTrack, queue?: PlayerTrack[]) => void
  playAlbum: (tracks: PlayerTrack[], startIndex?: number) => void

  // Reset player state
  reset: () => void
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      position: 0,
      duration: 0,
      volume: 50,
      isMuted: false,
      isShuffled: false,
      repeatMode: 'off',
      deviceId: null,
      isReady: false,
      isPremium: false,
      pendingPlay: false,
      _hasHydrated: false,

      // Actions
      setTrack: (track) => set({
        currentTrack: track,
        duration: track.duration,
        position: 0
      }),

      setQueue: (tracks, startIndex = 0) => set({
        queue: tracks,
        queueIndex: startIndex,
        currentTrack: tracks[startIndex] || null
      }),

      addToQueue: (track) => set((state) => ({
        queue: [...state.queue, track]
      })),

      clearQueue: () => set({
        queue: [],
        queueIndex: 0,
        currentTrack: null,
        isPlaying: false
      }),

      play: () => set({ isPlaying: true }),

      pause: () => set({ isPlaying: false }),

      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

      nextTrack: () => set((state) => {
        const { queue, queueIndex, repeatMode } = state

        // If repeat track is enabled, keep current track
        if (repeatMode === 'track') {
          return { position: 0 }
        }

        // Calculate next index
        let nextIndex = queueIndex + 1

        // If at end of queue
        if (nextIndex >= queue.length) {
          // If repeat context is enabled, go to start
          if (repeatMode === 'context') {
            nextIndex = 0
          } else {
            // Stop playback at end
            return {
              isPlaying: false,
              position: 0
            }
          }
        }

        const nextTrack = queue[nextIndex]
        return {
          queueIndex: nextIndex,
          currentTrack: nextTrack || null,
          position: 0,
          duration: nextTrack?.duration || 0
        }
      }),

      previousTrack: () => set((state) => {
        const { queue, queueIndex, position } = state

        // If more than 3 seconds into track, restart current track
        if (position > 3000) {
          return { position: 0 }
        }

        // Go to previous track
        const prevIndex = Math.max(0, queueIndex - 1)
        const prevTrack = queue[prevIndex]

        return {
          queueIndex: prevIndex,
          currentTrack: prevTrack || null,
          position: 0,
          duration: prevTrack?.duration || 0
        }
      }),

      setPosition: (position) => set({ position }),

      setVolume: (volume) => set({
        volume: Math.max(0, Math.min(100, volume)),
        isMuted: false
      }),

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),

      cycleRepeatMode: () => set((state) => {
        const modes: Array<'off' | 'track' | 'context'> = ['off', 'context', 'track']
        const currentIndex = modes.indexOf(state.repeatMode)
        const nextIndex = (currentIndex + 1) % modes.length
        return { repeatMode: modes[nextIndex] }
      }),

      setDeviceId: (deviceId) => set({ deviceId }),

      setIsReady: (ready) => set({ isReady: ready }),

      setIsPremium: (premium) => set({ isPremium: premium }),

      setIsPlaying: (playing) => set({ isPlaying: playing }),

      setPendingPlay: (pending) => set({ pendingPlay: pending }),

      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),

      setDuration: (duration) => set({ duration }),

      // Helper methods
      playTrack: (track, queue) => set((state) => {
        if (queue && queue.length > 0) {
          // Find the track index in the queue
          const trackIndex = queue.findIndex(t => t.id === track.id)
          return {
            currentTrack: track,
            queue: queue,
            queueIndex: trackIndex >= 0 ? trackIndex : 0,
            isPlaying: true,
            pendingPlay: true,  // Mark playback as pending for SDK
            position: 0,
            duration: track.duration
          }
        } else {
          // Play single track
          return {
            currentTrack: track,
            queue: [track],
            queueIndex: 0,
            isPlaying: true,
            pendingPlay: true,  // Mark playback as pending for SDK
            position: 0,
            duration: track.duration
          }
        }
      }),

      playAlbum: (tracks, startIndex = 0) => set((state) => {
        const startTrack = tracks[startIndex]
        return {
          currentTrack: startTrack || null,
          queue: tracks,
          queueIndex: startIndex,
          isPlaying: true,
          pendingPlay: true,  // Mark playback as pending for SDK
          position: 0,
          duration: startTrack?.duration || 0
        }
      }),

      reset: () => set({
        currentTrack: null,
        queue: [],
        queueIndex: 0,
        isPlaying: false,
        position: 0,
        duration: 0,
        deviceId: null,
        isReady: false,
      }),
    }),
    {
      name: 'player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
