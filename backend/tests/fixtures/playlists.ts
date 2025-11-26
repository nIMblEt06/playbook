import { mockUsers } from './users.js';

export const mockPlaylists = {
  playlist1: {
    id: 'playlist-1-id',
    ownerId: mockUsers.user1.id,
    name: 'Chill Vibes',
    description: 'Perfect for relaxing',
    coverImageUrl: 'https://example.com/playlist1.jpg',
    isPublic: true,
    trackCount: 15,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  playlist2: {
    id: 'playlist-2-id',
    ownerId: mockUsers.user1.id,
    name: 'Workout Mix',
    description: 'High energy tracks',
    coverImageUrl: null,
    isPublic: true,
    trackCount: 20,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
  },
  privatePlaylist: {
    id: 'playlist-3-id',
    ownerId: mockUsers.user2.id,
    name: 'Private Collection',
    description: 'My secret finds',
    coverImageUrl: null,
    isPublic: false,
    trackCount: 5,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
  },
};

export const mockPlaylistTracks = {
  track1: {
    id: 'track-1-id',
    playlistId: mockPlaylists.playlist1.id,
    linkUrl: 'https://open.spotify.com/track/abc',
    title: 'Chill Song',
    artist: 'Chill Artist',
    position: 0,
    addedAt: new Date('2024-01-15'),
  },
  track2: {
    id: 'track-2-id',
    playlistId: mockPlaylists.playlist1.id,
    linkUrl: 'https://open.spotify.com/track/def',
    title: 'Relaxing Tune',
    artist: 'Ambient Producer',
    position: 1,
    addedAt: new Date('2024-01-15'),
  },
};

export const mockPlaylistWithTracks = {
  ...mockPlaylists.playlist1,
  owner: {
    id: mockUsers.user1.id,
    username: mockUsers.user1.username,
    displayName: mockUsers.user1.displayName,
    avatarUrl: mockUsers.user1.avatarUrl,
  },
  tracks: [mockPlaylistTracks.track1, mockPlaylistTracks.track2],
};

export const validCreatePlaylistInput = {
  name: 'New Playlist',
  description: 'A brand new playlist',
  coverImageUrl: null,
  isPublic: true,
};

export const validAddTrackInput = {
  linkUrl: 'https://open.spotify.com/track/xyz',
  title: 'New Track',
  artist: 'New Artist',
  position: 0,
};
