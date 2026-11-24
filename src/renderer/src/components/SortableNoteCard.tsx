import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { NoteCard } from './NoteCard'
import type { Note, Folder } from '../types'
import { cn } from '../lib/utils'

interface SortableNoteCardProps {
  note: Note
  isActive: boolean
  folder?: Folder
  onClick: () => void
  onTogglePin: (e: React.MouseEvent) => void
}

export const SortableNoteCard: React.FC<SortableNoteCardProps> = ({
  note,
  isActive,
  folder,
  onClick,
  onTogglePin
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: note.id,
    data: {
      type: 'note',
      note
    }
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    touchAction: 'none'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'transition-opacity duration-150',
        isDragging && 'opacity-40 pointer-events-none'
      )}
    >
      <NoteCard
        note={note}
        isActive={isActive}
        folder={folder}
        onClick={onClick}
        onTogglePin={onTogglePin}
      />
    </div>
  )
}
