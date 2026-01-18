import { prisma } from '../utils/prisma.js';
import * as albumService from './album.service.js';
import * as artistService from './artist.service.js';
import type { Review, ReviewComment, Rating, ReviewTargetType } from '@prisma/client';

export type ReviewSortOption = 'recent' | 'engaged' | 'rating_high' | 'rating_low';
export type CommentSortOption = 'recent' | 'engaged';

interface CreateReviewInput {
  authorId: string;
  targetType: ReviewTargetType;
  albumId?: string;
  trackId?: string;
  artistId?: string;
  rating?: number;
  title?: string;
  content?: string;
}

interface CreateCommentInput {
  reviewId: string;
  authorId: string;
  content: string;
  parentId?: string;
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================
// Review CRUD
// ============================================

/**
 * Create or update a review
 */
export async function createOrUpdateReview(input: CreateReviewInput): Promise<Review> {
  const { authorId, targetType, albumId, trackId, artistId, rating, title, content } = input;

  // Validate rating if provided
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Build unique constraint check based on target type
  let existingReview: Review | null = null;

  if (albumId) {
    existingReview = await prisma.review.findUnique({
      where: { authorId_albumId: { authorId, albumId } },
    });
  } else if (trackId) {
    existingReview = await prisma.review.findUnique({
      where: { authorId_trackId: { authorId, trackId } },
    });
  } else if (artistId) {
    existingReview = await prisma.review.findUnique({
      where: { authorId_artistId: { authorId, artistId } },
    });
  }

  let review: Review;

  if (existingReview) {
    // Update existing review
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating,
        title,
        content,
      },
    });

    // Update rating stats if rating changed
    if (rating !== existingReview.rating) {
      if (albumId) {
        await albumService.updateAlbumRatingStats(albumId);
      }
    }
  } else {
    // Create new review
    review = await prisma.review.create({
      data: {
        authorId,
        targetType,
        albumId,
        trackId,
        artistId,
        rating,
        title,
        content,
      },
    });

    // Delete any standalone rating since we now have a review
    // (the review's rating takes precedence)
    if (albumId) {
      await prisma.rating.deleteMany({
        where: { userId: authorId, albumId },
      });
    } else if (trackId) {
      await prisma.rating.deleteMany({
        where: { userId: authorId, trackId },
      });
    }

    // Update review count on target
    if (albumId) {
      await albumService.updateAlbumReviewCount(albumId);
      await albumService.updateAlbumRatingStats(albumId);
    } else if (artistId) {
      await artistService.updateArtistReviewCount(artistId);
    }
  }

  return review;
}

/**
 * Get a review by ID with author info
 */
export async function getReviewById(reviewId: string, currentUserId?: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          avatarType: true,
          pixelAvatarId: true,
        },
      },
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverImageUrl: true,
        },
      },
      track: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
        },
      },
      artist: {
        select: {
          id: true,
          spotifyId: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  if (!review) return null;

  // Check if current user has upvoted
  let hasUpvoted = false;
  if (currentUserId) {
    const upvote = await prisma.upvote.findUnique({
      where: {
        userId_targetType_targetId: {
          userId: currentUserId,
          targetType: 'review',
          targetId: reviewId,
        },
      },
    });
    hasUpvoted = !!upvote;
  }

  return { ...review, hasUpvoted };
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string, authorId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.authorId !== authorId) {
    throw new Error('Not authorized to delete this review');
  }

  await prisma.review.delete({
    where: { id: reviewId },
  });

  // Update review count on target
  if (review.albumId) {
    await albumService.updateAlbumReviewCount(review.albumId);
  } else if (review.artistId) {
    await artistService.updateArtistReviewCount(review.artistId);
  }
}

/**
 * Get reviews for an album
 */
export async function getAlbumReviews(
  albumId: string,
  page: number = 1,
  limit: number = 20,
  sort: ReviewSortOption = 'recent',
  currentUserId?: string
): Promise<PaginatedResult<Review & { hasUpvoted: boolean }>> {
  const offset = (page - 1) * limit;

  // Build orderBy based on sort option
  const orderBy = getReviewOrderBy(sort);

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { albumId },
      orderBy,
      skip: offset,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            avatarType: true,
            pixelAvatarId: true,
          },
        },
      },
    }),
    prisma.review.count({ where: { albumId } }),
  ]);

  // Check upvotes if user is logged in
  let itemsWithUpvotes = items.map((item) => ({ ...item, hasUpvoted: false }));

  if (currentUserId && items.length > 0) {
    const upvotes = await prisma.upvote.findMany({
      where: {
        userId: currentUserId,
        targetType: 'review',
        targetId: { in: items.map((i) => i.id) },
      },
    });
    const upvotedIds = new Set(upvotes.map((u) => u.targetId));
    itemsWithUpvotes = items.map((item) => ({
      ...item,
      hasUpvoted: upvotedIds.has(item.id),
    }));
  }

  return {
    items: itemsWithUpvotes,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  };
}

/**
 * Get reviews for an artist
 */
export async function getArtistReviews(
  artistId: string,
  page: number = 1,
  limit: number = 20,
  sort: ReviewSortOption = 'recent',
  currentUserId?: string
): Promise<PaginatedResult<Review & { hasUpvoted: boolean }>> {
  const offset = (page - 1) * limit;
  const orderBy = getReviewOrderBy(sort);

  const [items, total] = await Promise.all([
    prisma.review.findMany({
      where: { artistId },
      orderBy,
      skip: offset,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            avatarType: true,
            pixelAvatarId: true,
          },
        },
      },
    }),
    prisma.review.count({ where: { artistId } }),
  ]);

  let itemsWithUpvotes = items.map((item) => ({ ...item, hasUpvoted: false }));

  if (currentUserId && items.length > 0) {
    const upvotes = await prisma.upvote.findMany({
      where: {
        userId: currentUserId,
        targetType: 'review',
        targetId: { in: items.map((i) => i.id) },
      },
    });
    const upvotedIds = new Set(upvotes.map((u) => u.targetId));
    itemsWithUpvotes = items.map((item) => ({
      ...item,
      hasUpvoted: upvotedIds.has(item.id),
    }));
  }

  return {
    items: itemsWithUpvotes,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  };
}

/**
 * Get popular reviews (for homepage)
 */
export async function getPopularReviews(
  timeframe: 'day' | 'week' | 'month' = 'week',
  limit: number = 10,
  currentUserId?: string
) {
  const now = new Date();
  let startDate: Date;

  switch (timeframe) {
    case 'day':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const reviews = await prisma.review.findMany({
    where: {
      createdAt: { gte: startDate },
      content: { not: null }, // Only reviews with actual content
    },
    orderBy: [{ upvoteCount: 'desc' }, { commentCount: 'desc' }],
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          avatarType: true,
          pixelAvatarId: true,
        },
      },
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverImageUrl: true,
        },
      },
    },
  });

  // Add hasUpvoted field if user is logged in
  let reviewsWithUpvotes = reviews.map((review) => ({ ...review, hasUpvoted: false }));

  if (currentUserId && reviews.length > 0) {
    const reviewIds = reviews.map((r) => r.id);
    const upvotes = await prisma.upvote.findMany({
      where: {
        userId: currentUserId,
        targetType: 'review',
        targetId: { in: reviewIds },
      },
      select: { targetId: true },
    });

    const upvotedIds = new Set(upvotes.map((u) => u.targetId));
    reviewsWithUpvotes = reviews.map((review) => ({
      ...review,
      hasUpvoted: upvotedIds.has(review.id),
    }));
  }

  return reviewsWithUpvotes;
}


// Get all reviews with pagination, ordered by upvotes descending
export async function getAllReviewsPaginated(
  page: number = 1,
  limit: number = 20
): Promise<PaginatedResult<{
  id: string;
  rating: number | null;
  title: string | null;
  content: string | null;
  upvoteCount: number;
  commentCount: number;
  createdAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    avatarType: string | null;
    pixelAvatarId: number | null;
  };
  album: {
    id: string;
    spotifyId: string | null;
    title: string;
    artistName: string | null;
    coverImageUrl: string | null;
  } | null;
}>> {
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: {
        content: { not: null }, // Only reviews with actual content
      },
      orderBy: [{ upvoteCount: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            avatarType: true,
            pixelAvatarId: true,
          },
        },
        album: {
          select: {
            id: true,
            spotifyId: true,
            title: true,
            artistName: true,
            coverImageUrl: true,
          },
        },
      },
    }),
    prisma.review.count({
      where: {
        content: { not: null },
      },
    }),
  ]);

  return {
    items: reviews,
    total,
    page,
    limit,
    hasMore: skip + reviews.length < total,
  };
}

// Helper to build orderBy for reviews
function getReviewOrderBy(sort: ReviewSortOption) {
  switch (sort) {
    case 'engaged':
      return [{ upvoteCount: 'desc' as const }, { commentCount: 'desc' as const }];
    case 'rating_high':
      return [{ rating: 'desc' as const }];
    case 'rating_low':
      return [{ rating: 'asc' as const }];
    case 'recent':
    default:
      return [{ createdAt: 'desc' as const }];
  }
}

// ============================================
// Review Comments (Threaded)
// ============================================

/**
 * Create a comment on a review
 */
export async function createComment(input: CreateCommentInput): Promise<ReviewComment> {
  const { reviewId, authorId, content, parentId } = input;

  // Calculate depth if this is a reply
  let depth = 0;
  if (parentId) {
    const parent = await prisma.reviewComment.findUnique({
      where: { id: parentId },
    });
    if (parent) {
      depth = parent.depth + 1;
    }
  }

  const comment = await prisma.reviewComment.create({
    data: {
      reviewId,
      authorId,
      content,
      parentId,
      depth,
    },
  });

  // Update comment count on review
  await prisma.review.update({
    where: { id: reviewId },
    data: { commentCount: { increment: 1 } },
  });

  return comment;
}

/**
 * Get comments for a review (threaded)
 */
export async function getReviewComments(
  reviewId: string,
  page: number = 1,
  limit: number = 50,
  sort: CommentSortOption = 'recent',
  currentUserId?: string
) {
  const offset = (page - 1) * limit;

  // Build orderBy
  const orderBy =
    sort === 'engaged'
      ? [{ upvoteCount: 'desc' as const }]
      : [{ createdAt: 'desc' as const }];

  // Get top-level comments only
  const [items, total] = await Promise.all([
    prisma.reviewComment.findMany({
      where: { reviewId, parentId: null },
      orderBy,
      skip: offset,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            avatarType: true,
            pixelAvatarId: true,
          },
        },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                avatarType: true,
                pixelAvatarId: true,
              },
            },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    avatarType: true,
                    pixelAvatarId: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.reviewComment.count({ where: { reviewId, parentId: null } }),
  ]);

  // Check upvotes for all comments (including nested)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let itemsWithUpvotes: any[] = items.map((item) => ({ ...item, hasUpvoted: false }));

  if (currentUserId && items.length > 0) {
    // Collect all comment IDs (including nested)
    const allIds: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const collectIds = (comments: any[]) => {
      for (const comment of comments) {
        allIds.push(comment.id);
        if (comment.replies) {
          collectIds(comment.replies);
        }
      }
    };
    collectIds(items);

    const upvotes = await prisma.upvote.findMany({
      where: {
        userId: currentUserId,
        targetType: 'review_comment',
        targetId: { in: allIds },
      },
    });
    const upvotedIds = new Set(upvotes.map((u) => u.targetId));

    // Mark upvoted comments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const markUpvoted = (comments: any[]): any[] => {
      return comments.map((comment) => ({
        ...comment,
        hasUpvoted: upvotedIds.has(comment.id),
        replies: comment.replies ? markUpvoted(comment.replies) : undefined,
      }));
    };
    itemsWithUpvotes = markUpvoted(itemsWithUpvotes);
  }

  return {
    items: itemsWithUpvotes,
    total,
    page,
    limit,
    hasMore: offset + items.length < total,
  };
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string, authorId: string): Promise<void> {
  const comment = await prisma.reviewComment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.authorId !== authorId) {
    throw new Error('Not authorized to delete this comment');
  }

  await prisma.reviewComment.delete({
    where: { id: commentId },
  });

  // Update comment count on review
  await prisma.review.update({
    where: { id: comment.reviewId },
    data: { commentCount: { decrement: 1 } },
  });
}

// ============================================
// Rating CRUD (Quick ratings without review)
// ============================================

/**
 * Rate an album (quick rating without full review)
 */
export async function rateAlbum(
  userId: string,
  albumId: string,
  value: number
): Promise<Rating | Review> {
  if (value < 1 || value > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Check if user has an existing review for this album
  const existingReview = await prisma.review.findUnique({
    where: {
      authorId_albumId: { authorId: userId, albumId },
    },
  });

  if (existingReview) {
    // User has a review - update the review's rating instead of creating a standalone rating
    const updatedReview = await prisma.review.update({
      where: { id: existingReview.id },
      data: { rating: value },
    });

    // Delete any standalone rating if it exists (cleanup)
    await prisma.rating.deleteMany({
      where: { userId, albumId },
    });

    // Update album rating stats
    await albumService.updateAlbumRatingStats(albumId);

    return updatedReview;
  }

  // No review exists - use standalone rating
  const rating = await prisma.rating.upsert({
    where: {
      userId_albumId: { userId, albumId },
    },
    create: {
      userId,
      albumId,
      value,
    },
    update: {
      value,
    },
  });

  // Update album rating stats
  await albumService.updateAlbumRatingStats(albumId);

  return rating;
}

/**
 * Rate a track
 */
export async function rateTrack(
  userId: string,
  trackId: string,
  value: number
): Promise<Rating> {
  if (value < 1 || value > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const rating = await prisma.rating.upsert({
    where: {
      userId_trackId: { userId, trackId },
    },
    create: {
      userId,
      trackId,
      value,
    },
    update: {
      value,
    },
  });

  return rating;
}

/**
 * Remove a rating
 */
export async function removeRating(
  userId: string,
  targetType: 'album' | 'track',
  targetId: string
): Promise<void> {
  if (targetType === 'album') {
    await prisma.rating.delete({
      where: {
        userId_albumId: { userId, albumId: targetId },
      },
    });
    await albumService.updateAlbumRatingStats(targetId);
  } else {
    await prisma.rating.delete({
      where: {
        userId_trackId: { userId, trackId: targetId },
      },
    });
  }
}

/**
 * Get user's rating for an album
 */
export async function getUserAlbumRating(
  userId: string,
  albumId: string
): Promise<number | null> {
  const rating = await prisma.rating.findUnique({
    where: {
      userId_albumId: { userId, albumId },
    },
  });
  return rating?.value ?? null;
}

// ============================================
// Upvotes for Reviews
// ============================================

/**
 * Upvote a review
 */
export async function upvoteReview(reviewId: string, userId: string): Promise<void> {
  // Check if review exists
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review) {
    throw new Error('Review not found');
  }

  // Check if already upvoted
  const existing = await prisma.upvote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: 'review',
        targetId: reviewId,
      },
    },
  });

  if (existing) {
    throw new Error('Already upvoted');
  }

  await prisma.$transaction([
    prisma.upvote.create({
      data: {
        userId,
        targetType: 'review',
        targetId: reviewId,
      },
    }),
    prisma.review.update({
      where: { id: reviewId },
      data: { upvoteCount: { increment: 1 } },
    }),
  ]);
}

/**
 * Remove upvote from a review
 */
export async function removeReviewUpvote(reviewId: string, userId: string): Promise<void> {
  const existing = await prisma.upvote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: 'review',
        targetId: reviewId,
      },
    },
  });

  if (!existing) {
    throw new Error('Not upvoted');
  }

  await prisma.$transaction([
    prisma.upvote.delete({
      where: { id: existing.id },
    }),
    prisma.review.update({
      where: { id: reviewId },
      data: { upvoteCount: { decrement: 1 } },
    }),
  ]);
}

/**
 * Upvote a review comment
 */
export async function upvoteComment(commentId: string, userId: string): Promise<void> {
  const existing = await prisma.upvote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: 'review_comment',
        targetId: commentId,
      },
    },
  });

  if (existing) {
    throw new Error('Already upvoted');
  }

  await prisma.$transaction([
    prisma.upvote.create({
      data: {
        userId,
        targetType: 'review_comment',
        targetId: commentId,
      },
    }),
    prisma.reviewComment.update({
      where: { id: commentId },
      data: { upvoteCount: { increment: 1 } },
    }),
  ]);
}

/**
 * Remove upvote from a review comment
 */
export async function removeCommentUpvote(commentId: string, userId: string): Promise<void> {
  const existing = await prisma.upvote.findUnique({
    where: {
      userId_targetType_targetId: {
        userId,
        targetType: 'review_comment',
        targetId: commentId,
      },
    },
  });

  if (!existing) {
    throw new Error('Not upvoted');
  }

  await prisma.$transaction([
    prisma.upvote.delete({
      where: { id: existing.id },
    }),
    prisma.reviewComment.update({
      where: { id: commentId },
      data: { upvoteCount: { decrement: 1 } },
    }),
  ]);
}
