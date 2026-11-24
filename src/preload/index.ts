import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, UpdateStatus } from './index.d'

const api: ElectronAPI = {
  // Storage
  loadNotes: () => ipcRenderer.invoke('storage:loadNotes'),
  saveNotes: (notes) => ipcRenderer.invoke('storage:saveNotes', notes),
  loadFolders: () => ipcRenderer.invoke('storage:loadFolders'),
  saveFolders: (folders) => ipcRenderer.invoke('storage:saveFolders', folders),
  loadConfig: () => ipcRenderer.invoke('storage:loadConfig'),
  saveConfig: (config) => ipcRenderer.invoke('storage:saveConfig', config),
  saveAsset: (fileName, dataBase64) =>
    ipcRenderer.invoke('assets:saveAsset', { fileName, dataBase64 }),

  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  toggleFullScreen: () => ipcRenderer.invoke('window:fullscreen'),
  close: () => ipcRenderer.invoke('window:close'),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.invoke('window:setAlwaysOnTop', alwaysOnTop),
  isAlwaysOnTop: () => ipcRenderer.invoke('window:isAlwaysOnTop'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  isFullScreen: () => ipcRenderer.invoke('window:isFullScreen'),
  onWindowStateChanged: (callback) => {
    const listener = (
      _event: Electron.IpcRendererEvent,
      data: { isMaximized: boolean; isFullScreen: boolean }
    ): void => {
      callback(data)
    }
    ipcRenderer.on('window:state-changed', listener)
    return () => {
      ipcRenderer.removeListener('window:state-changed', listener)
    }
  },

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
  },
  onNotificationChime: (callback) => {
    const listener = (): void => {
      callback()
    }
    ipcRenderer.on('notification:chime', listener)
    return () => {
      ipcRenderer.removeListener('notification:chime', listener)
    }
  },

  // Auto-Updater
  checkForUpdates: () => ipcRenderer.invoke('updater:checkForUpdates'),
  downloadUpdate: () => ipcRenderer.invoke('updater:downloadUpdate'),
  quitAndInstall: () => ipcRenderer.invoke('updater:quitAndInstall'),
  getAppVersion: () => ipcRenderer.invoke('updater:getAppVersion'),
  onUpdaterStatus: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus): void => {
      callback(status)
    }
    ipcRenderer.on('updater:status', listener)
    return () => {
      ipcRenderer.removeListener('updater:status', listener)
    }
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error('Failed to expose electronAPI:', error)
  }
} else {
  // @ts-ignore
  window.electronAPI = api
}
