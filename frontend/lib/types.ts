// User types
export type AvatarType = 'custom' | 'pixel'

export interface User {
  id: string
  username: string
  displayName: string
  email: string
  bio: string | null
  avatarUrl: string | null
  avatarType: AvatarType
  pixelAvatarId: number | null
  isArtist: boolean
  artistName: string | null
  spotifyId: string
  spotifyPremium: boolean
  spotifyTokenExpiry: string
  streamingLinks: {
    spotify?: string
    appleMusic?: string
    soundcloud?: string
    bandcamp?: string
    youtube?: string
  }
  createdAt: string
  updatedAt: string
  isFollowing?: boolean
  _count?: {
    followers: number
    following: number
    posts: number
  }
}

// Post types
export type LinkType = 'track' | 'album' | 'playlist'

export interface LinkMetadata {
  title?: string
  artist?: string
  albumName?: string
  imageUrl?: string
  platform?: string
  embedUrl?: string
}

export interface Post {
  id: string
  authorId: string
  content: string
  linkUrl: string | null
  linkType: LinkType | null
  linkMetadata?: LinkMetadata | null
  tags: string[]
  upvoteCount: number
  commentCount: number
  isNewAndUpcoming: boolean
  createdAt: string
  updatedAt: string
  author: User
  hasUpvoted?: boolean
  hasSaved?: boolean
  communities?: Community[]
}

// Community types
export interface Community {
  id: string
  slug: string
  name: string
  description: string | null
  rules: string | null
  coverImageUrl: string | null
  creatorId: string
  memberCount: number
  createdAt: string
  updatedAt: string
  isMember?: boolean
}

// Comment types
export interface Comment {
  id: string
  postId: string
  authorId: string
  parentCommentId: string | null
  content: string
  upvoteCount: number
  createdAt: string
  updatedAt: string
  author: User
  replies?: Comment[]
  hasUpvoted?: boolean
}

// Reputation types
export type ReputationTier = 'newcomer' | 'regular' | 'trusted' | 'curator'

export interface Reputation {
  id: string
  userId: string
  communityId: string
  score: number
  tier: ReputationTier
  updatedAt: string
}

// Playlist types
export interface Playlist {
  id: string
  ownerId: string
  name: string
  description: string | null
  coverImageUrl: string | null
  isPublic: boolean
  trackCount: number
  createdAt: string
  updatedAt: string
  owner?: User
  tracks?: PlaylistTrack[]
}

export interface PlaylistTrack {
  id: string
  playlistId: string
  linkUrl: string
  title: string
  artist: string
  position: number
  addedAt: string
}

// Notification types
export type NotificationType =
  | 'follow'
  | 'upvote_post'
  | 'upvote_comment'
  | 'comment'
  | 'reply'
  | 'mention'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  actorId: string
  targetType: string
  targetId: string
  isRead: boolean
  createdAt: string
  actor: User
  post?: {
    id: string
    author: {
      id: string
      username: string
      displayName: string
    }
  } | null
}

// API request/response types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  displayName: string
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface CreatePostRequest {
  content: string
  linkUrl?: string
  linkType?: LinkType
  tags?: string[]
  communityIds?: string[]
  isNewAndUpcoming?: boolean
}

export interface UpdateProfileRequest {
  displayName?: string
  bio?: string
  avatarUrl?: string
  avatarType?: AvatarType
  pixelAvatarId?: number | null
  streamingLinks?: User['streamingLinks']
}

export interface CreateCommunityRequest {
  slug: string
  name: string
  description?: string
  rules?: string
  coverImageUrl?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// Activity types (reviews/ratings from followed users)
export type ReviewTargetType = 'album' | 'track' | 'artist'

export interface ActivityAlbum {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverImageUrl: string | null
}

export interface ActivityTrack {
  id: string
  spotifyId: string
  title: string
  artistName: string
}

export interface ActivityArtist {
  id: string
  spotifyId: string
  name: string
  imageUrl: string | null
}

export interface ActivityItem {
  id: string
  authorId: string
  targetType: ReviewTargetType
  albumId: string | null
  trackId: string | null
  artistId: string | null
  rating: number | null
  title: string | null
  content: string | null
  upvoteCount: number
  commentCount: number
  createdAt: string
  updatedAt: string
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isArtist: boolean
  }
  album: ActivityAlbum | null
  track: ActivityTrack | null
  artist: ActivityArtist | null
  hasUpvoted?: boolean
}
