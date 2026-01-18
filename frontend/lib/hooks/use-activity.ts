import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { feedService } from '../api/services/feed'
import { usersService } from '../api/services/users'

export function useActivityFeed(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['activity', 'feed', params],
    queryFn: () => feedService.getActivityFeed(params),
  })
}

export function useInfiniteActivityFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['activity', 'feed', 'infinite'],
    queryFn: ({ pageParam = 1 }) => feedService.getActivityFeed({ page: pageParam, limit }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  })
}

export function useUserReviews(username: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['activity', 'user', username, params],
    queryFn: () => usersService.getUserReviews(username, params),
    enabled: !!username,
  })
}

export function useInfiniteUserReviews(username: string, limit = 20) {
  return useInfiniteQuery({
    queryKey: ['activity', 'user', username, 'infinite'],
    queryFn: ({ pageParam = 1 }) => usersService.getUserReviews(username, { page: pageParam, limit }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
    enabled: !!username,
  })
}
