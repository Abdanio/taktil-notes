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
}

export interface ElectronAPI {
  // Storage
  loadNotes: () => Promise<Note[]>
  saveNotes: (notes: Note[]) => Promise<boolean>
  loadFolders: () => Promise<Folder[]>
  saveFolders: (folders: Folder[]) => Promise<boolean>
  loadConfig: () => Promise<AppConfig>
  saveConfig: (config: AppConfig) => Promise<boolean>
  saveAsset: (fileName: string, dataBase64: string) => Promise<{ success: boolean; assetUrl: string; fileName: string }>
  
  // Window controls
  minimize: () => Promise<void>
  maximize: () => Promise<boolean>
  toggleFullScreen: () => Promise<boolean>
  close: () => Promise<void>
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<boolean>
  isAlwaysOnTop: () => Promise<boolean>
  isMaximized: () => Promise<boolean>
  isFullScreen: () => Promise<boolean>
  onWindowStateChanged: (callback: (state: { isMaximized: boolean; isFullScreen: boolean }) => void) => () => void

  // Notifications
  showNotification: (options: { title: string; body: string; noteId?: string }) => Promise<void>
  onNotificationClicked: (callback: (data: { noteId?: string }) => void) => () => void
  onNotificationChime: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
