import type { PaginatedResponse } from '../types'

export interface BackendPaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function transformPaginatedResponse<T>(response: BackendPaginatedResponse<T>): PaginatedResponse<T> {
  return {
    items: response.data,
    total: response.pagination.total,
    page: response.pagination.page,
    pageSize: response.pagination.limit,
    hasMore: response.pagination.page < response.pagination.totalPages,
  }
}

