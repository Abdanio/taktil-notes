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
  TextAlignCenter,
  LinkSimple,
  CaretDown,
  CaretRight,
  FileText,
  Plus,
  Export,
  FilePdf,
  FileHtml,
  Book,
  PencilSimpleLine,
  LockKey,
  LockKeyOpen,
  ShieldCheck
} from '@phosphor-icons/react'
import { useNotes } from '../context/NotesContext'
import { MarkdownRenderer } from './MarkdownRenderer'
import { DeleteConfirmDialog } from './DeleteConfirmDialog'
import { NoteIconRenderer, NoteIconPickerModal } from './NoteIconPicker'
import { SketchCanvasModal } from './SketchCanvasModal'
import { toast } from 'sonner'
import { cn } from '../lib/utils'
import { soundEffects } from '../lib/sound'

interface EditorProps {
  onOpenMarkdownGuide: () => void
}

export const Editor: React.FC<EditorProps> = ({ onOpenMarkdownGuide }) => {
  const {
    notes,
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
    toggleTypewriterMode,
    createNote,
    setActiveNoteId,
    setActiveFilter,
    unlockedNotes,
    encryptNote,
    unlockNote,
    lockNote,
    removeNoteEncryption
  } = useNotes()

  const [mode, setMode] = useState<'hybrid' | 'write' | 'preview'>('hybrid')
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [isSoundMenuOpen, setIsSoundMenuOpen] = useState(false)
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false)
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [isSketchModalOpen, setIsSketchModalOpen] = useState(false)
  const [isEncryptModalOpen, setIsEncryptModalOpen] = useState(false)
  const [isRemoveEncryptModalOpen, setIsRemoveEncryptModalOpen] = useState(false)
  const [isVaultMenuOpen, setIsVaultMenuOpen] = useState(false)
  const [vaultPasswordInput, setVaultPasswordInput] = useState('')
  const [vaultConfirmInput, setVaultConfirmInput] = useState('')
  const [vaultUnlockInput, setVaultUnlockInput] = useState('')
  const [isVaultSubmitting, setIsVaultSubmitting] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [wikiQuery, setWikiQuery] = useState<string | null>(null)
  const [wikiCursorPos, setWikiCursorPos] = useState<number | null>(null)
  const [isBacklinksExpanded, setIsBacklinksExpanded] = useState(true)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Calculate Backlinks (notes that reference current note)
  const backlinks = React.useMemo(() => {
    if (!activeNote || !activeNote.title.trim()) return []
    const target = `[[${activeNote.title.toLowerCase().trim()}]]`
    return notes.filter((n) => {
      if (n.id === activeNote.id || n.isTrash) return false
      return n.content.toLowerCase().includes(target)
    })
  }, [notes, activeNote])

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

  const handleUnlockVault = async (): Promise<void> => {
    if (!activeNote || !vaultUnlockInput.trim()) return
    setIsVaultSubmitting(true)
    const success = await unlockNote(activeNote.id, vaultUnlockInput)
    setIsVaultSubmitting(false)
    if (success) {
      setVaultUnlockInput('')
    }
  }

  const handleApplyEncryption = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!activeNote) return
    if (!vaultPasswordInput.trim()) {
      toast.error('Kata sandi tidak boleh kosong.')
      return
    }
    if (vaultPasswordInput !== vaultConfirmInput) {
      toast.error('Konfirmasi kata sandi tidak cocok.')
      return
    }
    setIsVaultSubmitting(true)
    const success = await encryptNote(activeNote.id, vaultPasswordInput)
    setIsVaultSubmitting(false)
    if (success) {
      setIsEncryptModalOpen(false)
      setVaultPasswordInput('')
      setVaultConfirmInput('')
    }
  }

  const handleRemoveEncryption = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!activeNote || !vaultPasswordInput.trim()) return
    setIsVaultSubmitting(true)
    const success = await removeNoteEncryption(activeNote.id, vaultPasswordInput)
    setIsVaultSubmitting(false)
    if (success) {
      setIsRemoveEncryptModalOpen(false)
      setVaultPasswordInput('')
    }
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
    checkWikiAutocomplete(e.target.value, e.target.selectionStart)
  }

  const checkWikiAutocomplete = (content: string, cursorPos: number): void => {
    const beforeCursor = content.slice(0, cursorPos)
    const lastDoubleOpen = beforeCursor.lastIndexOf('[[')
    const lastDoubleClose = beforeCursor.lastIndexOf(']]')

    if (lastDoubleOpen !== -1 && lastDoubleOpen > lastDoubleClose) {
      const query = beforeCursor.slice(lastDoubleOpen + 2)
      if (!query.includes('\n')) {
        setWikiQuery(query)
        setWikiCursorPos(lastDoubleOpen)
        return
      }
    }
    setWikiQuery(null)
    setWikiCursorPos(null)
  }

  const insertWikiLink = (noteTitle: string): void => {
    if (wikiCursorPos === null || !textareaRef.current) return
    const content = activeNote.content
    const before = content.slice(0, wikiCursorPos)
    const afterCursor = content.slice(textareaRef.current.selectionStart)
    const newContent = `${before}[[${noteTitle}]] ${afterCursor}`
    updateNoteContent(activeNote.id, newContent, activeNote.title)
    setWikiQuery(null)
    setWikiCursorPos(null)
    soundEffects.playChecklistBounce()
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = wikiCursorPos + noteTitle.length + 5
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 20)
  }

  const handleWikiLinkClick = (targetTitle: string): void => {
    soundEffects.playChecklistBounce()
    const found = notes.find(
      (n) => !n.isTrash && n.title.toLowerCase().trim() === targetTitle.toLowerCase().trim()
    )
    if (found) {
      setActiveNoteId(found.id)
      setActiveFilter('all')
    } else {
      const newNote = createNote(null, 'FileText')
      updateNoteContent(
        newNote.id,
        `# ${targetTitle}\n\nCatatan ini dibuat otomatis dari tautan Wiki.`,
        targetTitle
      )
      setActiveNoteId(newNote.id)
      setActiveFilter('all')
      toast.success(`Catatan baru "${targetTitle}" dibuat dari tautan!`)
    }
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

  // Export note to PDF, HTML, or EPUB
  const handleExport = async (format: 'pdf' | 'html' | 'epub'): Promise<void> => {
    if (!activeNote || !window.electronAPI) return
    setIsExportMenuOpen(false)
    soundEffects.playChecklistBounce()
    const html = markdownToHtml(activeNote.content)

    toast.info(`Menyiapkan ekspor ${format.toUpperCase()}...`)

    let result
    if (format === 'pdf') {
      result = await window.electronAPI.exportPdf({
        title: activeNote.title || 'Catatan Taktil',
        htmlContent: html,
        markdownContent: activeNote.content
      })
    } else if (format === 'html') {
      result = await window.electronAPI.exportHtml({
        title: activeNote.title || 'Catatan Taktil',
        htmlContent: html,
        markdownContent: activeNote.content
      })
    } else if (format === 'epub') {
      result = await window.electronAPI.exportEpub({
        title: activeNote.title || 'Catatan Taktil',
        htmlContent: html,
        markdownContent: activeNote.content
      })
    }

    if (result?.success) {
      toast.success(`Berkas ${format.toUpperCase()} berhasil diekspor!`, {
        description: result.filePath
      })
    } else if (result?.error) {
      toast.error(`Gagal mengekspor: ${result.error}`)
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

          {/* Freehand Sketch Canvas Trigger */}
          <button
            onClick={() => setIsSketchModalOpen(true)}
            title="Buka Kanvas Coretan Tangan (Sketsa Bebas)"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-paper-sidebar hover:bg-paper-hover border border-paper-border text-[11px] font-medium text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
          >
            <PencilSimpleLine size={13} weight="bold" className="text-accent" />
            <span className="hidden sm:inline">Sketsa</span>
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

          {/* Export Document Menu */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              title="Ekspor Dokumen (PDF, HTML, EPUB)"
              className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                isExportMenuOpen
                  ? 'text-accent bg-accent/15'
                  : 'text-ink-secondary hover:text-ink-primary hover:bg-paper-hover'
              )}
            >
              <Export size={15} weight="bold" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-9 w-60 bg-paper-card border border-paper-border rounded-xl p-2 shadow-2xl z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-ink-muted border-b border-paper-border/60 mb-1 flex items-center justify-between">
                  <span>Ekspor Catatan Editorial</span>
                  <button
                    onClick={() => setIsExportMenuOpen(false)}
                    className="hover:text-ink-primary cursor-pointer"
                  >
                    <X size={12} weight="bold" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left p-2 rounded-lg hover:bg-paper-hover text-ink-primary transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-md bg-red-500/10 text-red-500 shrink-0 mt-0.5">
                    <FilePdf size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs group-hover:text-accent transition-colors">
                      PDF Buku Editorial
                    </div>
                    <div className="text-[10px] text-ink-muted leading-tight">
                      Tata letak cetak A4, drop-cap pembuka, nomor halaman
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('html')}
                  className="w-full text-left p-2 rounded-lg hover:bg-paper-hover text-ink-primary transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500 shrink-0 mt-0.5">
                    <FileHtml size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs group-hover:text-accent transition-colors">
                      HTML Mandiri (Offline)
                    </div>
                    <div className="text-[10px] text-ink-muted leading-tight">
                      Berkas tunggal dengan font & gaya terintegrasi
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleExport('epub')}
                  className="w-full text-left p-2 rounded-lg hover:bg-paper-hover text-ink-primary transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                    <Book size={16} weight="bold" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs group-hover:text-accent transition-colors">
                      Buku Digital EPUB
                    </div>
                    <div className="text-[10px] text-ink-muted leading-tight">
                      Format e-reader untuk Kindle, Kobo & Apple Books
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Encrypted Vault Button */}
          <div className="relative">
            {activeNote.isEncrypted ? (
              unlockedNotes[activeNote.id] ? (
                <button
                  onClick={() => setIsVaultMenuOpen(!isVaultMenuOpen)}
                  title="Catatan Terenkripsi (Terbuka) — Klik untuk opsi brankas"
                  className="w-7 h-7 rounded-lg text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <LockKeyOpen size={15} weight="bold" />
                </button>
              ) : (
                <button
                  disabled
                  title="Catatan Terkunci"
                  className="w-7 h-7 rounded-lg text-amber-500 bg-amber-500/10 flex items-center justify-center transition-colors"
                >
                  <LockKey size={15} weight="bold" />
                </button>
              )
            ) : (
              <button
                onClick={() => {
                  setVaultPasswordInput('')
                  setVaultConfirmInput('')
                  setIsEncryptModalOpen(true)
                }}
                title="Kunci Catatan Ini dengan Enkripsi AES-256"
                className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
              >
                <LockKey size={15} weight="regular" />
              </button>
            )}

            {isVaultMenuOpen && activeNote.isEncrypted && unlockedNotes[activeNote.id] && (
              <div className="absolute right-0 top-9 w-52 bg-paper-card border border-paper-border rounded-xl p-2 shadow-2xl z-50 text-xs space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-ink-muted border-b border-paper-border/60 mb-1 flex items-center justify-between">
                  <span>Brankas Catatan</span>
                  <button onClick={() => setIsVaultMenuOpen(false)} className="hover:text-ink-primary cursor-pointer">
                    <X size={12} weight="bold" />
                  </button>
                </div>
                <button
                  onClick={() => {
                    setIsVaultMenuOpen(false)
                    lockNote(activeNote.id)
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-ink-primary hover:bg-paper-hover transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LockKey size={14} className="text-amber-500" />
                  <span>Kunci Kembali Sekarang</span>
                </button>
                <button
                  onClick={() => {
                    setIsVaultMenuOpen(false)
                    setVaultPasswordInput('')
                    setIsRemoveEncryptModalOpen(true)
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <LockKeyOpen size={14} />
                  <span>Lepas Enkripsi</span>
                </button>
              </div>
            )}
          </div>

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

          {/* Editor Body or Locked Vault Screen */}
          {activeNote.isEncrypted && !unlockedNotes[activeNote.id] ? (
            <div className="flex flex-col items-center justify-center p-8 text-center my-auto min-h-[380px] bg-paper-card/40 rounded-2xl border border-paper-border/80 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-sm">
                <LockKey size={32} weight="duotone" />
              </div>
              <h3 className="font-heading text-xl font-bold text-ink-primary mb-1">
                Catatan Terenkripsi (Brankas Taktil)
              </h3>
              <p className="text-xs text-ink-secondary max-w-sm mb-6 leading-relaxed">
                Catatan ini dikunci dengan algoritma enkripsi AES-256-GCM. Masukkan kata sandi atau PIN untuk membukanya.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleUnlockVault()
                }}
                className="w-full max-w-xs space-y-3"
              >
                <input
                  type="password"
                  value={vaultUnlockInput}
                  onChange={(e) => setVaultUnlockInput(e.target.value)}
                  placeholder="Kata sandi brankas..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-paper-border bg-paper-card text-ink-primary text-sm font-mono placeholder:text-ink-muted/50 outline-none focus:border-accent text-center shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!vaultUnlockInput.trim() || isVaultSubmitting}
                  className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <LockKeyOpen size={16} weight="bold" />
                  <span>{isVaultSubmitting ? 'Membuka...' : 'Buka Kunci Catatan'}</span>
                </button>
              </form>
            </div>
          ) : mode === 'write' ? (
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
                onWikiLinkClick={handleWikiLinkClick}
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
                  onWikiLinkClick={handleWikiLinkClick}
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

          {/* Wiki-Link Autocomplete Popup */}
          {wikiQuery !== null && (
            <div className="my-2 p-2 rounded-xl bg-paper-card border border-paper-border shadow-2xl space-y-1 max-h-48 overflow-y-auto">
              <div className="px-2 py-1 text-[11px] font-semibold text-ink-muted flex items-center justify-between border-b border-paper-border/60">
                <span>Tautkan Catatan ([[...)</span>
                <button
                  type="button"
                  onClick={() => setWikiQuery(null)}
                  className="text-ink-muted hover:text-ink-primary"
                >
                  <X size={12} weight="bold" />
                </button>
              </div>
              {notes
                .filter(
                  (n) =>
                    !n.isTrash &&
                    n.id !== activeNote.id &&
                    n.title.toLowerCase().includes(wikiQuery.toLowerCase())
                )
                .slice(0, 6)
                .map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => insertWikiLink(suggestion.title)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-paper-hover text-ink-primary text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <NoteIconRenderer iconName={suggestion.icon} size={15} weight="duotone" />
                    <span className="truncate">{suggestion.title || 'Tanpa Judul'}</span>
                  </button>
                ))}
              {wikiQuery.trim() && (
                <button
                  type="button"
                  onClick={() => insertWikiLink(wikiQuery.trim())}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-accent/10 text-accent text-xs flex items-center gap-2 transition-colors cursor-pointer border-t border-paper-border/60 pt-2"
                >
                  <Plus size={14} weight="bold" />
                  <span>
                    Buat tautan baru: "<strong>{wikiQuery.trim()}</strong>"
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Backlinks Explorer Panel */}
          <div className="mt-10 pt-6 border-t border-paper-border/60 space-y-3">
            <button
              type="button"
              onClick={() => setIsBacklinksExpanded(!isBacklinksExpanded)}
              className="flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink-primary transition-colors cursor-pointer select-none"
            >
              {isBacklinksExpanded ? (
                <CaretDown size={14} weight="bold" />
              ) : (
                <CaretRight size={14} weight="bold" />
              )}
              <LinkSimple size={15} weight="bold" className="text-accent" />
              <span>Tautan Balik (Backlinks)</span>
              <span className="px-1.5 py-0.5 rounded-full bg-paper-sidebar border border-paper-border text-[10px] font-mono">
                {backlinks.length}
              </span>
            </button>

            {isBacklinksExpanded && (
              <div className="space-y-2">
                {backlinks.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-paper-border/70 text-center text-xs text-ink-muted bg-paper-sidebar/30">
                    Belum ada catatan lain yang menautkan ke "<strong>{activeNote.title}</strong>". Ketik{' '}
                    <code className="font-mono text-accent bg-paper-card px-1 py-0.5 rounded border border-paper-border">
                      [[{activeNote.title}]]
                    </code>{' '}
                    di catatan lain untuk menghubungkan pemikiran secara organik.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {backlinks.map((refNote) => (
                      <button
                        key={refNote.id}
                        type="button"
                        onClick={() => {
                          soundEffects.playChecklistBounce()
                          setActiveNoteId(refNote.id)
                          setActiveFilter('all')
                        }}
                        className="text-left p-3 rounded-xl border border-paper-border/80 bg-paper-card/70 hover:bg-paper-card hover:border-accent/40 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <NoteIconRenderer
                            iconName={refNote.icon}
                            size={16}
                            weight="duotone"
                            className="text-accent"
                          />
                          <h5 className="font-editorial text-xs font-semibold text-ink-primary group-hover:text-accent transition-colors truncate">
                            {refNote.title || 'Tanpa Judul'}
                          </h5>
                        </div>
                        <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed font-body">
                          {refNote.content.replace(/^#+\s+/gm, '').slice(0, 120)}...
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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

      {/* Freehand Sketch Canvas Modal */}
      <SketchCanvasModal
        isOpen={isSketchModalOpen}
        onClose={() => setIsSketchModalOpen(false)}
        onInsertSketch={(snippet) => {
          updateNoteContent(activeNote.id, activeNote.content + snippet, activeNote.title)
        }}
      />

      {/* Encrypt Note Dialog */}
      {isEncryptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-paper-border bg-paper-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                <LockKey size={20} weight="duotone" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-ink-primary">
                  Kunci & Enkripsi Catatan
                </h3>
                <p className="text-[11px] text-ink-muted">Enkripsi AES-256-GCM tingkat militer</p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              Catatan ini akan dienkripsi secara lokal. Tanpa kata sandi atau PIN, isi catatan tidak dapat dipulihkan oleh siapa pun.
            </p>

            <form onSubmit={handleApplyEncryption} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Kata Sandi / PIN Baru
                </label>
                <input
                  type="password"
                  value={vaultPasswordInput}
                  onChange={(e) => setVaultPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-paper-border bg-paper-sidebar text-xs text-ink-primary outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Konfirmasi Kata Sandi
                </label>
                <input
                  type="password"
                  value={vaultConfirmInput}
                  onChange={(e) => setVaultConfirmInput(e.target.value)}
                  placeholder="Ulangi kata sandi..."
                  className="w-full px-3 py-2 rounded-xl border border-paper-border bg-paper-sidebar text-xs text-ink-primary outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEncryptModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary rounded-xl border border-paper-border hover:bg-paper-hover transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVaultSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isVaultSubmitting ? 'Mengenkripsi...' : 'Terapkan Enkripsi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Encryption Dialog */}
      {isRemoveEncryptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-paper-border bg-paper-card p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
                <LockKeyOpen size={20} weight="duotone" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-ink-primary">
                  Lepas Enkripsi Catatan
                </h3>
                <p className="text-[11px] text-ink-muted">Simpan kembali sebagai teks biasa</p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed">
              Masukkan kata sandi brankas untuk memastikan identitas Anda sebelum melepas proteksi enkripsi.
            </p>

            <form onSubmit={handleRemoveEncryption} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-ink-muted block mb-1">
                  Kata Sandi Brankas
                </label>
                <input
                  type="password"
                  value={vaultPasswordInput}
                  onChange={(e) => setVaultPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl border border-paper-border bg-paper-sidebar text-xs text-ink-primary outline-none focus:border-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRemoveEncryptModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-ink-secondary hover:text-ink-primary rounded-xl border border-paper-border hover:bg-paper-hover transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVaultSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isVaultSubmitting ? 'Memproses...' : 'Lepas Enkripsi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

function markdownToHtml(md: string): string {
  let html = md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\[\[(.*?)\]\]/gim, '<strong>$1</strong>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
    .replace(/^\s*[-*]\s+\[x\]\s*(.*$)/gim, '<div>☑ $1</div>')
    .replace(/^\s*[-*]\s+\[ \]\s*(.*$)/gim, '<div>☐ $1</div>')
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')

  html = html.replace(/```([\s\S]*?)```/gm, (_match, p1) => {
    return `<pre><code>${p1.trim()}</code></pre>`
  })

  const blocks = html.split(/\n\s*\n/)
  return blocks
    .map((b) => {
      const trimmed = b.trim()
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<pre') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<li') ||
        trimmed.startsWith('<div')
      ) {
        return trimmed
      }
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`
    })
    .join('\n')
}
