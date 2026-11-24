import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, Note, Folder, AppConfig } from './index.d'

const api: ElectronAPI = {
  // Storage
  loadNotes: () => ipcRenderer.invoke('storage:loadNotes'),
  saveNotes: (notes: Note[]) => ipcRenderer.invoke('storage:saveNotes', notes),
  loadFolders: () => ipcRenderer.invoke('storage:loadFolders'),
  saveFolders: (folders: Folder[]) => ipcRenderer.invoke('storage:saveFolders', folders),
  loadConfig: () => ipcRenderer.invoke('storage:loadConfig'),
  saveConfig: (config: AppConfig) => ipcRenderer.invoke('storage:saveConfig', config),
  saveAsset: (fileName: string, dataBase64: string) =>
    ipcRenderer.invoke('assets:saveAsset', { fileName, dataBase64 }),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  setAlwaysOnTop: (alwaysOnTop: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', alwaysOnTop),
  isAlwaysOnTop: () => ipcRenderer.invoke('window:isAlwaysOnTop'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Notifications
  showNotification: (options) => ipcRenderer.invoke('notification:show', options),
  onNotificationClicked: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, data: { noteId?: string }): void => {
      callback(data)
    }
    ipcRenderer.on('notification:clicked', listener)
    return () => {
      ipcRenderer.removeListener('notification:clicked', listener)
    }
  }
}

// Expose safe API to renderer
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error('Failed to expose electronAPI:', error)
  }
} else {
  // @ts-ignore (fallback if contextIsolation disabled)
  window.electronAPI = api
}
