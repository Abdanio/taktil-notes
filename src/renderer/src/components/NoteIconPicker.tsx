import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Note,
  Sparkle,
  Lightbulb,
  Coffee,
  BookBookmark,
  Code,
  Rocket,
  Heart,
  Fire,
  Brain,
  PenNib,
  Compass,
  Target,
  CheckSquare,
  Planet,
  Star,
  FolderSimple,
  Quotes,
  Lightning,
  X
} from '@phosphor-icons/react'
import { soundEffects } from '../lib/sound'

export const AVAILABLE_NOTE_ICONS = [
  { id: 'Note', label: 'Catatan', icon: Note },
  { id: 'Sparkle', label: 'Ide Baru', icon: Sparkle },
  { id: 'Lightbulb', label: 'Inspirasi', icon: Lightbulb },
  { id: 'Coffee', label: 'Santai', icon: Coffee },
  { id: 'BookBookmark', label: 'Bacaan', icon: BookBookmark },
  { id: 'Code', label: 'Koding', icon: Code },
  { id: 'Rocket', label: 'Proyek', icon: Rocket },
  { id: 'Heart', label: 'Pribadi', icon: Heart },
  { id: 'Fire', label: 'Penting', icon: Fire },
  { id: 'Brain', label: 'Riset', icon: Brain },
  { id: 'PenNib', label: 'Menulis', icon: PenNib },
  { id: 'Compass', label: 'Eksplorasi', icon: Compass },
  { id: 'Target', label: 'Tujuan', icon: Target },
  { id: 'CheckSquare', label: 'Daftar Tugas', icon: CheckSquare },
  { id: 'Planet', label: 'Dunia', icon: Planet },
  { id: 'Star', label: 'Favorit', icon: Star },
  { id: 'FolderSimple', label: 'Arsip', icon: FolderSimple },
  { id: 'Quotes', label: 'Kutipan', icon: Quotes },
  { id: 'Lightning', label: 'Cepat', icon: Lightning }
]

export const NoteIconRenderer: React.FC<{
  iconName?: string
  size?: number
  weight?: 'regular' | 'bold' | 'fill' | 'duotone'
  className?: string
}> = ({ iconName = 'Note', size = 16, weight = 'duotone', className }) => {
  const item = AVAILABLE_NOTE_ICONS.find((i) => i.id === iconName) || AVAILABLE_NOTE_ICONS[0]
  const IconComponent = item.icon
  return <IconComponent size={size} weight={weight} className={className} />
}

interface NoteIconPickerModalProps {
  isOpen: boolean
  onClose: () => void
  currentIcon?: string
  onSelectIcon: (iconName: string) => void
}

export const NoteIconPickerModal: React.FC<NoteIconPickerModalProps> = ({
  isOpen,
  onClose,
  currentIcon = 'Note',
  onSelectIcon
}) => {
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="relative w-full max-w-sm bg-paper-card border border-paper-border rounded-2xl shadow-2xl z-10 p-5 select-none overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-paper-border">
              <div>
                <h3 className="font-heading text-base font-bold text-ink-primary">
                  Pilih Ikon Catatan
                </h3>
                <p className="text-xs text-ink-secondary">
                  Beri identitas visual unik untuk catatan ini
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            {/* Icon Grid */}
            <div className="grid grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto p-1">
              {AVAILABLE_NOTE_ICONS.map((item) => {
                const isSelected = currentIcon === item.id
                const IconComp = item.icon

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playChecklistBounce()
                      onSelectIcon(item.id)
                      onClose()
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent bg-accent/15 text-accent shadow-xs scale-105'
                        : 'border-paper-border bg-paper-sidebar/50 text-ink-secondary hover:text-ink-primary hover:border-accent/40 hover:bg-paper-hover'
                    }`}
                  >
                    <IconComp size={22} weight={isSelected ? 'duotone' : 'regular'} />
                    <span className="text-[10px] font-medium truncate max-w-full">
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-paper-border/60 text-center text-[11px] text-ink-muted">
              Pilih salah satu ikon untuk langsung menerapkannya
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
