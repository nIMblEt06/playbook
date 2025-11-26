import { mockUsers } from './users.js';

export const mockCommunities = {
  userCommunity: {
    id: 'community-1-id',
    slug: 'indierock',
    type: 'user' as const,
    name: 'Indie Rock',
    description: 'A community for indie rock enthusiasts',
    rules: 'Be respectful. Share great music.',
    coverImageUrl: 'https://example.com/indierock-cover.jpg',
    creatorId: mockUsers.user1.id,
    memberCount: 150,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
  },
  artistCommunity: {
    id: 'community-2-id',
    slug: 'theartist',
    type: 'artist' as const,
    name: 'The Artist',
    description: 'Official community for The Artist',
    rules: null,
    coverImageUrl: 'https://example.com/artist-cover.jpg',
    creatorId: mockUsers.artistUser.id,
    memberCount: 500,
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
  },
  vibeCommunity: {
    id: 'community-3-id',
    slug: 'latenightsounds',
    type: 'user' as const,
    name: 'Late Night Sounds',
    description: 'Music for late night vibes',
    rules: 'Keep it chill.',
    coverImageUrl: null,
    creatorId: mockUsers.user2.id,
    memberCount: 75,
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
  },
};

export const mockCommunityWithCounts = {
  ...mockCommunities.userCommunity,
  creator: {
    id: mockUsers.user1.id,
    username: mockUsers.user1.username,
    displayName: mockUsers.user1.displayName,
    avatarUrl: mockUsers.user1.avatarUrl,
  },
  _count: {
    members: 150,
    posts: 42,
  },
};

export const mockMembership = {
  id: 'membership-1-id',
  userId: mockUsers.user1.id,
  communityId: mockCommunities.userCommunity.id,
  role: 'creator' as const,
  joinedAt: new Date('2024-01-05'),
};

export const validCreateCommunityInput = {
  slug: 'newcommunity',
  name: 'New Community',
  description: 'A brand new community for music lovers',
  rules: 'Be kind and share great music!',
  coverImageUrl: null,
  type: 'user' as const,
};
