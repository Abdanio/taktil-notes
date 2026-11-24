import React, { useState, useRef, useEffect } from 'react'
import {
  Bell,
  Sidebar as SidebarIcon,
  PushPin,
  PushPinSlash,
  Trash,
  ArrowCounterClockwise,
  Minus,
  Square,
  X,
  Eye,
  PencilSimple,
  UploadSimple,
  Clock,
  CheckCircle,
  CornersOut,
  CornersIn,
  BookOpen,
  SpeakerHigh,
  Waveform,
  TextAlignCenter
} from '@phosphor-icons/react'
import { useNotes } from '../context/NotesContext'
import { MarkdownRenderer } from './MarkdownRenderer'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { NoteIconRenderer, NoteIconPickerModal } from './NoteIconPicker'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { soundEffects } from '../lib/sound'

interface EditorProps {
  onOpenMarkdownGuide: () => void
}

export const Editor: React.FC<EditorProps> = ({ onOpenMarkdownGuide }) => {
  const {
    activeNote,
    isSaving,
    config,
    toggleSidebar,
    toggleAlwaysOnTop,
    updateNoteContent,
    updateNoteIcon,
    softDeleteNote,
    restoreNote,
    permanentlyDeleteNote,
    setNoteReminder,
    clearNoteReminder,
    setTypingSound,
    toggleTypewriterMode
  } = useNotes()

  const [mode, setMode] = useState<'hybrid' | 'write' | 'preview'>('hybrid')
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false)
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Track window state changes in real time
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized)
      window.electronAPI.isFullScreen().then(setIsFullScreen)

      const cleanup = window.electronAPI.onWindowStateChanged((state) => {
        setIsMaximized(state.isMaximized)
        setIsFullScreen(state.isFullScreen)
      })
      return cleanup
    }
    return undefined
  }, [])

  // Window Controls
  const handleMinimize = (): void => {
    window.electronAPI?.minimize()
  }

  const handleMaximize = async (): Promise<void> => {
    if (window.electronAPI) {
      const state = await window.electronAPI.maximize()
      setIsMaximized(state)
    }
  }

  const handleToggleFullScreen = async (): Promise<void> => {
    if (window.electronAPI) {
      const state = await window.electronAPI.toggleFullScreen()
      setIsFullScreen(state)
    }
  }

  const handleClose = (): void => {
    window.electronAPI?.close()
  }

  if (!activeNote) {
    return (
      <div className="flex-1 h-full flex flex-col bg-paper-canvas select-none">
        {/* Top Window Drag Header */}
        <div className="h-10 app-drag-region flex items-center justify-between px-3 border-b border-paper-border/50">
          <button
            onClick={toggleSidebar}
            className="app-no-drag p-1 text-ink-secondary hover:text-ink-primary rounded"
          >
            <SidebarIcon size={16} />
          </button>
          <div className="app-no-drag flex items-center gap-1">
            <button
              onClick={handleMinimize}
              title="Kecilkan"
              className="w-8 h-8 flex items-center justify-center text-ink-secondary hover:bg-paper-hover rounded-lg transition-colors cursor-pointer"
            >
              <Minus size={14} weight="bold" />
            </button>
            <button
              onClick={handleMaximize}
              title={isMaximized ? 'Pulihkan' : 'Perbesar Jendela'}
              className="w-8 h-8 flex items-center justify-center text-ink-secondary hover:bg-paper-hover rounded-lg transition-colors cursor-pointer"
            >
              <Square size={13} weight={isMaximized ? 'fill' : 'bold'} />
            </button>
            <button
              onClick={handleToggleFullScreen}
              title={isFullScreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
              className="w-8 h-8 flex items-center justify-center text-ink-secondary hover:bg-paper-hover rounded-lg transition-colors cursor-pointer"
            >
              {isFullScreen ? (
                <CornersIn size={14} weight="bold" />
              ) : (
                <CornersOut size={14} weight="bold" />
              )}
            </button>
            <button
              onClick={handleClose}
              title="Tutup"
              className="w-8 h-8 flex items-center justify-center text-ink-secondary hover:bg-red-500 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center text-xs text-ink-muted">
          Pilih atau buat catatan baru untuk mulai menulis.
        </div>
      </div>
    )
  }

  // Handle Title Change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    updateNoteContent(activeNote.id, activeNote.content, e.target.value)
  }

  // Handle Content Change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    updateNoteContent(activeNote.id, e.target.value, activeNote.title)
    handleTypewriterScroll()
  }

  const handleTypewriterScroll = (): void => {
    if (!config.typewriterMode || !textareaRef.current || !scrollContainerRef.current) return
    const textarea = textareaRef.current
    const scrollContainer = scrollContainerRef.current

    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart)
    const lineCount = textBeforeCursor.split('\n').length
    const estimatedCursorTop = lineCount * 24 + 100

    const targetScroll = estimatedCursorTop - scrollContainer.clientHeight / 2
    scrollContainer.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: 'smooth'
    })
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    soundEffects.playKeySound(config.typingSound || 'thock', e.key)
    setTimeout(handleTypewriterScroll, 10)
  }

  // Handle Living Checkbox Toggle in Markdown View
  const handleToggleCheckbox = (lineIndex: number, newChecked: boolean): void => {
    soundEffects.playChecklistBounce()
    const lines = activeNote.content.split('\n')
    if (lines[lineIndex] !== undefined) {
      lines[lineIndex] = lines[lineIndex].replace(
        /^(\s*[-*]\s*\[)[ xX](\])/,
        `$1${newChecked ? 'x' : ' '}$2`
      )
      updateNoteContent(activeNote.id, lines.join('\n'), activeNote.title)
    }
  }

  // External File Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(true)
  }

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDraggingFile(false)
  }

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingFile(false)

    const files = Array.from(e.dataTransfer.files)
    if (!files.length) return

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase()

      if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '')) {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64 = reader.result as string
          if (window.electronAPI) {
            const result = await window.electronAPI.saveAsset(file.name, base64)
            if (result.success) {
              const imageMarkdown = `\n\n![${file.name}](${result.assetUrl})\n`
              updateNoteContent(
                activeNote.id,
                activeNote.content + imageMarkdown,
                activeNote.title
              )
              toast.success(`Gambar "${file.name}" berhasil disisipkan!`)
            } else {
              toast.error('Gagal menyimpan aset gambar.')
            }
          }
        }
        reader.readAsDataURL(file)
      } else if (['md', 'txt'].includes(ext || '')) {
        const text = await file.text()
        const appended = `${activeNote.content}\n\n<!-- Impor dari ${file.name} -->\n${text}`
        updateNoteContent(activeNote.id, appended, activeNote.title)
        toast.success(`File "${file.name}" berhasil diimpor!`)
      } else {
        toast.warning(`Format file .${ext} tidak didukung. Gunakan gambar atau file teks/md.`)
      }
    }
  }

  return (
    <main
      id="editor-container"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 h-full flex flex-col bg-paper-canvas select-none relative overflow-hidden"
    >
      {/* Top Toolbar */}
      <div className="h-10 app-drag-region flex items-center justify-between px-3.5 border-b border-paper-border/60 bg-paper-canvas/80 backdrop-blur-sm z-20 shrink-0">
        {/* Left: Sidebar Toggle & Auto-save Status */}
        <div className="app-no-drag flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            title="Alihkan Sidebar (Ctrl+B)"
            className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
          >
            <SidebarIcon size={16} weight="regular" />
          </button>

          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors',
                isSaving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              )}
            />
            <span className="font-body text-[11px]">
              {isSaving ? 'Menyimpan...' : 'Tersimpan'}
            </span>
          </div>
        </div>

        {/* Center: Mode Switcher & Markdown Guide */}
        <div className="app-no-drag flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-paper-sidebar p-0.5 border border-paper-border text-[11px]">
            <button
              onClick={() => setMode('write')}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                mode === 'write'
                  ? 'bg-paper-card text-ink-primary shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              <PencilSimple size={12} weight="bold" />
              <span>Tulis</span>
            </button>

            <button
              onClick={() => setMode('hybrid')}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                mode === 'hybrid'
                  ? 'bg-paper-card text-ink-primary shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              <CheckCircle size={12} weight="bold" />
              <span>Interaktif</span>
            </button>

            <button
              onClick={() => setMode('preview')}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer',
                mode === 'preview'
                  ? 'bg-paper-card text-ink-primary shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              <Eye size={12} weight="bold" />
              <span>Pratinjau</span>
            </button>
          </div>

          {/* Quick Markdown Guide Trigger */}
          <button
            onClick={onOpenMarkdownGuide}
            title="Buka Panduan Sintaksis Markdown"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-paper-sidebar hover:bg-paper-hover border border-paper-border text-[11px] font-medium text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
          >
            <BookOpen size={13} weight="bold" className="text-accent" />
            <span className="hidden sm:inline">Panduan Markdown</span>
          </button>
        </div>

        {/* Right: Actions & Custom Window Controls */}
        <div className="app-no-drag flex items-center gap-1">
          {/* Typewriter Focus Mode Toggle */}
          <button
            onClick={toggleTypewriterMode}
            title={config.typewriterMode ? 'Matikan Mode Mesin Tik' : 'Aktifkan Mode Mesin Tik (Alt+Z)'}
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
              config.typewriterMode
                ? 'text-accent bg-accent/15'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-paper-hover'
            )}
          >
            <TextAlignCenter size={15} weight="bold" />
          </button>

          {/* Sensory Typing Audio Selector */}
          <div className="relative">
            <button
              onClick={() => setIsSoundMenuOpen(!isSoundMenuOpen)}
              title="Sensory Typing Audio"
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                config.typingSound && config.typingSound !== 'none'
                  ? 'text-accent bg-accent/15'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-paper-hover'
              )}
            >
              <Waveform size={15} weight="bold" />
            </button>

            {isSoundMenuOpen && (
              <div className="absolute right-0 top-9 w-52 bg-paper-card border border-paper-border rounded-xl p-2 shadow-2xl z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-ink-muted border-b border-paper-border/60 mb-1 flex items-center justify-between">
                  <span>Suara Ketikan Akustik</span>
                  <button onClick={() => setIsSoundMenuOpen(false)} className="hover:text-ink-primary">
                    <X size={12} weight="bold" />
                  </button>
                </div>
                {[
                  { id: 'thock', label: 'Thock Mekanikal', desc: 'Resonansi switch pelumas' },
                  { id: 'typewriter', label: 'Mesin Tik Klasik', desc: 'Ketukan logam & lonceng' },
                  { id: 'paper', label: 'Goresan Kertas', desc: 'Friksi pulpen katun halus' },
                  { id: 'none', label: 'Bisu (Hening)', desc: 'Tanpa umpan balik audio' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setTypingSound(item.id as 'none' | 'thock' | 'typewriter' | 'paper')
                      setIsSoundMenuOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex flex-col',
                      config.typingSound === item.id
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-ink-secondary hover:text-ink-primary hover:bg-paper-hover'
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] text-ink-muted">{item.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reminder Bell */}
          <div className="relative">
            <button
              onClick={() => setIsReminderOpen(!isReminderOpen)}
              title="Setel Pengingat Desktop"
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                activeNote.reminder
                  ? 'text-accent bg-accent/15'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-paper-hover'
              )}
            >
              <Bell size={15} weight={activeNote.reminder ? 'fill' : 'regular'} />
            </button>

            {/* Reminder Popover */}
            {isReminderOpen && (
              <div className="absolute right-0 top-9 w-60 bg-paper-card border border-paper-border rounded-xl p-3 shadow-2xl z-50 text-xs">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-paper-border">
                  <span className="font-semibold text-ink-primary flex items-center gap-1">
                    <Clock size={13} weight="bold" />
                    Pengingat Desktop
                  </span>
                  <button
                    onClick={() => setIsReminderOpen(false)}
                    className="text-ink-muted hover:text-ink-primary"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </div>

                {activeNote.reminder ? (
                  <div className="space-y-2">
                    <div className="p-2 rounded bg-accent/10 text-accent text-[11px] font-medium flex items-center justify-between">
                      <span>Aktif: {activeNote.reminder.label}</span>
                      <SpeakerHigh size={13} weight="bold" />
                    </div>
                    <button
                      onClick={() => {
                        clearNoteReminder(activeNote.id)
                        setIsReminderOpen(false)
                      }}
                      className="w-full py-1 text-center text-red-500 hover:bg-red-500/10 rounded font-medium transition-colors"
                    >
                      Batalkan Pengingat
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        soundEffects.playChecklistBounce()
                        setNoteReminder(
                          activeNote.id,
                          10 * 1000,
                          'Uji coba suara & notifikasi desktop (10 detik)'
                        )
                        setIsReminderOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-paper-hover text-ink-primary transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">10 Detik</div>
                        <div className="text-[10px] text-ink-muted">Uji coba suara & notifikasi</div>
                      </div>
                      <span className="text-[10px] text-accent font-semibold px-1 py-0.5 rounded bg-accent/10">
                        Tes Suara
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        soundEffects.playChecklistBounce()
                        setNoteReminder(activeNote.id, 15 * 60 * 1000, 'Dalam 15 menit')
                        setIsReminderOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-paper-hover text-ink-primary transition-colors font-medium"
                    >
                      15 Menit
                    </button>

                    <button
                      onClick={() => {
                        soundEffects.playChecklistBounce()
                        setNoteReminder(activeNote.id, 60 * 60 * 1000, 'Dalam 1 jam')
                        setIsReminderOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-paper-hover text-ink-primary transition-colors font-medium"
                    >
                      1 Jam
                    </button>

                    <button
                      onClick={() => {
                        soundEffects.playChecklistBounce()
                        setNoteReminder(activeNote.id, 24 * 60 * 60 * 1000, 'Besok hari')
                        setIsReminderOpen(false)
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-paper-hover text-ink-primary transition-colors font-medium"
                    >
                      1 Hari (Besok)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mode Melayang (Always on Top) Pin */}
          <button
            id="always-on-top-button"
            onClick={toggleAlwaysOnTop}
            title={
              config.alwaysOnTop
                ? 'Nonaktifkan Mode Melayang (Always on Top)'
                : 'Aktifkan Mode Melayang (Always on Top)'
            }
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
              config.alwaysOnTop
                ? 'text-accent bg-accent/15'
                : 'text-ink-secondary hover:text-ink-primary hover:bg-paper-hover'
            )}
          >
            {config.alwaysOnTop ? (
              <PushPin size={15} weight="fill" />
            ) : (
              <PushPinSlash size={15} weight="regular" />
            )}
          </button>

          {/* Trash or Restore Action */}
          {activeNote.isTrash ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => restoreNote(activeNote.id)}
                title="Pulihkan Catatan"
                className="w-7 h-7 rounded-lg text-emerald-600 hover:bg-emerald-500/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowCounterClockwise size={15} weight="bold" />
              </button>
              <button
                onClick={() => setIsPermanentDeleteDialogOpen(true)}
                title="Hapus Permanen"
                className="w-7 h-7 rounded-lg text-red-600 hover:bg-red-500/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Trash size={15} weight="bold" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => softDeleteNote(activeNote.id)}
              title="Pindahkan ke Sampah"
              className="w-7 h-7 rounded-lg text-ink-secondary hover:text-red-500 hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
            >
              <Trash size={15} weight="regular" />
            </button>
          )}

          {/* Window Control Buttons */}
          <div className="flex items-center pl-1 border-l border-paper-border/60 ml-1">
            <button
              onClick={handleMinimize}
              title="Kecilkan"
              className="w-8 h-8 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
            >
              <Minus size={14} weight="bold" />
            </button>
            <button
              onClick={handleMaximize}
              title={isMaximized ? 'Pulihkan Jendela' : 'Perbesar Jendela'}
              className="w-8 h-8 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
            >
              <Square size={13} weight={isMaximized ? 'fill' : 'bold'} />
            </button>
            <button
              onClick={handleToggleFullScreen}
              title={isFullScreen ? 'Keluar Layar Penuh' : 'Layar Penuh (Fullscreen)'}
              className="w-8 h-8 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
            >
              {isFullScreen ? (
                <CornersIn size={14} weight="bold" />
              ) : (
                <CornersOut size={14} weight="bold" />
              )}
            </button>
            <button
              onClick={handleClose}
              title="Tutup"
              className="w-8 h-8 rounded-lg text-ink-secondary hover:text-white hover:bg-red-500 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Centered Writing Canvas (`max-w-[68ch] mx-auto`) */}
      <div
        ref={scrollContainerRef}
        id="editor-drop-area"
        className={cn(
          'flex-1 overflow-y-auto px-6 py-8 transition-all',
          config.typewriterMode && 'pt-[28vh] pb-[45vh]'
        )}
      >
        <div className="max-w-[68ch] mx-auto flex flex-col min-h-full">
          {/* Note Icon Button & Title Input Row */}
          <div className="flex items-center gap-3.5 pb-4 border-b border-paper-border/40 mb-6">
            <button
              type="button"
              onClick={() => setIsIconPickerOpen(true)}
              title="Klik untuk memilih ikon catatan"
              className="w-11 h-11 rounded-xl bg-accent/15 text-accent hover:bg-accent/25 flex items-center justify-center shrink-0 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <NoteIconRenderer iconName={activeNote.icon} size={24} weight="duotone" />
            </button>

            <input
              value={activeNote.title}
              onChange={handleTitleChange}
              placeholder="Judul Catatan..."
              disabled={activeNote.isTrash}
              className="w-full bg-transparent font-heading text-3xl font-bold tracking-tight text-ink-primary placeholder:text-ink-muted/50 outline-none"
            />
          </div>

          {/* Editor Body */}
          {mode === 'write' ? (
            <textarea
              ref={textareaRef}
              value={activeNote.content}
              onChange={handleContentChange}
              onKeyDown={handleTextareaKeyDown}
              disabled={activeNote.isTrash}
              placeholder="Tulis pemikiran Anda di sini... Mendukung Markdown (# Judul, **tebal**, - [ ] tugas, blok kode, dll)."
              className="w-full flex-1 bg-transparent text-sm leading-relaxed text-ink-primary placeholder:text-ink-muted font-body outline-none resize-none min-h-[450px]"
            />
          ) : mode === 'preview' ? (
            <div className="w-full flex-1 min-h-[450px]">
              <MarkdownRenderer
                content={activeNote.content}
                onToggleCheckbox={handleToggleCheckbox}
              />
            </div>
          ) : (
            /* Hybrid View */
            <div className="w-full flex-1 space-y-6 min-h-[450px]">
              <div className="p-4 rounded-xl border border-paper-border/70 bg-paper-card/60 shadow-xs">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-paper-border/50 text-[11px] text-ink-muted">
                  <span className="font-semibold text-accent">Tampilan Interaktif</span>
                  <span>Centang tugas langsung di bawah</span>
                </div>
                <MarkdownRenderer
                  content={activeNote.content}
                  onToggleCheckbox={handleToggleCheckbox}
                />
              </div>

              {/* Direct editor beneath with monospace font */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                    Edit Teks Mentah (Markdown)
                  </label>
                  <button
                    onClick={onOpenMarkdownGuide}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1"
                  >
                    <BookOpen size={12} weight="bold" />
                    <span>Lihat Sintaks</span>
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={activeNote.content}
                  onChange={handleContentChange}
                  onKeyDown={handleTextareaKeyDown}
                  disabled={activeNote.isTrash}
                  placeholder="Ketik markdown..."
                  className="w-full bg-paper-card/50 p-4 rounded-xl border border-paper-border text-xs leading-relaxed text-ink-primary font-mono outline-none focus:border-accent resize-y min-h-[180px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tactile Dashed External File Drop Overlay */}
      {isDraggingFile && (
        <div className="absolute inset-4 rounded-2xl border-2 border-dashed border-accent bg-paper-card/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 pointer-events-none animate-fade-in shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-4">
            <UploadSimple size={32} weight="bold" />
          </div>
          <h3 className="font-heading text-lg font-bold text-ink-primary mb-1">
            Jatuhkan File ke Kanvas
          </h3>
          <p className="text-xs text-ink-secondary text-center max-w-sm">
            Gambar (.png, .jpg, .webp) akan otomatis disimpan ke aset lokal, dan file teks (.md,
            .txt) akan diimpor langsung ke catatan ini.
          </p>
        </div>
      )}

      {/* Note Icon Picker Modal */}
      <NoteIconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        currentIcon={activeNote.icon}
        onSelectIcon={(iconName) => updateNoteIcon(activeNote.id, iconName)}
      />

      {/* Permanent delete confirmation dialog */}
      <DeleteConfirmDialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={setIsPermanentDeleteDialogOpen}
        title="Hapus Catatan Secara Permanen?"
        description={`Catatan "${activeNote.title}" akan dihapus selamanya dari penyimpanan lokal Anda.`}
        confirmLabel="Hapus Permanen"
        onConfirm={() => {
          permanentlyDeleteNote(activeNote.id)
          setIsPermanentDeleteDialogOpen(false)
        }}
      />
    </main>
  )
}
