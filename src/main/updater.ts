import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import https from 'https'

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

export function setupAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  // Configure electron-updater
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  const broadcastStatus = (status: UpdateStatus): void => {
    const win = getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send('updater:status', status)
    }
  }

  // Production Electron-Updater Events
  autoUpdater.on('checking-for-update', () => {
    broadcastStatus({
      state: 'checking',
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('update-available', (info) => {
    broadcastStatus({
      state: 'available',
      version: info.version,
      currentVersion: app.getVersion(),
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : '',
      releaseDate: info.releaseDate
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    broadcastStatus({
      state: 'not-available',
      version: info.version,
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('download-progress', (progressObj) => {
    broadcastStatus({
      state: 'downloading',
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total,
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    broadcastStatus({
      state: 'downloaded',
      version: info.version,
      currentVersion: app.getVersion()
    })
  })

  autoUpdater.on('error', (err) => {
    broadcastStatus({
      state: 'error',
      message: err.message,
      currentVersion: app.getVersion()
    })
  })

  // IPC Handlers for Updater
  ipcMain.handle('updater:getAppVersion', () => {
    return app.getVersion()
  })

  ipcMain.handle('updater:checkForUpdates', async () => {
    const currentVer = app.getVersion()
    broadcastStatus({ state: 'checking', currentVersion: currentVer })

    if (app.isPackaged) {
      try {
        await autoUpdater.checkForUpdates()
      } catch (err: unknown) {
        broadcastStatus({
          state: 'error',
          message: err instanceof Error ? err.message : 'Gagal memeriksa pembaruan',
          currentVersion: currentVer
        })
      }
    } else {
      // In development mode, query GitHub Releases API directly for accurate testing
      checkGitHubLatestRelease((result) => {
        broadcastStatus(result)
      })
    }
  })

  ipcMain.handle('updater:downloadUpdate', async () => {
    if (app.isPackaged) {
      await autoUpdater.downloadUpdate()
    } else {
      // In dev mode, open release page directly
      shell.openExternal('https://github.com/Abdanio/taktil-notes/releases/latest')
    }
  })

  ipcMain.handle('updater:quitAndInstall', () => {
    if (app.isPackaged) {
      autoUpdater.quitAndInstall()
    } else {
      app.relaunch()
      app.exit(0)
    }
  })
}

// Fallback direct check against GitHub Releases API for dev/portable environments
function checkGitHubLatestRelease(callback: (status: UpdateStatus) => void): void {
  const currentVersion = app.getVersion()
  const options = {
    hostname: 'api.github.com',
    path: '/repos/Abdanio/taktil-notes/releases/latest',
    headers: {
      'User-Agent': 'Taktil-Notes-App'
    }
  }

  https
    .get(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const release = JSON.parse(data)
            const latestTag = (release.tag_name || '').replace(/^v/, '')

            if (isNewerVersion(currentVersion, latestTag)) {
              callback({
                state: 'available',
                version: latestTag,
                currentVersion,
                releaseNotes: release.body || 'Pembaruan versi terbaru tersedia di GitHub.',
                releaseDate: release.published_at
              })
            } else {
              callback({
                state: 'not-available',
                version: currentVersion,
                currentVersion
              })
            }
          } else {
            callback({
              state: 'not-available',
              version: currentVersion,
              currentVersion
            })
          }
        } catch {
          callback({
            state: 'not-available',
            version: currentVersion,
            currentVersion
          })
        }
      })
    })
    .on('error', (err) => {
      callback({
        state: 'error',
        message: err.message,
        currentVersion
      })
    })
}

function isNewerVersion(current: string, latest: string): boolean {
  if (!latest) return false
  const c = current.split('.').map((n) => parseInt(n, 10) || 0)
  const l = latest.split('.').map((n) => parseInt(n, 10) || 0)

  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    const cv = c[i] || 0
    const lv = l[i] || 0
    if (lv > cv) return true
    if (lv < cv) return false
  }
  return false
}
