import { apiClient } from '../client'
import type { Post, CreatePostRequest, PaginatedResponse } from '../../types'
import { transformPaginatedResponse, type BackendPaginatedResponse } from '../utils'

export interface PostComment {
  id: string
  content: string
  createdAt: string
  postId: string
  upvoteCount: number
  hasUpvoted: boolean
  author: {
    id: string
    username: string
    displayName: string
    avatarUrl: string | null
    isArtist: boolean
  }
  parentCommentId: string | null
  replyCount?: number
  replies?: PostComment[]
}

export interface PostCommentsResponse {
  data: PostComment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export const postsService = {
  async getPosts(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<BackendPaginatedResponse<Post>>('/api/posts', { params })
    return transformPaginatedResponse(response.data)
  },

  async getPost(id: string): Promise<Post> {
    const response = await apiClient.get<Post>(`/api/posts/${id}`)
    return response.data
  },

  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await apiClient.post<Post>('/api/posts', data)
    return response.data
  },

  async deletePost(id: string): Promise<void> {
    await apiClient.delete(`/api/posts/${id}`)
  },

  async upvotePost(id: string): Promise<void> {
    await apiClient.post(`/api/posts/${id}/upvote`)
  },

  async removeUpvotePost(id: string): Promise<void> {
    await apiClient.delete(`/api/posts/${id}/upvote`)
  },

  async savePost(id: string): Promise<void> {
    await apiClient.post(`/api/posts/${id}/save`)
  },

  async unsavePost(id: string): Promise<void> {
    await apiClient.delete(`/api/posts/${id}/save`)
  },

  async getSavedPosts(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Post>> {
    const response = await apiClient.get<BackendPaginatedResponse<Post>>('/api/posts/saved', { params })
    return transformPaginatedResponse(response.data)
  },

  async getComments(
    postId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<PostCommentsResponse> {
    const response = await apiClient.get<PostCommentsResponse>(
      `/api/posts/${postId}/comments`,
      { params: { page, limit } }
    )
    return response.data
  },

  async createComment(
    postId: string,
    content: string,
    parentCommentId?: string
  ): Promise<{ comment: PostComment }> {
    const response = await apiClient.post<{ comment: PostComment }>(
      `/api/posts/${postId}/comments`,
      { content, parentCommentId }
    )
    return response.data
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/comments/${commentId}`)
  },

  async upvoteComment(commentId: string): Promise<void> {
    await apiClient.post(`/api/comments/${commentId}/upvote`)
  },

  async removeUpvoteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/api/comments/${commentId}/upvote`)
  },
}
