import React, { useState } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  MagnifyingGlass,
  Plus,
  Trash,
  X,
  Funnel
} from '@phosphor-icons/react'
import { useNotes } from '../context/NotesContext'
import { SortableNoteCard } from './SortableNoteCard'
import { ParallaxEmptyState } from './ParallaxEmptyState'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'

export const NoteList: React.FC = () => {
  const {
    notes,
    folders,
    activeNoteId,
    activeFilter,
    searchQuery,
    setSearchQuery,
    setActiveNoteId,
    createNote,
    togglePinNote,
    emptyTrash
  } = useNotes()

  const [isEmptyTrashDialogOpen, setIsEmptyTrashDialogOpen] = useState(false)

  // Filter notes based on active filter
  const filteredBySection = notes.filter((note) => {
    if (activeFilter === 'trash') {
      return note.isTrash
    }
    // All other filters only consider non-trash notes
    if (note.isTrash) return false

    if (activeFilter === 'all') return true
    if (activeFilter === 'pinned') return note.isPinned
    // Otherwise filter by folder ID
    return note.folderId === activeFilter
  })

  // Filter notes based on search query
  const displayedNotes = filteredBySection.filter((note) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q)
    )
  })

  // Sorted: pinned first, then by updatedAt desc
  const sortedNotes = [...displayedNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return b.updatedAt - a.updatedAt
  })

  // Title for active section
  const getSectionTitle = (): string => {
    if (activeFilter === 'all') return 'Semua Catatan'
    if (activeFilter === 'pinned') return 'Disematkan'
    if (activeFilter === 'trash') return 'Sampah'
    const folder = folders.find((f) => f.id === activeFilter)
    return folder ? folder.name : 'Catatan'
  }

  const isTrashView = activeFilter === 'trash'

  return (
    <div
      id="note-list-container"
      className="w-[270px] h-full flex flex-col bg-paper-canvas border-r border-paper-border select-none shrink-0"
    >
      {/* Top Header & Search Bar */}
      <div className="p-3 border-b border-paper-border flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="font-heading text-sm font-bold text-ink-primary">
              {getSectionTitle()}
            </h2>
            <span className="text-[11px] text-ink-muted font-code tabular-nums px-1.5 py-0.5 rounded bg-paper-sidebar border border-paper-border/60">
              {sortedNotes.length}
            </span>
          </div>

          {/* Quick Create Note Button */}
          {!isTrashView ? (
            <button
              onClick={() => createNote()}
              title="Buat Catatan Baru (Ctrl+N)"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent text-white text-xs font-medium shadow-sm hover:bg-accent-hover transition-colors active:scale-[0.98]"
            >
              <Plus size={14} weight="bold" />
              <span>Baru</span>
            </button>
          ) : (
            sortedNotes.length > 0 && (
              <button
                onClick={() => setIsEmptyTrashDialogOpen(true)}
                title="Kosongkan Sampah"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-red-600 hover:bg-red-500/10 text-xs font-medium transition-colors"
              >
                <Trash size={13} weight="bold" />
                <span>Bersihkan</span>
              </button>
            )
          )}
        </div>

        {/* Search Input */}
        <div className="relative flex items-center">
          <MagnifyingGlass
            size={14}
            weight="bold"
            className="absolute left-2.5 text-ink-muted pointer-events-none"
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari dalam catatan..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-paper-card border border-paper-border text-xs text-ink-primary placeholder:text-ink-muted outline-none focus:border-accent transition-colors font-body"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-ink-muted hover:text-ink-primary p-0.5"
            >
              <X size={12} weight="bold" />
            </button>
          )}
        </div>
      </div>

      {/* Note Cards List or Empty State */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {sortedNotes.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            {searchQuery ? (
              <div className="p-6 text-center">
                <Funnel size={28} weight="duotone" className="mx-auto text-ink-muted mb-2" />
                <p className="text-xs text-ink-secondary">Tidak ada hasil untuk "{searchQuery}"</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-accent hover:underline"
                >
                  Hapus filter pencarian
                </button>
              </div>
            ) : isTrashView ? (
              <ParallaxEmptyState
                title="Sampah Kosong"
                description="Semua catatan yang dibuang akan muncul di sini sebelum dihapus permanen."
                showAction={false}
              />
            ) : (
              <ParallaxEmptyState
                title="Belum Ada Catatan"
                description="Mulai tuangkan pemikiran atau buat catatan baru di ruang ini."
                actionLabel="Catatan Baru"
                showAction={true}
              />
            )}
          </div>
        ) : (
          <SortableContext
            items={sortedNotes.map((n) => n.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedNotes.map((note) => {
              const folder = folders.find((f) => f.id === note.folderId)
              return (
                <SortableNoteCard
                  key={note.id}
                  note={note}
                  folder={folder}
                  isActive={activeNoteId === note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  onTogglePin={() => togglePinNote(note.id)}
                />
              )
            })}
          </SortableContext>
        )}
      </div>

      {/* Confirmation modal for emptying trash */}
      <DeleteConfirmDialog
        open={isEmptyTrashDialogOpen}
        onOpenChange={setIsEmptyTrashDialogOpen}
        title="Kosongkan Semua Sampah?"
        description="Semua catatan di dalam folder Sampah akan dihapus secara permanen dan tidak dapat dipulihkan."
        confirmLabel="Kosongkan Sampah"
        onConfirm={() => {
          emptyTrash()
          setIsEmptyTrashDialogOpen(false)
        }}
      />
    </div>
  )
}
