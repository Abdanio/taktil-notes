import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CloudArrowDown,
  ArrowClockwise,
  CheckCircle,
  WarningCircle,
  Sparkle,
  X,
  ArrowRight,
  ShieldCheck
} from '@phosphor-icons/react'
import type { UpdateStatus } from '../../../preload/index.d'
import { soundEffects } from '../lib/sound'

interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
  status: UpdateStatus
  onCheckForUpdates: () => void
  onDownloadUpdate: () => void
  onQuitAndInstall: () => void
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  status,
  onCheckForUpdates,
  onDownloadUpdate,
  onQuitAndInstall
}) => {
  if (!isOpen) return null

  const renderContent = (): React.ReactNode => {
    switch (status.state) {
      case 'checking':
        return (
          <div className="flex flex-col items-center text-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
              className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4 shadow-sm"
            >
              <ArrowClockwise size={28} weight="bold" />
            </motion.div>
            <h3 className="font-editorial text-lg font-semibold text-ink-primary mb-1">
              Memeriksa Pembaruan...
            </h3>
            <p className="text-xs text-ink-secondary max-w-xs leading-relaxed">
              Menghubungi repositori GitHub Taktil Notes untuk mencari rilis dan patch terbaru...
            </p>
          </div>
        )

      case 'available':
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0 shadow-sm">
                <Sparkle size={26} weight="fill" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                    Versi Baru Tersedia
                  </span>
                </div>
                <h3 className="font-editorial text-lg font-semibold text-ink-primary flex items-center gap-2 mt-0.5">
                  <span>v{status.currentVersion || '1.0.0'}</span>
                  <ArrowRight size={14} className="text-ink-muted" />
                  <span className="text-accent font-bold">v{status.version}</span>
                </h3>
              </div>
            </div>

            {/* Release notes preview */}
            <div className="rounded-xl bg-paper-sidebar/90 border border-paper-border/80 p-3.5 max-h-48 overflow-y-auto space-y-2 text-xs">
              <div className="flex items-center justify-between text-ink-muted text-[11px] font-mono border-b border-paper-border/60 pb-1.5">
                <span>Catatan Rilis (Changelog)</span>
                {status.releaseDate && (
                  <span>
                    {new Date(status.releaseDate).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                )}
              </div>
              <div className="text-ink-secondary leading-relaxed whitespace-pre-line font-body text-xs">
                {status.releaseNotes || 'Pembaruan mencakup peningkatan performa, perbaikan bug, dan stabilitas aplikasi.'}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  soundEffects.playChecklistBounce()
                  onDownloadUpdate()
                }}
                className="flex-1 py-2 px-3.5 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <CloudArrowDown size={16} weight="bold" />
                <span>Unduh Pembaruan</span>
              </button>
              <button
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl bg-paper-card border border-paper-border text-ink-secondary hover:text-ink-primary hover:bg-paper-hover text-xs transition-colors cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        )

      case 'downloading': {
        const percent = status.percent ?? 0
        return (
          <div className="space-y-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500 shrink-0">
                <CloudArrowDown size={26} weight="bold" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-semibold text-ink-primary">
                  Mengunduh Versi {status.version || ''}...
                </h3>
                <p className="text-xs text-ink-secondary">
                  Unduhan berjalan aman di latar belakang. Anda tetap dapat mencatat.
                </p>
              </div>
            </div>

            {/* Progress bar container */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-mono text-ink-muted">
                <span>{percent}% selesai</span>
                <span>
                  {formatBytes(status.transferred)} / {formatBytes(status.total)}
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-paper-sidebar border border-paper-border overflow-hidden">
                <motion.div
                  className="h-full bg-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={onClose}
                className="py-1.5 px-3 rounded-lg text-xs text-ink-muted hover:text-ink-primary transition-colors cursor-pointer"
              >
                Sembunyikan Jendela
              </button>
            </div>
          </div>
        )
      }

      case 'downloaded':
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 shrink-0 shadow-sm">
                <CheckCircle size={26} weight="fill" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold uppercase tracking-wider">
                  <ShieldCheck size={14} weight="bold" />
                  <span>Verifikasi Sukses</span>
                </div>
                <h3 className="font-editorial text-lg font-semibold text-ink-primary mt-0.5">
                  Pembaruan Siap Dipasang!
                </h3>
              </div>
            </div>

            <div className="rounded-xl bg-paper-sidebar/90 border border-paper-border/80 p-3.5 text-xs text-ink-secondary leading-relaxed">
              Berkas installer v{status.version} telah selesai diunduh. Aplikasi akan ditutup sebentar dan dimulai ulang secara otomatis ke versi terbaru.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  soundEffects.playChecklistBounce()
                  onQuitAndInstall()
                }}
                className="flex-1 py-2 px-3.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-medium flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <ArrowClockwise size={16} weight="bold" />
                <span>Mulai Ulang & Pasang Sekarang</span>
              </button>
              <button
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl bg-paper-card border border-paper-border text-ink-secondary hover:text-ink-primary hover:bg-paper-hover text-xs transition-colors cursor-pointer"
              >
                Terapkan Nanti
              </button>
            </div>
          </div>
        )

      case 'not-available':
        return (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
              <CheckCircle size={26} weight="fill" />
            </div>
            <h3 className="font-editorial text-lg font-semibold text-ink-primary mb-1">
              Aplikasi Sudah Versi Terbaru
            </h3>
            <p className="text-xs text-ink-secondary max-w-xs leading-relaxed mb-4">
              Anda sedang menggunakan Taktil Notes{' '}
              <span className="font-mono font-medium text-ink-primary">
                v{status.currentVersion || '1.0.0'}
              </span>
              . Tidak ada pembaruan rilis tertunda saat ini.
            </p>
            <button
              onClick={onClose}
              className="py-1.5 px-5 rounded-xl bg-paper-sidebar border border-paper-border text-xs text-ink-primary hover:bg-paper-hover transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )

      case 'error':
        return (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <WarningCircle size={26} weight="fill" />
              </div>
              <div>
                <h3 className="font-editorial text-lg font-semibold text-ink-primary">
                  Pemeriksaan Pembaruan Terkendala
                </h3>
                <p className="text-xs text-ink-secondary">
                  Tidak dapat menghubungi server pembaruan saat ini.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 text-xs text-red-600 font-mono break-all leading-relaxed">
              {status.message || 'Koneksi terputus atau rilis belum dipublikasikan.'}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  soundEffects.playChecklistBounce()
                  onCheckForUpdates()
                }}
                className="flex-1 py-2 px-3.5 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ArrowClockwise size={15} weight="bold" />
                <span>Coba Periksa Lagi</span>
              </button>
              <button
                onClick={onClose}
                className="py-2 px-3.5 rounded-xl bg-paper-card border border-paper-border text-ink-secondary hover:text-ink-primary hover:bg-paper-hover text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )

      default:
        return (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-12 h-12 rounded-2xl bg-paper-sidebar border border-paper-border flex items-center justify-center text-accent mb-3">
              <CloudArrowDown size={26} weight="bold" />
            </div>
            <h3 className="font-editorial text-lg font-semibold text-ink-primary mb-1">
              Pembaruan Taktil Notes
            </h3>
            <p className="text-xs text-ink-secondary max-w-xs leading-relaxed mb-4">
              Periksa apakah ada versi terbaru atau perbaikan fitur untuk aplikasi Anda.
            </p>
            <button
              onClick={() => {
                soundEffects.playChecklistBounce()
                onCheckForUpdates()
              }}
              className="py-2 px-5 rounded-xl bg-accent text-white hover:bg-accent-hover text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowClockwise size={15} weight="bold" />
              <span>Periksa Sekarang</span>
            </button>
          </div>
        )
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={status.state === 'downloading' ? undefined : onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 8 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          className="relative z-10 w-full max-w-md rounded-2xl bg-paper-card border border-paper-border shadow-2xl p-5 overflow-hidden"
        >
          {/* Close button */}
          {status.state !== 'downloading' && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-paper-hover transition-colors cursor-pointer"
              title="Tutup dialog"
            >
              <X size={16} weight="bold" />
            </button>
          )}

          {renderContent()}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
