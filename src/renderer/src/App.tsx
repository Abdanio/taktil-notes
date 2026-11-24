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
import { Toaster } from 'sonner'
import { useNotes } from './context/NotesContext'
import { Sidebar } from './components/Sidebar'
import { NoteList } from './components/NoteList'
import { Editor } from './components/Editor'
import { NoteCard } from './components/NoteCard'
import { CommandPalette } from './components/CommandPalette'
import { ShortcutsModal } from './components/ShortcutsModal'
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
    togglePinNote,
    softDeleteNote,
    setTheme,
    setFont,
    toggleSidebar,
    completeTour
  } = useNotes()

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false)

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey

      // Ctrl/Cmd + K: Command Palette
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen((prev) => !prev)
        return
      }

      // Ctrl/Cmd + /: Shortcuts Modal
      if (isCmdOrCtrl && e.key === '/') {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
        return
      }

      // Ctrl/Cmd + N: New Note
      if (isCmdOrCtrl && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        createNote()
        return
      }

      // Ctrl/Cmd + B: Toggle Sidebar
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Ctrl/Cmd + P: Toggle Pin on active note
      if (isCmdOrCtrl && e.key.toLowerCase() === 'p') {
        if (activeNoteId) {
          e.preventDefault()
          togglePinNote(activeNoteId)
        }
        return
      }

      // Ctrl/Cmd + Backspace: Delete active note
      if (isCmdOrCtrl && e.key === 'Backspace') {
        if (activeNoteId) {
          e.preventDefault()
          softDeleteNote(activeNoteId)
        }
        return
      }

      // Ctrl/Cmd + Shift + T: Toggle Theme
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        setTheme(config.theme === 'warm-paper' ? 'matte-obsidian' : 'warm-paper')
        return
      }

      // Ctrl/Cmd + Shift + F: Cycle Font
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        const fonts: ('editorial' | 'sans' | 'mono')[] = ['editorial', 'sans', 'mono']
        const nextIndex = (fonts.indexOf(config.font) + 1) % fonts.length
        setFont(fonts[nextIndex])
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    activeNoteId,
    config.font,
    config.theme,
    createNote,
    setTheme,
    setFont,
    softDeleteNote,
    togglePinNote,
    toggleSidebar
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
              <Sidebar onOpenShortcuts={() => setIsShortcutsOpen(true)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Column 2: Note Index List (270px) */}
        <NoteList />

        {/* Column 3: Distraction-Free Editor (1fr) */}
        <Editor />

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
        />

        {/* Keyboard Shortcuts Modal (Ctrl+/) */}
        <ShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
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
