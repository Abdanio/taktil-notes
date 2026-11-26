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
  isEncrypted?: boolean
  encryptedData?: {
    ciphertext: string
    salt: string
    iv: string
  }
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

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  currentVersion?: string
  releaseNotes?: string
  releaseDate?: string
  percent?: number
  transferred?: number
  total?: number
  message?: string
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

  // Auto-Updater
  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  quitAndInstall: () => Promise<void>
  getAppVersion: () => Promise<string>
  onUpdaterStatus: (callback: (status: UpdateStatus) => void) => () => void

  // Editorial Publishing Exporter
  exportPdf: (options: { title: string; htmlContent: string; markdownContent?: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>
  exportHtml: (options: { title: string; htmlContent: string; markdownContent?: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>
  exportEpub: (options: { title: string; htmlContent: string; markdownContent?: string }) => Promise<{ success: boolean; filePath?: string; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
