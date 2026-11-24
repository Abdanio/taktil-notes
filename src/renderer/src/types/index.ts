export type FilterType = 'all' | 'pinned' | 'trash' | string

export interface Note {
  id: string
  title: string
  content: string
  folderId: string | null
  icon?: string
  isPinned: boolean
  isTrash: boolean
  createdAt: number
  updatedAt: number
  reminder?: {
    dueTime: number
    label: string
  } | null
}

export interface Folder {
  id: string
  name: string
  color: string
  icon?: string
}

export interface AppConfig {
  theme: 'warm-paper' | 'matte-obsidian'
  font: 'editorial' | 'sans' | 'mono'
  isSidebarOpen: boolean
  hasCompletedTour: boolean
  alwaysOnTop: boolean
  typingSound?: 'none' | 'thock' | 'typewriter' | 'paper'
  typewriterMode?: boolean
}

export interface ActiveTourStep {
  element: string
  popover: {
    title: string
    description: string
  }
}
