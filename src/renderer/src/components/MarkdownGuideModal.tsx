import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  BookOpen,
  Copy,
  Checks,
  PlusCircle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { soundEffects } from '../lib/sound'

interface MarkdownGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertMarkdown?: (snippet: string) => void
}

interface GuideItem {
  title: string
  syntax: string
  example: string
  description: string
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    title: 'Judul Utama (H1)',
    syntax: '# Judul Catatan',
    example: '# Ide Besar Hari Ini',
    description: 'Heading level 1 dengan tipografi editorial Fraunces yang berbobot.'
  },
  {
    title: 'Subjudul (H2 & H3)',
    syntax: '## Subjudul\n### Sub-bagian',
    example: '## Rencana Aksi\n### Langkah 1: Brainstorming',
    description: 'Membagi catatan menjadi bab-bab terstruktur.'
  },
  {
    title: 'Daftar Tugas Interaktif (Checklist)',
    syntax: '- [ ] Tugas belum selesai\n- [x] Tugas selesai',
    example: '- [ ] Beli kopi\n- [x] Selesaikan draf artikel',
    description: 'Kotak centang hidup yang dapat diklik langsung di kanvas dengan animasi coret halus.'
  },
  {
    title: 'Penekanan Teks (Tebal & Miring)',
    syntax: '**Tebal** dan *Miring*',
    example: '**Penting**: Harap selesaikan sebelum *pukul 17.00*.',
    description: 'Menegaskan kata kunci penting di dalam paragraf.'
  },
  {
    title: 'Blok Kode (Fenced Code Block)',
    syntax: '```typescript\nconst status = "Tersimpan"\n```',
    example: '```typescript\nfunction halo() {\n  return "Catatan Taktil";\n}\n```',
    description: 'Blok kode dengan font monospaced JetBrains Mono dan tombol salin instan.'
  },
  {
    title: 'Kode Sebaris (Inline Code)',
    syntax: '`namaVariabel` atau `perintah`',
    example: 'Gunakan perintah `npm run build` untuk kompilasi.',
    description: 'Menandai sintaks, variabel, atau tombol pintas di tengah kalimat.'
  },
  {
    title: 'Kutipan Reflektif (Blockquote)',
    syntax: '> Kalimat kutipan di sini',
    example: '> "Kesederhanaan adalah bentuk kecanggihan yang paling tinggi."',
    description: 'Memberikan aksen garis tepi oranye terracotta untuk ide atau kutipan referensi.'
  },
  {
    title: 'Daftar Poin & Penomoran',
    syntax: '- Butir pertama\n- Butir kedua\n1. Langkah satu\n2. Langkah dua',
    example: '- Analisis pasar\n- Validasi pengguna\n1. Rilis MVP\n2. Kumpulkan masukan',
    description: 'Menata pemikiran secara hierarkis dan teratur.'
  },
  {
    title: 'Gambar & Tautan Web',
    syntax: '![Deskripsi Gambar](url)\n[Label Tautan](https://...)',
    example: '![Pratinjau](https://images.unsplash.com/photo-1517842645767-c639042777db?w=600)\n[Dokumentasi](https://electronjs.org)',
    description: 'Menampilkan ilustrasi atau tautan eksternal yang dapat diklik.'
  },
  {
    title: 'Garis Pembatas (Divider)',
    syntax: '---',
    example: 'Paragraf atas\n\n---\n\nParagraf bawah',
    description: 'Pemisah horizontal lembut untuk memisahkan topik pembahasan.'
  }
]

export const MarkdownGuideModal: React.FC<MarkdownGuideModalProps> = ({
  isOpen,
  onClose,
  onInsertMarkdown
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, idx: number): void => {
    navigator.clipboard.writeText(text)
    soundEffects.playChecklistBounce()
    setCopiedIndex(idx)
    toast.success('Sintaks berhasil disalin!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleInsert = (text: string): void => {
    if (onInsertMarkdown) {
      onInsertMarkdown(text)
      soundEffects.playChecklistBounce()
      toast.success('Sintaks disisipkan ke catatan!')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative w-full max-w-2xl bg-paper-card border border-paper-border rounded-2xl shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden select-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-paper-border shrink-0 bg-paper-card">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
                  <BookOpen size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink-primary">
                    Panduan Sintaksis Markdown
                  </h3>
                  <p className="text-xs text-ink-secondary font-body">
                    Format tulisan kaya dengan format cepat dan interaktif
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {GUIDE_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-paper-border bg-paper-canvas/50 hover:border-accent/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-heading text-sm font-semibold text-ink-primary">
                        {item.title}
                      </h4>
                      <p className="text-xs text-ink-secondary font-body mt-0.5">
                        {item.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopy(item.syntax, idx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-ink-secondary hover:text-ink-primary bg-paper-card border border-paper-border hover:bg-paper-hover transition-colors"
                        title="Salin sintaks"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Checks size={13} weight="bold" className="text-emerald-500" />
                            <span className="text-emerald-500">Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} weight="bold" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      {onInsertMarkdown && (
                        <button
                          onClick={() => handleInsert(item.example)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors shadow-xs"
                          title="Sisipkan contoh ke catatan aktif"
                        >
                          <PlusCircle size={13} weight="bold" />
                          <span>Sisipkan</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Code snippet display */}
                  <div className="mt-2.5 p-2.5 rounded-lg bg-paper-sidebar border border-paper-border/60 font-code text-xs text-ink-primary overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {item.syntax}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-paper-border bg-paper-sidebar/60 flex items-center justify-between text-xs text-ink-muted shrink-0">
              <span>Klik <strong>Sisipkan</strong> untuk langsung menambahkan ke catatan yang sedang dibuka</span>
              <kbd className="kbd-keycap text-[10px]">Esc untuk tutup</kbd>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
