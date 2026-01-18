import { apiClient } from '../client'

export interface ReviewComment {
  id: string
  content: string
  createdAt: string
  upvoteCount: number
  hasUpvoted: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
  }
  parentId: string | null
  replies?: ReviewComment[]
}

export interface ReviewCommentsResponse {
  items: ReviewComment[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export const reviewsService = {
  async upvoteReview(reviewId: string): Promise<void> {
    await apiClient.post(`/api/reviews/${reviewId}/upvote`)
  },

  async removeUpvoteReview(reviewId: string): Promise<void> {
    await apiClient.delete(`/api/reviews/${reviewId}/upvote`)
  },

  async getComments(
    reviewId: string,
    page: number = 1,
    limit: number = 50,
    sort: 'recent' | 'engaged' = 'recent'
  ): Promise<ReviewCommentsResponse> {
    const response = await apiClient.get<ReviewCommentsResponse>(
      `/api/reviews/${reviewId}/comments`,
      { params: { page, limit, sort } }
    )
    return response.data
  },

  async createComment(
    reviewId: string,
    content: string,
    parentId?: string
  ): Promise<{ comment: ReviewComment }> {
    const response = await apiClient.post<{ comment: ReviewComment }>(
      `/api/reviews/${reviewId}/comments`,
      { content, parentId }
    )
    return response.data
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/reviews/comments/${commentId}`)
  },

  async upvoteComment(commentId: string): Promise<void> {
    await apiClient.post(`/api/reviews/comments/${commentId}/upvote`)
  },

  async removeUpvoteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/reviews/comments/${commentId}/upvote`)
  },
}
