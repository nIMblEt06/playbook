// User types
export interface User {
  id: string
  username: string
  displayName: string
  email: string
  bio: string | null
  avatarUrl: string | null
  isArtist: boolean
  artistName: string | null
  streamingLinks: {
    spotify?: string
    appleMusic?: string
    soundcloud?: string
    bandcamp?: string
    youtube?: string
  }
  createdAt: string
  updatedAt: string
  _count?: {
    followers: number
    following: number
    posts: number
  }
}

// Post types
export type LinkType = 'track' | 'album' | 'playlist'

export interface Post {
  id: string
  authorId: string
  content: string
  linkUrl: string | null
  linkType: LinkType | null
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
export type CommunityType = 'artist' | 'user'

export interface Community {
  id: string
  slug: string
  type: CommunityType
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
  streamingLinks?: User['streamingLinks']
}

export interface CreateCommunityRequest {
  slug: string
  type: CommunityType
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
