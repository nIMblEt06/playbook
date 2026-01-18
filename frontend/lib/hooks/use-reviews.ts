import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { reviewsService } from '../api/services/reviews'

export function useReviewComments(
  reviewId: string,
  options?: { page?: number; limit?: number; sort?: 'recent' | 'engaged' }
) {
  return useQuery({
    queryKey: ['review-comments', reviewId, options],
    queryFn: () =>
      reviewsService.getComments(
        reviewId,
        options?.page,
        options?.limit,
        options?.sort
      ),
    enabled: !!reviewId,
  })
}

export function useUpvoteReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, remove }: { id: string; remove: boolean }) =>
      remove
        ? reviewsService.removeUpvoteReview(id)
        : reviewsService.upvoteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discover'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['popular-reviews'] })
    },
  })
}

export function useCreateReviewComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      reviewId,
      content,
      parentId,
    }: {
      reviewId: string
      content: string
      parentId?: string
    }) => reviewsService.createComment(reviewId, content, parentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['review-comments', variables.reviewId],
      })
      queryClient.invalidateQueries({ queryKey: ['discover'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useDeleteReviewComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => reviewsService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-comments'] })
      queryClient.invalidateQueries({ queryKey: ['discover'] })
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    },
  })
}

export function useUpvoteReviewComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, remove }: { id: string; remove: boolean }) =>
      remove
        ? reviewsService.removeUpvoteComment(id)
        : reviewsService.upvoteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-comments'] })
    },
  })
}
