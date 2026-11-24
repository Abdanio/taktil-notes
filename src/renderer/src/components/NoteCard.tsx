import React from 'react'
import { PushPin, Clock, Folder as FolderIcon } from '@phosphor-icons/react'
import type { Note, Folder } from '../types'
import { formatIndonesianDate, extractPreview, cn } from '../lib/utils'

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
  const ribbonColor = folder?.color || '#D95D39'
  const previewText = extractPreview(note.content)

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative w-full text-left rounded-xl p-3.5 transition-all duration-150 cursor-pointer overflow-hidden border',
        'bg-paper-card',
        isActive
          ? 'border-accent/40 shadow-sm ring-1 ring-accent/20'
          : 'border-paper-border hover:border-ink-muted/40 hover:bg-paper-hover/40',
        isDraggingOverlay &&
          'shadow-2xl border-accent/60 ring-2 ring-accent/30 cursor-grabbing bg-paper-card'
      )}
    >
      {/* Category Ribbon on the Left Edge */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 transition-all group-hover:w-1.5"
        style={{ backgroundColor: ribbonColor }}
      />

      <div className="pl-1.5 flex flex-col gap-1.5">
        {/* Header: Title and Pin */}
        <div className="flex items-start justify-between gap-1.5">
          <h4
            className={cn(
              'font-heading text-sm font-semibold leading-snug line-clamp-1',
              isActive ? 'text-accent' : 'text-ink-primary'
            )}
          >
            {note.title || 'Catatan Baru'}
          </h4>

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
          </div>
        </div>

        {/* 2-line Content Preview */}
        <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed font-body">
          {previewText}
        </p>

        {/* Footer: Timestamp & Folder Badge */}
        <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1">
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
  )
}
