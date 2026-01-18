import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { discoverService } from '../api/services/discover'

export function useHomepageData() {
  return useQuery({
    queryKey: ['discover', 'homepage'],
    queryFn: () => discoverService.getHomepageData(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useNewReleases(limit: number = 20) {
  return useQuery({
    queryKey: ['discover', 'new-releases', limit],
    queryFn: () => discoverService.getNewReleases(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useRecentlyLogged(limit: number = 20) {
  return useQuery({
    queryKey: ['discover', 'recently-logged', limit],
    queryFn: () => discoverService.getRecentlyLogged(limit),
    staleTime: 1000 * 60, // 1 minute
  })
}

export function usePopularReviews(
  timeframe: 'day' | 'week' | 'month' = 'week',
  limit: number = 10
) {
  return useQuery({
    queryKey: ['discover', 'popular-reviews', timeframe, limit],
    queryFn: () => discoverService.getPopularReviews(timeframe, limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useTrending(limit: number = 20) {
  return useQuery({
    queryKey: ['discover', 'trending', limit],
    queryFn: () => discoverService.getTrending(limit),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useFriendsActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['discover', 'friends-activity', limit],
    queryFn: () => discoverService.getFriendsActivity(limit),
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useCommunityActivity(limit: number = 10) {
  return useQuery({
    queryKey: ['discover', 'community-activity', limit],
    queryFn: () => discoverService.getCommunityActivity(limit),
    staleTime: 1000 * 60, // 1 minute
  })
}

export function usePopularTags(limit: number = 20) {
  return useQuery({
    queryKey: ['discover', 'popular-tags', limit],
    queryFn: () => discoverService.getPopularTags(limit),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

export function useAllReviews(limit: number = 20) {
  return useInfiniteQuery({
    queryKey: ['discover', 'all-reviews', limit],
    queryFn: ({ pageParam = 1 }) => discoverService.getAllReviews(pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1
      }
      return undefined
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
