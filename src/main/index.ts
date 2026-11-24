import { app, shell, BrowserWindow, ipcMain, protocol, Notification } from 'electron'
import { join, extname } from 'path'
import { promises as fs } from 'fs'
import type { AppConfig, Folder, Note } from '../preload/index.d'

// 1. Enforce single instance lock
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
  process.exit(0)
}

let mainWindow: BrowserWindow | null = null

// 2. Register custom privileged protocol note-asset:// before ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'note-asset',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      bypassCSP: true,
      stream: true
    }
  }
])

// Helpers for paths and atomic persistence
const getUserDataPath = (): string => app.getPath('userData')

const getAssetsDir = async (): Promise<string> => {
  const dir = join(getUserDataPath(), 'assets')
  await fs.mkdir(dir, { recursive: true })
  return dir
}

async function atomicWriteJson(fileName: string, data: unknown): Promise<void> {
  const targetPath = join(getUserDataPath(), fileName)
  const tempPath = `${targetPath}.tmp.${Date.now()}`
  const jsonString = JSON.stringify(data, null, 2)
  await fs.writeFile(tempPath, jsonString, 'utf-8')
  await fs.rename(tempPath, targetPath)
}

async function readJsonSafely<T>(fileName: string, fallback: T): Promise<T> {
  const filePath = join(getUserDataPath(), fileName)
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

// Default initial configuration
const DEFAULT_CONFIG: AppConfig = {
  theme: 'warm-paper',
  font: 'editorial',
  isSidebarOpen: true,
  hasCompletedTour: false,
  alwaysOnTop: false
}

// Create the main application window
async function createWindow(): Promise<BrowserWindow> {
  // Read config early to set proper initial background color (avoid white flash)
  const initialConfig = await readJsonSafely<AppConfig>('config.json', DEFAULT_CONFIG)
  const initialBg = initialConfig.theme === 'matte-obsidian' ? '#181715' : '#F8F6F1'

  const window = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: initialBg,
    alwaysOnTop: initialConfig.alwaysOnTop,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Load renderer
  if (process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}

// App lifecycle
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.whenReady().then(async () => {
  // Register note-asset:// protocol handler
  protocol.handle('note-asset', async (request) => {
    try {
      const parsedUrl = new URL(request.url)
      // Handles both note-asset://filename.jpg and note-asset:///filename.jpg
      const rawName = parsedUrl.hostname
        ? `${parsedUrl.hostname}${parsedUrl.pathname}`
        : parsedUrl.pathname.replace(/^\/+/, '')
      const fileName = decodeURIComponent(rawName)

      const assetsDir = await getAssetsDir()
      const filePath = join(assetsDir, fileName)

      // Guard against directory traversal
      if (!filePath.startsWith(assetsDir)) {
        return new Response('Forbidden', { status: 403 })
      }

      const fileBuffer = await fs.readFile(filePath)
      const ext = extname(filePath).toLowerCase()
      const mimeMap: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      }

      return new Response(fileBuffer, {
        headers: {
          'Content-Type': mimeMap[ext] || 'application/octet-stream',
          'Cache-Control': 'max-age=31536000, immutable'
        }
      })
    } catch {
      return new Response('Asset not found', { status: 404 })
    }
  })

  // Setup IPC Handlers
  setupIpcHandlers()

  mainWindow = await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

function setupIpcHandlers(): void {
  // Storage: Notes
  ipcMain.handle('storage:loadNotes', async (): Promise<Note[]> => {
    return await readJsonSafely<Note[]>('notes.json', [])
  })

  ipcMain.handle('storage:saveNotes', async (_, notes: Note[]): Promise<boolean> => {
    try {
      await atomicWriteJson('notes.json', notes)
      return true
    } catch (err) {
      console.error('Error saving notes:', err)
      return false
    }
  })

  // Storage: Folders
  ipcMain.handle('storage:loadFolders', async (): Promise<Folder[]> => {
    return await readJsonSafely<Folder[]>('folders.json', [])
  })

  ipcMain.handle('storage:saveFolders', async (_, folders: Folder[]): Promise<boolean> => {
    try {
      await atomicWriteJson('folders.json', folders)
      return true
    } catch (err) {
      console.error('Error saving folders:', err)
      return false
    }
  })

  // Storage: Config
  ipcMain.handle('storage:loadConfig', async (): Promise<AppConfig> => {
    return await readJsonSafely<AppConfig>('config.json', DEFAULT_CONFIG)
  })

  ipcMain.handle('storage:saveConfig', async (_, config: AppConfig): Promise<boolean> => {
    try {
      await atomicWriteJson('config.json', config)
      return true
    } catch (err) {
      console.error('Error saving config:', err)
      return false
    }
  })

  // Assets: Save base64 asset locally
  ipcMain.handle(
    'assets:saveAsset',
    async (
      _,
      { fileName, dataBase64 }: { fileName: string; dataBase64: string }
    ): Promise<{ success: boolean; assetUrl: string; fileName: string }> => {
      try {
        const assetsDir = await getAssetsDir()
        // Ensure clean safe filename with timestamp prefix to prevent collisions
        const cleanName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const targetPath = join(assetsDir, cleanName)

        // Convert base64 data to buffer
        const cleanBase64 = dataBase64.replace(/^data:image\/\w+;base64,/, '')
        const buffer = Buffer.from(cleanBase64, 'base64')

        await fs.writeFile(targetPath, buffer)
        return {
          success: true,
          assetUrl: `note-asset://${cleanName}`,
          fileName: cleanName
        }
      } catch (err) {
        console.error('Error saving asset:', err)
        return { success: false, assetUrl: '', fileName: '' }
      }
    }
  )

  // Window Controls
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:maximize', () => {
    if (!mainWindow) return
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('window:setAlwaysOnTop', (_, flag: boolean) => {
    mainWindow?.setAlwaysOnTop(flag)
    return mainWindow?.isAlwaysOnTop() ?? false
  })

  ipcMain.handle('window:isAlwaysOnTop', () => {
    return mainWindow?.isAlwaysOnTop() ?? false
  })

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow?.isMaximized() ?? false
  })

  // Desktop Notifications
  ipcMain.handle(
    'notification:show',
    (_, { title, body, noteId }: { title: string; body: string; noteId?: string }) => {
      if (Notification.isSupported()) {
        const notif = new Notification({
          title,
          body,
          silent: false
        })

        notif.on('click', () => {
          if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
            mainWindow.webContents.send('notification:clicked', { noteId })
          }
        })

        notif.show()
      }
    }
  )
}
