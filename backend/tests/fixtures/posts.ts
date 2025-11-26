import { mockUsers } from './users.js';

export const mockPosts = {
  post1: {
    id: 'post-1-id',
    authorId: mockUsers.user1.id,
    content: 'Check out this amazing track! The production is incredible.',
    linkUrl: 'https://open.spotify.com/track/123',
    linkType: 'track' as const,
    tags: ['indie', 'electronic'],
    upvoteCount: 15,
    commentCount: 3,
    isNewAndUpcoming: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  post2: {
    id: 'post-2-id',
    authorId: mockUsers.user2.id,
    content: 'New album drop - this is a masterpiece!',
    linkUrl: 'https://open.spotify.com/album/456',
    linkType: 'album' as const,
    tags: ['hiphop', 'rap'],
    upvoteCount: 42,
    commentCount: 12,
    isNewAndUpcoming: false,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
  },
  newAndUpcomingPost: {
    id: 'post-3-id',
    authorId: mockUsers.artistUser.id,
    content: 'Just released my new single! Would love to hear your thoughts.',
    linkUrl: 'https://soundcloud.com/theartist/newsingle',
    linkType: 'track' as const,
    tags: ['newandupcoming', 'indie'],
    upvoteCount: 8,
    commentCount: 5,
    isNewAndUpcoming: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  textPost: {
    id: 'post-4-id',
    authorId: mockUsers.user1.id,
    content: 'What are your favorite albums of 2024 so far?',
    linkUrl: null,
    linkType: null,
    tags: ['discussion'],
    upvoteCount: 25,
    commentCount: 45,
    isNewAndUpcoming: false,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
};

export const mockPostWithAuthor = {
  ...mockPosts.post1,
  author: {
    id: mockUsers.user1.id,
    username: mockUsers.user1.username,
    displayName: mockUsers.user1.displayName,
    avatarUrl: mockUsers.user1.avatarUrl,
    isArtist: mockUsers.user1.isArtist,
  },
  communities: [],
  _count: {
    comments: 3,
    upvotes: 15,
  },
};

export const validCreatePostInput = {
  content: 'This is a great track that everyone should hear!',
  linkUrl: 'https://open.spotify.com/track/abc123',
  linkType: 'track' as const,
  tags: ['indie', 'rock'],
  communityIds: [],
  isNewAndUpcoming: false,
};
