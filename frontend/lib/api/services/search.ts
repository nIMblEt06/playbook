import { apiClient } from '../client'
import type { User, Community, Post } from '../../types'

interface SearchResults {
  users?: User[]
  communities?: Community[]
  posts?: Post[]
}

export const searchService = {
  async search(query: string, type?: 'users' | 'communities' | 'posts'): Promise<SearchResults> {
    const response = await apiClient.get<SearchResults>('/api/search', {
      params: { q: query, type },
    })
    return response.data
  },
}
