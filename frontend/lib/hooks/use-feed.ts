import { useInfiniteQuery } from '@tanstack/react-query'
import { feedService } from '../api/services/feed'

export function useFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['feed', 'all'],
    queryFn: ({ pageParam = 1 }) => feedService.getFeed({ page: pageParam, limit }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  })
}

export function useFollowingFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['feed', 'following'],
    queryFn: ({ pageParam = 1 }) => feedService.getFollowingFeed({ page: pageParam, limit }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  })
}

export function useCommunitiesFeed(limit = 20) {
  return useInfiniteQuery({
    queryKey: ['feed', 'communities'],
    queryFn: ({ pageParam = 1 }) => feedService.getCommunitiesFeed({ page: pageParam, limit }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  })
}
