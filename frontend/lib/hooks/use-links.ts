import { useQuery, useMutation } from '@tanstack/react-query'
import { linksService, type LinkMetadata, type ParsedLink } from '../api/services/links'

export function useLinkMetadata(url: string | null) {
  return useQuery({
    queryKey: ['link-metadata', url],
    queryFn: () => linksService.getMetadata(url!),
    enabled: !!url,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
    retry: 1,
  })
}

export function useParseLinkMutation() {
  return useMutation({
    mutationFn: (url: string) => linksService.parseUrl(url),
  })
}

export function useGetLinkMetadataMutation() {
  return useMutation({
    mutationFn: (url: string) => linksService.getMetadata(url),
  })
}
