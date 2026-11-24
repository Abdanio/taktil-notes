import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import type { Note, Folder, AppConfig, FilterType } from '../types'
import { toast } from 'sonner'
import { soundEffects } from '../lib/sound'

interface NotesContextType {
  notes: Note[]
  folders: Folder[]
  activeNoteId: string | null
  activeNote: Note | null
  activeFilter: FilterType
  searchQuery: string
  config: AppConfig
  isSaving: boolean
  activeDragNote: Note | null
  setActiveDragNote: (note: Note | null) => void
  setActiveFilter: (filter: FilterType) => void
  setSearchQuery: (query: string) => void
  setActiveNoteId: (id: string | null) => void
  createNote: (folderId?: string | null, icon?: string) => Note
  updateNoteContent: (id: string, content: string, title?: string) => void
  updateNoteIcon: (id: string, icon: string) => void
  insertMarkdownSnippet: (snippet: string) => void
  togglePinNote: (id: string) => void
  softDeleteNote: (id: string) => void
  restoreNote: (id: string) => void
  permanentlyDeleteNote: (id: string) => void
  emptyTrash: () => void
  moveNoteToFolder: (noteId: string, folderId: string | null) => void
  reorderNotes: (activeId: string, overId: string) => void
  createFolder: (name: string, color?: string) => void
  deleteFolder: (folderId: string) => void
  setTheme: (theme: 'warm-paper' | 'matte-obsidian') => void
  setFont: (font: 'editorial' | 'sans' | 'mono') => void
  setTypingSound: (sound: 'none' | 'thock' | 'typewriter' | 'paper') => void
  toggleTypewriterMode: () => void
  toggleSidebar: () => void
  toggleAlwaysOnTop: () => Promise<void>
  setNoteReminder: (noteId: string, durationMs: number, label: string) => void
  clearNoteReminder: (noteId: string) => void
  completeTour: () => void
  startTour: () => void
}

const NotesContext = createContext<NotesContextType | null>(null)

const SEED_FOLDERS: Folder[] = [
  { id: 'f-work', name: 'Pekerjaan', color: '#D95D39', icon: 'Briefcase' },
  { id: 'f-personal', name: 'Pribadi', color: '#81B29A', icon: 'User' },
  { id: 'f-ideas', name: 'Riset & Ide', color: '#F2CC8F', icon: 'Lightbulb' }
]

const SEED_NOTE: Note = {
  id: 'seed-welcome-note',
  title: 'Selamat Datang — Coba Fitur Ini!',
  content: `# Selamat Datang di Catatan Taktil

Aplikasi catatan desktop lokal (*local-first*) berkinerja tinggi dengan visual yang halus, bebas dari pola desain generik, dan responsif terhadap sentuhan Anda.

### Coba Fitur Interaktif di Bawah Ini:
- [x] Merasakan nuansa tipografi Fraunces & Plus Jakarta Sans
- [ ] Mengklik kotak centang ini (perhatikan animasi micro-bounce!)
- [ ] Menarik kartu catatan di kolom kiri ke folder lain
- [ ] Menjatuhkan file gambar (.png/.jpg) dari komputer langsung ke sini
- [ ] Menguji pengingat dengan tombol lonceng di pojok kanan atas

### Potongan Kode yang Elegan
Gunakan \`JetBrains Mono\` untuk blok kode yang rapi:

\`\`\`typescript
interface CatatanTaktil {
  kinerja: "60 FPS";
  penyimpanan: "Lokal & Atomik";
  desain: "Bespoke Warm Paper & Matte Obsidian";
}
\`\`\`

> **Tips:** Tekan \`Ctrl/Cmd + K\` untuk pencarian cepat, atau \`Ctrl/Cmd + /\` untuk melihat daftar pintasan keyboard lengkap.`,
  folderId: 'f-ideas',
  isPinned: true,
  isTrash: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  reminder: null
}

const DEFAULT_CONFIG: AppConfig = {
  theme: 'warm-paper',
  font: 'editorial',
  isSidebarOpen: true,
  hasCompletedTour: false,
  alwaysOnTop: false,
  typingSound: 'thock',
  typewriterMode: false
}

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notes, setNotes] = useState<Note[]>([])
  const [folders, setFolders] = useState<Folder[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [isSaving, setIsSaving] = useState(false)
  const [activeDragNote, setActiveDragNote] = useState<Note | null>(null)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reminderTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Initial Load from Electron IPC
  useEffect(() => {
    async function initData(): Promise<void> {
      try {
        if (window.electronAPI) {
          const loadedConfig = await window.electronAPI.loadConfig()
          const loadedFolders = await window.electronAPI.loadFolders()
          const loadedNotes = await window.electronAPI.loadNotes()

          const finalConfig = loadedConfig || DEFAULT_CONFIG
          setConfig(finalConfig)

          // Seed folders if empty
          const finalFolders = loadedFolders && loadedFolders.length > 0 ? loadedFolders : SEED_FOLDERS
          setFolders(finalFolders)
          if (!loadedFolders || loadedFolders.length === 0) {
            await window.electronAPI.saveFolders(finalFolders)
          }

          // Seed welcome note if empty
          const finalNotes = loadedNotes && loadedNotes.length > 0 ? loadedNotes : [SEED_NOTE]
          setNotes(finalNotes)
          setActiveNoteId(finalNotes[0].id)
          if (!loadedNotes || loadedNotes.length === 0) {
            await window.electronAPI.saveNotes(finalNotes)
          }
        } else {
          // Fallback for browser preview if ever run without Electron
          setFolders(SEED_FOLDERS)
          setNotes([SEED_NOTE])
          setActiveNoteId(SEED_NOTE.id)
        }
      } catch (err) {
        console.error('Failed to load initial notes data:', err)
      }
    }

    initData()
  }, [])

  // Listen for Notification clicks from Main process
  useEffect(() => {
    if (window.electronAPI?.onNotificationClicked) {
      const cleanup = window.electronAPI.onNotificationClicked(({ noteId }) => {
        if (noteId) {
          setActiveNoteId(noteId)
          setActiveFilter('all')
        }
      })
      return cleanup
    }
    return undefined
  }, [])

  // Listen for Notification Chime events from Main process
  useEffect(() => {
    if (window.electronAPI?.onNotificationChime) {
      const cleanup = window.electronAPI.onNotificationChime(() => {
        soundEffects.playReminderChime()
      })
      return cleanup
    }
    return undefined
  }, [])

  // Apply Theme & Font to Document Body
  useEffect(() => {
    const root = document.documentElement
    if (config.theme === 'matte-obsidian') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Apply font classes
    document.body.classList.remove('font-mode-editorial', 'font-mode-sans', 'font-mode-mono')
    document.body.classList.add(`font-mode-${config.font}`)
  }, [config.theme, config.font])

  // Save config helper
  const updateConfig = useCallback((newConfig: Partial<AppConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig }
      if (window.electronAPI) {
        window.electronAPI.saveConfig(merged)
      }
      return merged
    })
  }, [])

  // Atomic Persist Notes with 300ms Debounce
  const persistNotesDebounced = useCallback((updatedNotes: Note[]) => {
    setIsSaving(true)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      if (window.electronAPI) {
        await window.electronAPI.saveNotes(updatedNotes)
      }
      setIsSaving(false)
    }, 300)
  }, [])

  // Create Note
  const createNote = useCallback(
    (folderId?: string | null, icon = 'Note'): Note => {
      let targetFolderId = folderId
      if (targetFolderId === undefined) {
        // If current filter is a folder ID, place note inside it
        if (activeFilter !== 'all' && activeFilter !== 'pinned' && activeFilter !== 'trash') {
          targetFolderId = activeFilter
        } else {
          targetFolderId = null
        }
      }

      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: 'Catatan Baru',
        content: '',
        folderId: targetFolderId ?? null,
        icon,
        isPinned: false,
        isTrash: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        reminder: null
      }

      setNotes((prev) => {
        const next = [newNote, ...prev]
        persistNotesDebounced(next)
        return next
      })

      setActiveNoteId(newNote.id)
      return newNote
    },
    [activeFilter, persistNotesDebounced]
  )

  const updateNoteIcon = useCallback(
    (id: string, icon: string) => {
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, icon, updatedAt: Date.now() } : n))
        persistNotesDebounced(next)
        return next
      })
    },
    [persistNotesDebounced]
  )

  // Update Note Content & Title
  const updateNoteContent = useCallback(
    (id: string, content: string, title?: string) => {
      setNotes((prev) => {
        const next = prev.map((note) => {
          if (note.id !== id) return note

          let autoTitle = title
          if (autoTitle === undefined) {
            // Auto extract title from first line if not provided
            const firstLine = content.trim().split('\n')[0] || ''
            const cleanTitle = firstLine.replace(/^#+\s*/, '').trim()
            autoTitle = cleanTitle.length > 0 ? cleanTitle.slice(0, 80) : 'Catatan Baru'
          }

          return {
            ...note,
            title: autoTitle,
            content,
            updatedAt: Date.now()
          }
        })
        persistNotesDebounced(next)
        return next
      })
    },
    [persistNotesDebounced]
  )

  // Toggle Pin
  const togglePinNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: Date.now() } : n))
        persistNotesDebounced(next)
        return next
      })
    },
    [persistNotesDebounced]
  )

  // Soft Delete Note with Undo Toast
  const softDeleteNote = useCallback(
    (id: string) => {
      const targetNote = notes.find((n) => n.id === id)
      if (!targetNote) return

      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, isTrash: true, updatedAt: Date.now() } : n))
        persistNotesDebounced(next)
        return next
      })

      // Select another note if active note was deleted
      if (activeNoteId === id) {
        const remaining = notes.filter((n) => n.id !== id && !n.isTrash)
        setActiveNoteId(remaining.length > 0 ? remaining[0].id : null)
      }

      // Show toast with 4s Undo action
      toast('Catatan dipindahkan ke Sampah', {
        duration: 4000,
        action: {
          label: 'Urungkan',
          onClick: () => {
            setNotes((prev) => {
              const next = prev.map((n) => (n.id === id ? { ...n, isTrash: false, updatedAt: Date.now() } : n))
              persistNotesDebounced(next)
              return next
            })
            setActiveNoteId(id)
            toast.success('Catatan berhasil dipulihkan!')
          }
        }
      })
    },
    [notes, activeNoteId, persistNotesDebounced]
  )

  // Restore Note from Trash
  const restoreNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === id ? { ...n, isTrash: false, updatedAt: Date.now() } : n))
        persistNotesDebounced(next)
        return next
      })
      toast.success('Catatan berhasil dipulihkan!')
    },
    [persistNotesDebounced]
  )

  // Permanently Delete Note
  const permanentlyDeleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id)
        persistNotesDebounced(next)
        return next
      })
      if (activeNoteId === id) {
        setActiveNoteId(null)
      }
      toast.info('Catatan telah dihapus permanen.')
    },
    [activeNoteId, persistNotesDebounced]
  )

  // Empty Trash
  const emptyTrash = useCallback(() => {
    setNotes((prev) => {
      const next = prev.filter((n) => !n.isTrash)
      persistNotesDebounced(next)
      return next
    })
    toast.info('Semua sampah telah dibersihkan.')
  }, [persistNotesDebounced])

  // Move Note to Folder (or Trash if folderId === 'trash')
  const moveNoteToFolder = useCallback(
    (noteId: string, folderId: string | null) => {
      if (folderId === 'trash') {
        softDeleteNote(noteId)
        return
      }

      setNotes((prev) => {
        const next = prev.map((n) =>
          n.id === noteId ? { ...n, folderId, isTrash: false, updatedAt: Date.now() } : n
        )
        persistNotesDebounced(next)
        return next
      })
    },
    [softDeleteNote, persistNotesDebounced]
  )

  // Reorder Notes
  const reorderNotes = useCallback(
    (activeId: string, overId: string) => {
      setNotes((prev) => {
        const oldIndex = prev.findIndex((n) => n.id === activeId)
        const newIndex = prev.findIndex((n) => n.id === overId)
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev

        const newArr = [...prev]
        const [moved] = newArr.splice(oldIndex, 1)
        newArr.splice(newIndex, 0, moved)

        persistNotesDebounced(newArr)
        return newArr
      })
    },
    [persistNotesDebounced]
  )

  // Folders management
  const createFolder = useCallback(
    (name: string, color = '#D95D39') => {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name: name.trim() || 'Folder Baru',
        color
      }
      setFolders((prev) => {
        const next = [...prev, newFolder]
        if (window.electronAPI) {
          window.electronAPI.saveFolders(next)
        }
        return next
      })
      toast.success(`Folder "${newFolder.name}" dibuat`)
    },
    []
  )

  const deleteFolder = useCallback(
    (folderId: string) => {
      setFolders((prev) => {
        const next = prev.filter((f) => f.id !== folderId)
        if (window.electronAPI) {
          window.electronAPI.saveFolders(next)
        }
        return next
      })
      // Unassign notes in deleted folder
      setNotes((prev) => {
        const next = prev.map((n) => (n.folderId === folderId ? { ...n, folderId: null } : n))
        persistNotesDebounced(next)
        return next
      })
      if (activeFilter === folderId) {
        setActiveFilter('all')
      }
      toast.info('Folder dihapus')
    },
    [activeFilter, persistNotesDebounced]
  )

  // Theme & Font
  const setTheme = useCallback(
    (theme: 'warm-paper' | 'matte-obsidian') => {
      updateConfig({ theme })
    },
    [updateConfig]
  )

  const setFont = useCallback(
    (font: 'editorial' | 'sans' | 'mono') => {
      updateConfig({ font })
    },
    [updateConfig]
  )

  const setTypingSound = useCallback(
    (typingSound: 'none' | 'thock' | 'typewriter' | 'paper') => {
      updateConfig({ typingSound })
      soundEffects.playChecklistBounce()
    },
    [updateConfig]
  )

  const toggleTypewriterMode = useCallback(() => {
    updateConfig({ typewriterMode: !config.typewriterMode })
    soundEffects.playChecklistBounce()
    toast.info(!config.typewriterMode ? 'Mode Mesin Tik Diaktifkan' : 'Mode Mesin Tik Dinonaktifkan')
  }, [config.typewriterMode, updateConfig])

  const toggleSidebar = useCallback(() => {
    updateConfig({ isSidebarOpen: !config.isSidebarOpen })
  }, [config.isSidebarOpen, updateConfig])

  const toggleAlwaysOnTop = useCallback(async () => {
    if (window.electronAPI) {
      const newState = !config.alwaysOnTop
      await window.electronAPI.setAlwaysOnTop(newState)
      updateConfig({ alwaysOnTop: newState })
      toast.info(newState ? 'Mode Melayang Diaktifkan (Always on Top)' : 'Mode Melayang Dinonaktifkan')
    }
  }, [config.alwaysOnTop, updateConfig])

  // Reminders
  const setNoteReminder = useCallback(
    (noteId: string, durationMs: number, label: string) => {
      const dueTime = Date.now() + durationMs
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === noteId ? { ...n, reminder: { dueTime, label } } : n))
        persistNotesDebounced(next)
        return next
      })

      // Clear any existing timer for this note
      const existing = reminderTimersRef.current.get(noteId)
      if (existing) clearTimeout(existing)

      // Set native Electron Notification timer
      const timer = setTimeout(() => {
        const note = notes.find((n) => n.id === noteId)
        const noteTitle = note?.title || 'Catatan Anda'

        // Play auditory chime via Web Audio API
        soundEffects.playReminderChime()

        // Show rich in-app toast notification with direct link
        toast.info(`🔔 Pengingat: ${noteTitle}`, {
          description: label,
          duration: 8000,
          action: {
            label: 'Buka',
            onClick: () => {
              setActiveNoteId(noteId)
              setActiveFilter('all')
            }
          }
        })

        if (window.electronAPI) {
          window.electronAPI.showNotification({
            title: `Pengingat: ${noteTitle}`,
            body: label,
            noteId
          })
        }
        // Remove reminder marker after triggered
        setNotes((prev) => {
          const next = prev.map((n) => (n.id === noteId ? { ...n, reminder: null } : n))
          persistNotesDebounced(next)
          return next
        })
        reminderTimersRef.current.delete(noteId)
      }, durationMs)

      reminderTimersRef.current.set(noteId, timer)
      toast.success(`Pengingat disetel: ${label}`)
    },
    [notes, persistNotesDebounced]
  )

  const insertMarkdownSnippet = useCallback(
    (snippet: string) => {
      if (!activeNoteId) return
      setNotes((prev) => {
        const next = prev.map((n) => {
          if (n.id !== activeNoteId) return n
          const currentContent = n.content.trim()
          const newContent = currentContent ? `${currentContent}\n\n${snippet}` : snippet
          return {
            ...n,
            content: newContent,
            updatedAt: Date.now()
          }
        })
        persistNotesDebounced(next)
        return next
      })
    },
    [activeNoteId, persistNotesDebounced]
  )

  const clearNoteReminder = useCallback(
    (noteId: string) => {
      setNotes((prev) => {
        const next = prev.map((n) => (n.id === noteId ? { ...n, reminder: null } : n))
        persistNotesDebounced(next)
        return next
      })
      const existing = reminderTimersRef.current.get(noteId)
      if (existing) {
        clearTimeout(existing)
        reminderTimersRef.current.delete(noteId)
      }
      toast.info('Pengingat dibatalkan')
    },
    [persistNotesDebounced]
  )

  const completeTour = useCallback(() => {
    updateConfig({ hasCompletedTour: true })
  }, [updateConfig])

  const startTour = useCallback(() => {
    updateConfig({ hasCompletedTour: false })
  }, [updateConfig])

  const activeNote = notes.find((n) => n.id === activeNoteId) || null

  return (
    <NotesContext.Provider
      value={{
        notes,
        folders,
        activeNoteId,
        activeNote,
        activeFilter,
        searchQuery,
        config,
        isSaving,
        activeDragNote,
        setActiveDragNote,
        setActiveFilter,
        setSearchQuery,
        setActiveNoteId,
        createNote,
        updateNoteContent,
        updateNoteIcon,
        insertMarkdownSnippet,
        togglePinNote,
        softDeleteNote,
        restoreNote,
        permanentlyDeleteNote,
        emptyTrash,
        moveNoteToFolder,
        reorderNotes,
        createFolder,
        deleteFolder,
        setTheme,
        setFont,
        setTypingSound,
        toggleTypewriterMode,
        toggleSidebar,
        toggleAlwaysOnTop,
        setNoteReminder,
        clearNoteReminder,
        completeTour,
        startTour
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes(): NotesContextType {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider')
  }
  return context
}
