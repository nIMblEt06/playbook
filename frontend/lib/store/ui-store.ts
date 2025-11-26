import { create } from 'zustand'

interface UIState {
  sidebarCollapsed: boolean
  createPostModalOpen: boolean
  currentFeedFilter: 'all' | 'following' | 'communities'
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCreatePostModalOpen: (open: boolean) => void
  setFeedFilter: (filter: 'all' | 'following' | 'communities') => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: false,
  createPostModalOpen: false,
  currentFeedFilter: 'all',
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCreatePostModalOpen: (open) => set({ createPostModalOpen: open }),
  setFeedFilter: (filter) => set({ currentFeedFilter: filter }),
}))
