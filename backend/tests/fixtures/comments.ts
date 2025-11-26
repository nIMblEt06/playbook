import { mockUsers } from './users.js';
import { mockPosts } from './posts.js';

export const mockComments = {
  comment1: {
    id: 'comment-1-id',
    postId: mockPosts.post1.id,
    authorId: mockUsers.user2.id,
    parentCommentId: null,
    content: 'Absolutely love this track! The synths are incredible.',
    upvoteCount: 5,
    createdAt: new Date('2024-01-10T10:00:00'),
    updatedAt: new Date('2024-01-10T10:00:00'),
  },
  comment2: {
    id: 'comment-2-id',
    postId: mockPosts.post1.id,
    authorId: mockUsers.artistUser.id,
    parentCommentId: null,
    content: 'Great find! Adding this to my playlist.',
    upvoteCount: 3,
    createdAt: new Date('2024-01-10T11:00:00'),
    updatedAt: new Date('2024-01-10T11:00:00'),
  },
  reply1: {
    id: 'comment-3-id',
    postId: mockPosts.post1.id,
    authorId: mockUsers.user1.id,
    parentCommentId: 'comment-1-id',
    content: 'Right?! The production quality is top notch.',
    upvoteCount: 2,
    createdAt: new Date('2024-01-10T12:00:00'),
    updatedAt: new Date('2024-01-10T12:00:00'),
  },
};

export const mockCommentWithAuthor = {
  ...mockComments.comment1,
  author: {
    id: mockUsers.user2.id,
    username: mockUsers.user2.username,
    displayName: mockUsers.user2.displayName,
    avatarUrl: mockUsers.user2.avatarUrl,
    isArtist: mockUsers.user2.isArtist,
  },
  replies: [],
  _count: {
    replies: 1,
    upvotes: 5,
  },
};

export const validCreateCommentInput = {
  content: 'This is a thoughtful comment about the music.',
  parentCommentId: null,
};

export const validReplyInput = {
  content: 'I agree with your take!',
  parentCommentId: 'comment-1-id',
};
