import React, { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'sonner'
import { useNotes } from './context/NotesContext'
import { Sidebar } from './components/Sidebar'
import { NoteList } from './components/NoteList'
import { Editor } from './components/Editor'
import { NoteCard } from './components/NoteCard'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutsModal } from './components/ShortcutsModal'
import { MarkdownGuideModal } from './components/MarkdownGuideModal'
import { UpdateModal } from './components/UpdateModal'
import type { UpdateStatus } from '../../preload/index.d'
import { startOnboardingTour } from './lib/tour'

export const AppContent: React.FC = () => {
  const {
    notes,
    folders,
    config,
    activeDragNote,
    setActiveDragNote,
    moveNoteToFolder,
    reorderNotes,
    createNote,
    activeNoteId,
    insertMarkdownSnippet,
    togglePinNote,
    softDeleteNote,
    setTheme,
    setFont,
    toggleSidebar,
    toggleTypewriterMode,
    setTypingSound,
    completeTour
  } = useNotes()

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)
  const [isMarkdownGuideOpen, setIsMarkdownGuideOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [appVersion, setAppVersion] = useState('1.0.0')
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({ state: 'idle' })

  // Listen for auto-updater status and fetch initial version
  useEffect(() => {
    window.electronAPI?.getAppVersion?.().then((ver) => {
      if (ver) setAppVersion(ver)
    }).catch(() => {})

    const unsubscribe = window.electronAPI?.onUpdaterStatus?.((status) => {
      setUpdateStatus(status)
      if (status.currentVersion) {
        setAppVersion(status.currentVersion)
      }

      if (status.state === 'available') {
        toast.info(`Versi baru v${status.version} tersedia!`, {
          description: 'Klik untuk melihat catatan rilis dan mengunduh.',
          action: {
            label: 'Lihat Pembaruan',
            onClick: () => setIsUpdateModalOpen(true)
          }
        })
      } else if (status.state === 'downloaded') {
        toast.success(`Pembaruan v${status.version} siap dipasang!`, {
          description: 'Aplikasi dapat segera dimuat ulang untuk memperbarui.',
          action: {
            label: 'Mulai Ulang',
            onClick: () => window.electronAPI?.quitAndInstall?.()
          }
        })
      }
    })

    // Silent background check after 6 seconds
    const backgroundCheckTimer = setTimeout(() => {
      window.electronAPI?.checkForUpdates?.().catch(() => {})
    }, 6000)

    return () => {
      unsubscribe?.()
      clearTimeout(backgroundCheckTimer)
    }
  }, [])

  const handleCheckForUpdates = (): void => {
    setIsUpdateModalOpen(true)
    setUpdateStatus({ state: 'checking', currentVersion: appVersion })
    window.electronAPI?.checkForUpdates?.().catch(() => {})
  }

  const handleDownloadUpdate = (): void => {
    window.electronAPI?.downloadUpdate?.().catch(() => {})
  }

  const handleQuitAndInstall = (): void => {
    window.electronAPI?.quitAndInstall?.().catch(() => {})
  }

  // Configure PointerSensor with distance constraint to not clash with titlebar drag or normal clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    })
  )

  // Auto-launch driver.js tour on first run
  useEffect(() => {
    if (notes.length > 0 && !config.hasCompletedTour) {
      const timer = setTimeout(() => {
        startOnboardingTour(() => {
          completeTour()
        })
      }, 700)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [config.hasCompletedTour, notes.length, completeTour])

  // Global Keyboard Shortcuts (Capture Phase)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey

      // Alt + Z: Toggle Typewriter Mode
      if (e.altKey && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')) {
        e.preventDefault()
        e.stopPropagation()
        toggleTypewriterMode()
        return
      }

      // F11: Toggle Fullscreen
      if (e.key === 'F11') {
        e.preventDefault()
        window.electronAPI?.toggleFullScreen()
        return
      }

      // Ctrl/Cmd + K: Command Palette
      if (isCmdOrCtrl && (e.key.toLowerCase() === 'k' || e.code === 'KeyK')) {
        e.preventDefault()
        e.stopPropagation()
        setIsCommandPaletteOpen((prev) => !prev)
        return
      }

      // Ctrl/Cmd + / or ?: Shortcuts Modal
      if (isCmdOrCtrl && (e.key === '/' || e.key === '?' || e.code === 'Slash')) {
        e.preventDefault()
        e.stopPropagation()
        setIsShortcutsOpen((prev) => !prev)
        return
      }

      // Ctrl/Cmd + M: Markdown Guide
      if (isCmdOrCtrl && (e.key.toLowerCase() === 'm' || e.code === 'KeyM')) {
        e.preventDefault()
        e.stopPropagation()
        setIsMarkdownGuideOpen((prev) => !prev)
        return
      }

      // Ctrl/Cmd + N: New Note
      if (isCmdOrCtrl && (e.key.toLowerCase() === 'n' || e.code === 'KeyN')) {
        e.preventDefault()
        e.stopPropagation()
        createNote()
        return
      }

      // Ctrl/Cmd + B: Toggle Sidebar
      if (isCmdOrCtrl && (e.key.toLowerCase() === 'b' || e.code === 'KeyB')) {
        e.preventDefault()
        e.stopPropagation()
        toggleSidebar()
        return
      }

      // Ctrl/Cmd + P: Toggle Pin on active note
      if (isCmdOrCtrl && (e.key.toLowerCase() === 'p' || e.code === 'KeyP')) {
        if (activeNoteId) {
          e.preventDefault()
          e.stopPropagation()
          togglePinNote(activeNoteId)
        }
        return
      }

      // Ctrl/Cmd + Backspace: Delete active note
      if (isCmdOrCtrl && e.key === 'Backspace') {
        if (activeNoteId) {
          e.preventDefault()
          e.stopPropagation()
          softDeleteNote(activeNoteId)
        }
        return
      }

      // Ctrl/Cmd + Shift + T: Toggle Theme
      if (isCmdOrCtrl && e.shiftKey && (e.key.toLowerCase() === 't' || e.code === 'KeyT')) {
        e.preventDefault()
        e.stopPropagation()
        setTheme(config.theme === 'warm-paper' ? 'matte-obsidian' : 'warm-paper')
        return
      }

      // Ctrl/Cmd + Shift + F: Cycle Font
      if (isCmdOrCtrl && e.shiftKey && (e.key.toLowerCase() === 'f' || e.code === 'KeyF')) {
        e.preventDefault()
        e.stopPropagation()
        const fonts: ('editorial' | 'sans' | 'mono')[] = ['editorial', 'sans', 'mono']
        const nextIndex = (fonts.indexOf(config.font) + 1) % fonts.length
        setFont(fonts[nextIndex])
        return
      }
    }

    // Capture phase guarantees shortcuts are received even when typing in textarea or inputs
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [
    activeNoteId,
    config.font,
    config.theme,
    createNote,
    setTheme,
    setFont,
    softDeleteNote,
    togglePinNote,
    toggleSidebar,
    toggleTypewriterMode
  ])

  // Drag Handlers
  const handleDragStart = (event: DragStartEvent): void => {
    const { active } = event
    const foundNote = notes.find((n) => n.id === active.id)
    if (foundNote) {
      setActiveDragNote(foundNote)
    }
  }

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    setActiveDragNote(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Dropped onto a sidebar target (droppable-folderId or droppable-trash)
    if (overId.startsWith('droppable-')) {
      const targetId = overId.replace('droppable-', '')
      moveNoteToFolder(activeId, targetId === 'trash' ? 'trash' : targetId)
      return
    }

    // Reordered within note list
    if (activeId !== overId) {
      reorderNotes(activeId, overId)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-screen w-screen overflow-hidden bg-paper-canvas text-ink-primary font-body antialiased">
        {/* Column 1: Sidebar (210px) */}
        <AnimatePresence initial={false}>
          {config.isSidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 210, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="h-full overflow-hidden shrink-0"
            >
              <Sidebar
                onOpenShortcuts={() => setIsShortcutsOpen(true)}
                onOpenMarkdownGuide={() => setIsMarkdownGuideOpen(true)}
                onOpenUpdateModal={handleCheckForUpdates}
                appVersion={appVersion}
                hasUpdateAvailable={updateStatus.state === 'available' || updateStatus.state === 'downloaded'}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Column 2: Note Index List (270px) */}
        <NoteList />

        {/* Column 3: Distraction-Free Editor (1fr) */}
        <Editor onOpenMarkdownGuide={() => setIsMarkdownGuideOpen(true)} />

        {/* Tactile Drag Overlay with Spring Physics & Deep Shadow */}
        <DragOverlay
          dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
          }}
        >
          {activeDragNote ? (
            <motion.div
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.03, rotate: -1.5 }}
              transition={{ type: 'spring', stiffness: 450, damping: 28 }}
              className="w-[260px] shadow-2xl pointer-events-none"
            >
              <NoteCard
                note={activeDragNote}
                isActive={true}
                folder={folders.find((f) => f.id === activeDragNote.folderId)}
                isDraggingOverlay={true}
              />
            </motion.div>
          ) : null}
        </DragOverlay>

        {/* Command Palette Modal (Ctrl+K) */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onOpenMarkdownGuide={() => setIsMarkdownGuideOpen(true)}
          onOpenUpdateModal={handleCheckForUpdates}
          appVersion={appVersion}
        />

        {/* Keyboard Shortcuts Modal (Ctrl+/) */}
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />

        {/* Markdown Syntax Guide Modal (Ctrl+M) */}
        <MarkdownGuideModal
          isOpen={isMarkdownGuideOpen}
          onClose={() => setIsMarkdownGuideOpen(false)}
          onInsertMarkdown={insertMarkdownSnippet}
        />

        {/* Auto-Updater Modal */}
        <UpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          status={updateStatus}
          onCheckForUpdates={handleCheckForUpdates}
          onDownloadUpdate={handleDownloadUpdate}
          onQuitAndInstall={handleQuitAndInstall}
        />

        {/* Stackable Sonner Toasts */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'bg-paper-card text-ink-primary border border-paper-border shadow-xl font-body text-xs rounded-xl',
            duration: 4000
          }}
        />
      </div>
    </DndContext>
  )
}
