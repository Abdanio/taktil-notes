import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Keyboard } from '@phosphor-icons/react'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
  category: 'Navigasi' | 'Catatan' | 'Tampilan'
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'N'], description: 'Buat catatan baru secara instan', category: 'Catatan' },
  { keys: ['Ctrl', 'K'], description: 'Buka palet perintah & pencarian cepat', category: 'Navigasi' },
  { keys: ['Ctrl', 'B'], description: 'Sembunyikan / tampilkan sidebar', category: 'Tampilan' },
  { keys: ['Ctrl', 'M'], description: 'Buka panduan sintaksis Markdown', category: 'Navigasi' },
  { keys: ['Ctrl', '/'], description: 'Buka lembar panduan pintasan ini', category: 'Navigasi' },
  { keys: ['Ctrl', 'P'], description: 'Sematkan / lepas sematan catatan aktif', category: 'Catatan' },
  { keys: ['Ctrl', 'Backspace'], description: 'Pindahkan catatan aktif ke sampah', category: 'Catatan' },
  { keys: ['Ctrl', 'Shift', 'T'], description: 'Alihkan tema Warm Paper / Matte Obsidian', category: 'Tampilan' },
  { keys: ['Ctrl', 'Shift', 'F'], description: 'Ganti mode tipografi (Editorial / Sans / Mono)', category: 'Tampilan' }
]

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative w-full max-w-lg bg-paper-card border border-paper-border rounded-2xl p-6 shadow-2xl z-10 select-none overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-paper-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                  <Keyboard size={18} weight="bold" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-bold text-ink-primary">
                    Pintasan Keyboard Taktil
                  </h3>
                  <p className="text-xs text-ink-secondary">
                    Navigasi cepat dan efisien tanpa perlu menyentuh mouse
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Shortcut List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {SHORTCUTS.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-paper-hover/50 transition-colors"
                >
                  <span className="text-xs font-medium text-ink-secondary font-body">
                    {sc.description}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {sc.keys.map((k, kidx) => (
                      <kbd key={kidx} className="kbd-keycap">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Tip */}
            <div className="mt-5 pt-3 border-t border-paper-border/60 flex items-center justify-between text-[11px] text-ink-muted">
              <span>Gunakan tombol untuk navigasi secepat kilat</span>
              <kbd className="kbd-keycap text-[10px]">Esc untuk tutup</kbd>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
