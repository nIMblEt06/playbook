import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { postsService, type PostCommentsResponse } from '../api/services/posts'
import type { CreatePostRequest } from '../types'

export function usePosts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['posts', params],
    queryFn: () => postsService.getPosts(params),
  })
}

export function useInfinitePosts(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['posts', 'infinite'],
    queryFn: ({ pageParam = 1 }) => postsService.getPosts({ page: pageParam, limit }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['posts', id],
    queryFn: () => postsService.getPost(id),
    enabled: !!id,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePostRequest) => postsService.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => postsService.deletePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useUpvotePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, remove }: { id: string; remove: boolean }) =>
      remove ? postsService.removeUpvotePost(id) : postsService.upvotePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useSavePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, unsave }: { id: string; unsave: boolean }) =>
      unsave ? postsService.unsavePost(id) : postsService.savePost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] })
    },
  })
}

export function useSavedPosts(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['saved-posts', params],
    queryFn: () => postsService.getSavedPosts(params),
  })
}

export function usePostComments(postId: string) {
  return useQuery<PostCommentsResponse>({
    queryKey: ['post-comments', postId],
    queryFn: () => postsService.getComments(postId),
    enabled: !!postId,
  })
}

export function useCreatePostComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      postId,
      content,
      parentCommentId,
    }: {
      postId: string
      content: string
      parentCommentId?: string
    }) => postsService.createComment(postId, content, parentCommentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', variables.postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useDeletePostComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => postsService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments'] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
    },
  })
}

export function useUpvotePostComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, remove }: { id: string; remove: boolean }) =>
      remove ? postsService.removeUpvoteComment(id) : postsService.upvoteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments'] })
    },
  })
}
