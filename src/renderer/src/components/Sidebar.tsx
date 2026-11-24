import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useDroppable } from '@dnd-kit/core'
import {
  Files,
  PushPin,
  Trash,
  Folder as FolderIcon,
  Plus,
  Sun,
  Moon,
  TextT,
  Question,
  Keyboard,
  X
} from '@phosphor-icons/react'
import { useNotes } from '../context/NotesContext'
import type { Folder, FilterType } from '../types'
import { cn } from '../lib/utils'

interface SidebarProps {
  onOpenShortcuts: () => void
}

const FOLDER_COLORS = ['#D95D39', '#81B29A', '#F2CC8F', '#3D405B', '#E07A5F', '#588157']

// Droppable Sidebar Item for Folders and Trash
const DroppableSidebarTarget: React.FC<{
  id: string
  label: string
  count: number
  color?: string
  icon: (isOver: boolean, isSelected: boolean) => React.ReactNode
  isSelected: boolean
  onClick: () => void
  onDelete?: () => void
}> = ({ id, label, count, color, icon, isSelected, onClick, onDelete }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `droppable-${id}`,
    data: { targetId: id }
  })

  return (
    <motion.div
      ref={setNodeRef}
      animate={{
        scale: isOver ? 1.08 : 1
      }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      onClick={onClick}
      className={cn(
        'group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors duration-150',
        isSelected ? 'text-ink-primary font-medium' : 'text-ink-secondary hover:text-ink-primary',
        isOver && 'ring-2 ring-accent border-accent bg-accent/10 z-10'
      )}
    >
      {/* Gliding Active Pill */}
      {isSelected && (
        <motion.div
          layoutId="active-folder-pill"
          className="absolute inset-0 rounded-lg bg-paper-active"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}

      <div className="relative z-10 flex items-center gap-2 min-w-0">
        {color && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        <span className="shrink-0">{icon(isOver, isSelected)}</span>
        <span className="truncate">{label}</span>
      </div>

      <div className="relative z-10 flex items-center gap-1 shrink-0 ml-1">
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            title="Hapus folder"
            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-0.5 rounded"
          >
            <X size={12} weight="bold" />
          </button>
        )}
        <span className="text-[11px] text-ink-muted font-code tabular-nums">{count}</span>
      </div>
    </motion.div>
  )
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenShortcuts }) => {
  const {
    notes,
    folders,
    activeFilter,
    config,
    setActiveFilter,
    createFolder,
    deleteFolder,
    setTheme,
    setFont,
    startTour
  } = useNotes()

  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0])

  // Count calculations
  const totalActiveNotes = notes.filter((n) => !n.isTrash).length
  const pinnedNotesCount = notes.filter((n) => n.isPinned && !n.isTrash).length
  const trashNotesCount = notes.filter((n) => n.isTrash).length

  const getFolderCount = (folderId: string): number =>
    notes.filter((n) => n.folderId === folderId && !n.isTrash).length

  const handleCreateFolder = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!newFolderName.trim()) return
    createFolder(newFolderName.trim(), newFolderColor)
    setNewFolderName('')
    setIsAddingFolder(false)
  }

  const cycleFont = (): void => {
    const fonts: ('editorial' | 'sans' | 'mono')[] = ['editorial', 'sans', 'mono']
    const nextIndex = (fonts.indexOf(config.font) + 1) % fonts.length
    setFont(fonts[nextIndex])
  }

  const getFontLabel = (): string => {
    switch (config.font) {
      case 'editorial':
        return 'Editorial'
      case 'sans':
        return 'Clean Sans'
      case 'mono':
        return 'Dev Mono'
    }
  }

  return (
    <aside
      id="sidebar-container"
      className="w-[210px] h-full flex flex-col justify-between bg-paper-sidebar border-r border-paper-border paper-grain select-none relative z-10 shrink-0"
    >
      {/* Top Window Drag Region & Branding */}
      <div className="flex flex-col">
        {/* Electron Window Drag Header */}
        <div className="h-10 app-drag-region flex items-center px-3.5 gap-2 border-b border-paper-border/50">
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-sm shrink-0" />
          <span className="font-heading text-xs font-bold tracking-tight text-ink-primary">
            Catatan Taktil
          </span>
        </div>

        {/* Quick Nav Filters */}
        <div className="p-2 space-y-0.5">
          {/* Semua Catatan */}
          <div
            onClick={() => setActiveFilter('all')}
            className={cn(
              'group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors',
              activeFilter === 'all'
                ? 'text-ink-primary font-medium'
                : 'text-ink-secondary hover:text-ink-primary'
            )}
          >
            {activeFilter === 'all' && (
              <motion.div
                layoutId="active-folder-pill"
                className="absolute inset-0 rounded-lg bg-paper-active"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Files
                size={15}
                weight={activeFilter === 'all' ? 'fill' : 'regular'}
                className={activeFilter === 'all' ? 'text-accent' : 'text-ink-secondary'}
              />
              <span>Semua Catatan</span>
            </div>
            <span className="relative z-10 text-[11px] text-ink-muted font-code tabular-nums">
              {totalActiveNotes}
            </span>
          </div>

          {/* Disematkan */}
          <div
            onClick={() => setActiveFilter('pinned')}
            className={cn(
              'group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors',
              activeFilter === 'pinned'
                ? 'text-ink-primary font-medium'
                : 'text-ink-secondary hover:text-ink-primary'
            )}
          >
            {activeFilter === 'pinned' && (
              <motion.div
                layoutId="active-folder-pill"
                className="absolute inset-0 rounded-lg bg-paper-active"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <PushPin
                size={15}
                weight={activeFilter === 'pinned' ? 'fill' : 'regular'}
                className={activeFilter === 'pinned' ? 'text-accent' : 'text-ink-secondary'}
              />
              <span>Disematkan</span>
            </div>
            <span className="relative z-10 text-[11px] text-ink-muted font-code tabular-nums">
              {pinnedNotesCount}
            </span>
          </div>

          {/* Sampah (Droppable target for notes) */}
          <DroppableSidebarTarget
            id="trash"
            label="Sampah"
            count={trashNotesCount}
            isSelected={activeFilter === 'trash'}
            onClick={() => setActiveFilter('trash')}
            icon={(isOver, isSelected) => (
              <Trash
                size={15}
                weight={isOver ? 'duotone' : isSelected ? 'fill' : 'regular'}
                className={
                  isOver ? 'text-red-500' : isSelected ? 'text-accent' : 'text-ink-secondary'
                }
              />
            )}
          />
        </div>

        {/* Folders Section */}
        <div className="px-2 pt-3 pb-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-ink-muted">
              Folder
            </span>
            <button
              onClick={() => setIsAddingFolder(!isAddingFolder)}
              title="Tambah folder baru"
              className="text-ink-muted hover:text-accent transition-colors p-0.5 rounded"
            >
              <Plus size={13} weight="bold" />
            </button>
          </div>

          {/* Inline Folder Creation Form */}
          {isAddingFolder && (
            <form onSubmit={handleCreateFolder} className="p-2 mb-2 bg-paper-card rounded-lg border border-paper-border text-xs">
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nama folder..."
                className="w-full bg-transparent border-b border-paper-border pb-1 mb-2 outline-none text-ink-primary placeholder:text-ink-muted"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFolderColor(c)}
                      className={cn(
                        'w-3.5 h-3.5 rounded-full transition-transform',
                        newFolderColor === c && 'scale-125 ring-1 ring-ink-primary'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingFolder(false)}
                    className="px-1.5 py-0.5 text-[10px] text-ink-muted hover:text-ink-primary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 text-[10px] bg-accent text-white rounded font-medium"
                  >
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Folder List with Droppable Magnetic Target */}
          <div className="space-y-0.5 max-h-[220px] overflow-y-auto pr-0.5">
            {folders.map((folder) => (
              <DroppableSidebarTarget
                key={folder.id}
                id={folder.id}
                label={folder.name}
                color={folder.color}
                count={getFolderCount(folder.id)}
                isSelected={activeFilter === folder.id}
                onClick={() => setActiveFilter(folder.id as FilterType)}
                onDelete={() => deleteFolder(folder.id)}
                icon={(isOver, isSelected) => (
                  <FolderIcon
                    size={14}
                    weight={isOver ? 'duotone' : isSelected ? 'fill' : 'regular'}
                    style={{ color: folder.color }}
                  />
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Actions: Theme, Font, Shortcuts, Guide */}
      <div className="p-2 border-t border-paper-border/50 flex flex-col gap-1">
        {/* Font Switcher Button */}
        <button
          onClick={cycleFont}
          title="Ganti Jenis Huruf"
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-ink-secondary hover:text-ink-primary hover:bg-paper-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <TextT size={15} weight="bold" />
            <span>Huruf</span>
          </div>
          <span className="text-[10px] font-mono text-ink-muted px-1.5 py-0.5 rounded bg-paper-card border border-paper-border">
            {getFontLabel()}
          </span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(config.theme === 'warm-paper' ? 'matte-obsidian' : 'warm-paper')}
          title="Alihkan Tema Gelap / Terang"
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-ink-secondary hover:text-ink-primary hover:bg-paper-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            {config.theme === 'warm-paper' ? (
              <Moon size={15} weight="bold" />
            ) : (
              <Sun size={15} weight="fill" className="text-amber-400" />
            )}
            <span>Tema</span>
          </div>
          <span className="text-[10px] text-ink-muted">
            {config.theme === 'warm-paper' ? 'Warm Paper' : 'Obsidian'}
          </span>
        </button>

        {/* Shortcuts & Guide Trigger */}
        <div className="flex items-center justify-between pt-1 px-1">
          <button
            onClick={onOpenShortcuts}
            title="Pintasan Keyboard (Ctrl+/)"
            className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors"
          >
            <Keyboard size={16} weight="bold" />
          </button>

          <button
            id="help-tour-button"
            onClick={startTour}
            title="Mulai Panduan Interaktif"
            className="w-7 h-7 rounded-lg text-ink-secondary hover:text-accent hover:bg-paper-hover flex items-center justify-center transition-colors"
          >
            <Question size={16} weight="bold" />
          </button>
        </div>
      </div>
    </aside>
  )
}
