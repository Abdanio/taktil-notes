import React, { useState } from 'react'
import {
  PushPin,
  Clock,
  Folder as FolderIcon,
  DotsThreeVertical,
  Smiley,
  Trash,
  LockKey
} from '@phosphor-icons/react'
import type { Note, Folder } from '../types'
import { formatIndonesianDate, extractPreview, cn } from '../lib/utils'
import { NoteIconRenderer, NoteIconPickerModal } from './NoteIconPicker'
import { useNotes } from '../context/NotesContext'

interface NoteCardProps {
  note: Note
  isActive: boolean
  folder?: Folder
  onClick?: () => void
  isDraggingOverlay?: boolean
  onTogglePin?: (e: React.MouseEvent) => void
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isActive,
  folder,
  onClick,
  isDraggingOverlay = false,
  onTogglePin
}) => {
  const { updateNoteIcon, softDeleteNote, unlockedNotes } = useNotes()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)

  const isLocked = Boolean(note.isEncrypted && !unlockedNotes[note.id])
  const previewText = isLocked
    ? '🔒 Catatan Terkunci — Masukkan kata sandi brankas untuk membuka'
    : extractPreview(note.content || (unlockedNotes[note.id] ?? ''))

  return (
    <>
      <div
        onClick={onClick}
        className={cn(
          'group relative w-full text-left rounded-xl p-3.5 transition-all duration-150 cursor-pointer overflow-hidden border',
          'bg-paper-card',
          isActive
            ? 'border-accent/50 shadow-sm ring-1 ring-accent/25 bg-paper-card'
            : 'border-paper-border hover:border-ink-muted/40 hover:bg-paper-hover/40',
          isDraggingOverlay &&
            'shadow-2xl border-accent/60 ring-2 ring-accent/30 cursor-grabbing bg-paper-card scale-[1.02]'
        )}
      >
        <div className="flex flex-col gap-2">
          {/* Header: Note Icon Badge + Title + Action Controls */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Tactile Note Icon Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsIconPickerOpen(true)
                }}
                title="Klik untuk mengganti ikon catatan"
                className="w-6 h-6 rounded-md bg-accent/15 text-accent hover:bg-accent/25 flex items-center justify-center shrink-0 transition-colors"
              >
                <NoteIconRenderer iconName={note.icon} size={14} weight="duotone" />
              </button>

              <h4
                className={cn(
                  'font-heading text-sm font-semibold leading-snug line-clamp-1 flex items-center gap-1.5',
                  isActive ? 'text-accent' : 'text-ink-primary'
                )}
              >
                {note.isEncrypted && (
                  <LockKey
                    size={12}
                    weight="bold"
                    className={isLocked ? 'text-amber-500 shrink-0' : 'text-emerald-500 shrink-0'}
                  />
                )}
                <span>{note.title || 'Catatan Baru'}</span>
              </h4>
            </div>

            {/* Right Indicators & 3-Dots Button */}
            <div className="flex items-center gap-1 shrink-0 pt-0.5">
              {note.reminder && (
                <span
                  title={note.reminder.label}
                  className="text-accent hover:opacity-80 transition-opacity"
                >
                  <Clock size={13} weight="bold" />
                </span>
              )}

              {note.isPinned && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTogglePin?.(e)
                  }}
                  title="Lepas sematan"
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  <PushPin size={13} weight="fill" />
                </button>
              )}

              {/* 3-Dots Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMenuOpen(!isMenuOpen)
                  }}
                  title="Menu catatan"
                  className="w-5 h-5 rounded text-ink-muted hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  <DotsThreeVertical size={14} weight="bold" />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-6 w-36 bg-paper-card border border-paper-border rounded-xl p-1 shadow-xl z-30 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false)
                        setIsIconPickerOpen(true)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-ink-primary hover:bg-paper-hover transition-colors text-left"
                    >
                      <Smiley size={14} weight="bold" className="text-accent" />
                      <span>Ganti Ikon</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        setIsMenuOpen(false)
                        onTogglePin?.(e)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-ink-primary hover:bg-paper-hover transition-colors text-left"
                    >
                      <PushPin size={14} weight="bold" />
                      <span>{note.isPinned ? 'Lepas Sematan' : 'Sematkan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false)
                        softDeleteNote(note.id)
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors text-left"
                    >
                      <Trash size={14} weight="bold" />
                      <span>Ke Sampah</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2-line Content Preview */}
          <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed font-body">
            {previewText}
          </p>

          {/* Footer: Timestamp & Folder Badge */}
          <div className="flex items-center justify-between text-[11px] text-ink-muted pt-0.5">
            <span className="font-code tracking-tight">
              {formatIndonesianDate(note.updatedAt)}
            </span>

            {folder && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{
                  backgroundColor: `${folder.color}15`,
                  color: folder.color
                }}
              >
                <FolderIcon size={10} weight="fill" />
                <span className="max-w-[70px] truncate">{folder.name}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Icon Picker Modal */}
      <NoteIconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        currentIcon={note.icon}
        onSelectIcon={(iconName) => updateNoteIcon(note.id, iconName)}
      />
    </>
  )
}
