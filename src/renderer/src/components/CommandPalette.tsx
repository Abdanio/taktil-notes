import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MagnifyingGlass,
  Plus,
  Files,
  PushPin,
  Trash,
  Sun,
  Moon,
  TextT,
  Question,
  Keyboard,
  PushPinSlash,
  Folder as FolderIcon,
  BookOpen,
  CloudArrowDown,
  Waveform,
  TextAlignCenter,
  Graph
} from '@phosphor-icons/react'
import { useNotes } from '../context/NotesContext'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenShortcuts: () => void
  onOpenMarkdownGuide?: () => void
  onOpenGraphModal?: () => void
  onOpenUpdateModal?: () => void
  appVersion?: string
}

interface CommandAction {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  section: string
  run: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenShortcuts,
  onOpenMarkdownGuide,
  onOpenGraphModal,
  onOpenUpdateModal,
  appVersion = '1.0.0'
}) => {
  const {
    notes,
    folders,
    config,
    createNote,
    setActiveNoteId,
    setActiveFilter,
    setTheme,
    setFont,
    setTypingSound,
    toggleTypewriterMode,
    toggleAlwaysOnTop,
    startTour
  } = useNotes()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build commands list
  const actions: CommandAction[] = [
    {
      id: 'action-new-note',
      title: 'Buat Catatan Baru',
      subtitle: 'Tambahkan lembaran catatan baru',
      icon: <Plus size={16} weight="bold" />,
      section: 'Aksi Cepat',
      run: () => {
        createNote()
        onClose()
      }
    },
    {
      id: 'action-open-graph',
      title: 'Buka Peta Pengetahuan (Constellation Graph)',
      subtitle: 'Ctrl+G - Visualisasi relasi tautan antar-catatan',
      icon: <Graph size={16} weight="duotone" className="text-accent" />,
      section: 'Navigasi',
      run: () => {
        onClose()
        onOpenGraphModal?.()
      }
    },
    {
      id: 'action-filter-all',
      title: 'Buka Semua Catatan',
      icon: <Files size={16} weight="regular" />,
      section: 'Navigasi',
      run: () => {
        setActiveFilter('all')
        onClose()
      }
    },
    {
      id: 'action-filter-pinned',
      title: 'Buka Catatan Disematkan',
      icon: <PushPin size={16} weight="fill" />,
      section: 'Navigasi',
      run: () => {
        setActiveFilter('pinned')
        onClose()
      }
    },
    {
      id: 'action-filter-trash',
      title: 'Buka Sampah',
      icon: <Trash size={16} weight="regular" />,
      section: 'Navigasi',
      run: () => {
        setActiveFilter('trash')
        onClose()
      }
    },
    {
      id: 'action-theme-toggle',
      title: config.theme === 'warm-paper' ? 'Ganti ke Matte Obsidian (Gelap)' : 'Ganti ke Warm Paper (Terang)',
      icon: config.theme === 'warm-paper' ? <Moon size={16} weight="fill" /> : <Sun size={16} weight="fill" />,
      section: 'Pengaturan',
      run: () => {
        setTheme(config.theme === 'warm-paper' ? 'matte-obsidian' : 'warm-paper')
        onClose()
      }
    },
    {
      id: 'action-font-editorial',
      title: 'Tipografi: Editorial Serif (Fraunces)',
      icon: <TextT size={16} weight="bold" />,
      section: 'Pengaturan',
      run: () => {
        setFont('editorial')
        onClose()
      }
    },
    {
      id: 'action-font-sans',
      title: 'Tipografi: Clean Sans (Plus Jakarta Sans)',
      icon: <TextT size={16} weight="regular" />,
      section: 'Pengaturan',
      run: () => {
        setFont('sans')
        onClose()
      }
    },
    {
      id: 'action-font-mono',
      title: 'Tipografi: Developer Mono (JetBrains Mono)',
      icon: <TextT size={16} weight="duotone" />,
      section: 'Pengaturan',
      run: () => {
        setFont('mono')
        onClose()
      }
    },
    {
      id: 'action-toggle-typewriter',
      title: config.typewriterMode ? 'Nonaktifkan Mode Mesin Tik' : 'Aktifkan Mode Mesin Tik (Typewriter Focus)',
      subtitle: 'Alt+Z - Kunci baris penulisan aktif di tengah layar',
      icon: <TextAlignCenter size={16} weight="bold" className="text-accent" />,
      section: 'Pengaturan',
      run: () => {
        toggleTypewriterMode()
        onClose()
      }
    },
    {
      id: 'action-sound-thock',
      title: 'Suara Ketikan: Thock Mekanikal',
      subtitle: 'Resonansi empuk switch mechanical keyboard',
      icon: <Waveform size={16} weight="bold" className="text-accent" />,
      section: 'Audio',
      run: () => {
        setTypingSound('thock')
        onClose()
      }
    },
    {
      id: 'action-sound-typewriter',
      title: 'Suara Ketikan: Mesin Tik Vintage',
      subtitle: 'Ketukan logam renyah dan lonceng Enter',
      icon: <Waveform size={16} weight="bold" className="text-accent" />,
      section: 'Audio',
      run: () => {
        setTypingSound('typewriter')
        onClose()
      }
    },
    {
      id: 'action-sound-paper',
      title: 'Suara Ketikan: Friksi Kertas Katun',
      subtitle: 'Goresan pulpen pada kertas bertekstur',
      icon: <Waveform size={16} weight="bold" className="text-accent" />,
      section: 'Audio',
      run: () => {
        setTypingSound('paper')
        onClose()
      }
    },
    {
      id: 'action-sound-none',
      title: 'Suara Ketikan: Hening (Bisu)',
      subtitle: 'Mengetik tanpa efek suara audio',
      icon: <Waveform size={16} weight="regular" />,
      section: 'Audio',
      run: () => {
        setTypingSound('none')
        onClose()
      }
    },
    {
      id: 'action-toggle-pin-window',
      title: config.alwaysOnTop ? 'Nonaktifkan Mode Melayang' : 'Aktifkan Mode Melayang (Always on Top)',
      icon: <PushPinSlash size={16} weight="bold" />,
      section: 'Pengaturan',
      run: () => {
        toggleAlwaysOnTop()
        onClose()
      }
    },
    {
      id: 'action-markdown-guide',
      title: 'Buka Panduan Sintaksis Markdown',
      icon: <BookOpen size={16} weight="bold" className="text-accent" />,
      section: 'Bantuan',
      run: () => {
        onClose()
        onOpenMarkdownGuide?.()
      }
    },
    {
      id: 'action-check-update',
      title: 'Periksa Pembaruan Aplikasi (Auto-Update)',
      subtitle: `Versi saat ini: v${appVersion}`,
      icon: <CloudArrowDown size={16} weight="bold" className="text-accent" />,
      section: 'Bantuan',
      run: () => {
        onClose()
        onOpenUpdateModal?.()
      }
    },
    {
      id: 'action-shortcuts',
      title: 'Daftar Pintasan Keyboard',
      icon: <Keyboard size={16} weight="bold" />,
      section: 'Bantuan',
      run: () => {
        onClose()
        onOpenShortcuts()
      }
    },
    {
      id: 'action-tour',
      title: 'Mulai Ulang Panduan Interaktif',
      icon: <Question size={16} weight="bold" />,
      section: 'Bantuan',
      run: () => {
        onClose()
        startTour()
      }
    }
  ]

  // Add folder shortcuts
  folders.forEach((f) => {
    actions.push({
      id: `action-folder-${f.id}`,
      title: `Buka Folder: ${f.name}`,
      icon: <FolderIcon size={16} weight="fill" style={{ color: f.color }} />,
      section: 'Folder',
      run: () => {
        setActiveFilter(f.id)
        onClose()
      }
    })
  })

  // Add notes direct jump
  notes
    .filter((n) => !n.isTrash)
    .forEach((n) => {
      actions.push({
        id: `action-note-${n.id}`,
        title: n.title || 'Catatan Baru',
        subtitle: n.content.slice(0, 50).trim(),
        icon: <Files size={15} weight="regular" className="text-ink-secondary" />,
        section: 'Catatan',
        run: () => {
          setActiveNoteId(n.id)
          onClose()
        }
      })
    })

  // Filter actions by query
  const filteredActions = actions.filter((a) => {
    const q = query.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
      a.section.toLowerCase().includes(q)
    )
  })

  // Key navigation
  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].run()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative w-full max-w-xl bg-paper-card border border-paper-border rounded-2xl shadow-2xl overflow-hidden z-10 select-none flex flex-col"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-paper-border">
              <MagnifyingGlass size={18} weight="bold" className="text-ink-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ketik perintah atau cari catatan..."
                className="w-full bg-transparent text-ink-primary placeholder:text-ink-muted text-sm font-body outline-none"
              />
              <kbd className="kbd-keycap text-[10px]">Esc</kbd>
            </div>

            {/* Results List */}
            <div className="max-h-[360px] overflow-y-auto p-2 space-y-1">
              {filteredActions.length === 0 ? (
                <div className="py-8 text-center text-ink-muted text-xs">
                  Tidak ada perintah atau catatan yang cocok.
                </div>
              ) : (
                filteredActions.map((item, index) => {
                  const isSelected = index === selectedIndex
                  return (
                    <div
                      key={item.id}
                      onClick={item.run}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-accent/15 text-accent font-medium'
                          : 'text-ink-primary hover:bg-paper-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-accent text-white' : 'bg-paper-hover text-ink-secondary'
                          }`}
                        >
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs truncate leading-snug">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-[11px] text-ink-muted truncate font-body">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-ink-muted tracking-wide shrink-0 ml-2 font-mono">
                        {item.section}
                      </span>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer Navigation Hints */}
            <div className="px-4 py-2 border-t border-paper-border/60 bg-paper-sidebar/50 flex items-center justify-between text-[11px] text-ink-muted">
              <div className="flex items-center gap-2">
                <span>Pilih</span>
                <kbd className="kbd-keycap text-[9px]">↑</kbd>
                <kbd className="kbd-keycap text-[9px]">↓</kbd>
                <span>Jalankan</span>
                <kbd className="kbd-keycap text-[9px]">↵</kbd>
              </div>
              <span>Total {filteredActions.length} item</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
