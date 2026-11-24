import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  X,
  PencilSimple,
  Pen,
  Highlighter,
  Eraser,
  ArrowUUpLeft,
  ArrowUUpRight,
  Trash,
  Check,
  Palette
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

interface SketchCanvasModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertSketch: (markdownSnippet: string) => void
}

type ToolType = 'pencil' | 'pen' | 'highlighter' | 'eraser'

interface PaletteColor {
  name: string
  value: string
}

const PALETTE: PaletteColor[] = [
  { name: 'Obsidian', value: '#1C1B18' },
  { name: 'Terracotta', value: '#D95D39' },
  { name: 'Sage', value: '#4A7C59' },
  { name: 'Ochre', value: '#D4A373' },
  { name: 'Denim', value: '#3E6B89' }
]

export const SketchCanvasModal: React.FC<SketchCanvasModalProps> = ({
  isOpen,
  onClose,
  onInsertSketch
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [activeTool, setActiveTool] = useState<ToolType>('pen')
  const [activeColor, setActiveColor] = useState<string>('#1C1B18')
  const [isDrawing, setIsDrawing] = useState(false)
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  const [redoStack, setRedoStack] = useState<ImageData[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Initialize canvas
  useEffect(() => {
    if (!isOpen) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    // Set high-DPI scaling
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear background to Warm Paper white
    ctx.fillStyle = '#FCFBF9'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Save initial state to undo stack
    const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack([initialData])
    setRedoStack([])
  }, [isOpen])

  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setUndoStack((prev) => [...prev.slice(-25), snap])
    setRedoStack([])
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (activeTool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 1.8
      ctx.globalAlpha = 0.85
    } else if (activeTool === 'pen') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 3.5
      ctx.globalAlpha = 1.0
    } else if (activeTool === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply'
      ctx.strokeStyle = activeColor
      ctx.lineWidth = 20
      ctx.globalAlpha = 0.35
    } else if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over'
      ctx.strokeStyle = '#FCFBF9'
      ctx.lineWidth = 22
      ctx.globalAlpha = 1.0
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (): void => {
    if (!isDrawing) return
    setIsDrawing(false)
    saveSnapshot()
  }

  const handleUndo = (): void => {
    if (undoStack.length <= 1) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const current = undoStack[undoStack.length - 1]
    const previous = undoStack[undoStack.length - 2]

    ctx.putImageData(previous, 0, 0)
    setRedoStack((prev) => [...prev, current])
    setUndoStack((prev) => prev.slice(0, -1))
  }

  const handleRedo = (): void => {
    if (redoStack.length === 0) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const next = redoStack[redoStack.length - 1]
    ctx.putImageData(next, 0, 0)
    setUndoStack((prev) => [...prev, next])
    setRedoStack((prev) => prev.slice(0, -1))
  }

  const handleClear = (): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#FCFBF9'
    ctx.fillRect(0, 0, rect.width, rect.height)
    saveSnapshot()
  }

  const handleSaveAndInsert = async (): Promise<void> => {
    const canvas = canvasRef.current
    if (!canvas) return
    setIsSaving(true)

    try {
      const dataUrl = canvas.toDataURL('image/png')
      const fileName = `sketsa-${Date.now()}.png`

      if (window.electronAPI) {
        const result = await window.electronAPI.saveAsset(fileName, dataUrl)
        if (result.success) {
          const markdown = `\n\n![Sketsa Coretan](${result.assetUrl})\n`
          onInsertSketch(markdown)
          toast.success('Sketsa coretan tangan berhasil disisipkan!')
          onClose()
        } else {
          toast.error('Gagal menyimpan gambar sketsa.')
        }
      } else {
        // Fallback in browser
        const markdown = `\n\n![Sketsa Coretan](${dataUrl})\n`
        onInsertSketch(markdown)
        toast.success('Sketsa berhasil disisipkan!')
        onClose()
      }
    } catch (err) {
      console.error(err)
      toast.error('Terjadi kesalahan saat memproses sketsa.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/50 backdrop-blur-xs">
      <div className="flex flex-col w-full max-w-3xl rounded-2xl border border-paper-border bg-paper-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-paper-border bg-paper-sidebar/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
              <Pen size={18} weight="duotone" />
            </div>
            <div>
              <h2 className="font-heading text-base font-semibold text-ink-primary">
                Kanvas Coretan Tangan
              </h2>
              <p className="text-[11px] text-ink-muted">
                Gambar diagram, sketsa, rumus, atau ide spontan Anda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink-muted hover:text-ink-primary rounded-lg hover:bg-paper-hover transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 border-b border-paper-border/80 bg-paper-card text-xs">
          {/* Tool Selectors */}
          <div className="flex items-center gap-1 bg-paper-sidebar p-1 rounded-xl border border-paper-border">
            <button
              onClick={() => setActiveTool('pencil')}
              title="Pensil Taktil (1.8px)"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px]',
                activeTool === 'pencil'
                  ? 'bg-paper-card text-accent shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              <PencilSimple size={14} weight="duotone" />
              <span>Pensil</span>
            </button>
            <button
              onClick={() => setActiveTool('pen')}
              title="Pulpen Tinta (3.5px)"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px]',
                activeTool === 'pen'
                  ? 'bg-paper-card text-accent shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              <Pen size={14} weight="duotone" />
              <span>Pulpen</span>
            </button>
            <button
              onClick={() => setActiveTool('highlighter')}
              title="Stabilo Highlighter (20px)"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px]',
                activeTool === 'highlighter'
                  ? 'bg-paper-card text-accent shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              <Highlighter size={14} weight="duotone" />
              <span>Stabilo</span>
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              title="Penghapus"
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium text-[11px]',
                activeTool === 'eraser'
                  ? 'bg-paper-card text-accent shadow-xs'
                  : 'text-ink-secondary hover:text-ink-primary'
              )}
            >
              <Eraser size={14} weight="duotone" />
              <span>Penghapus</span>
            </button>
          </div>

          {/* Palette Colors */}
          <div className="flex items-center gap-1.5">
            <Palette size={14} className="text-ink-muted mr-1" />
            {PALETTE.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  setActiveColor(c.value)
                  if (activeTool === 'eraser') setActiveTool('pen')
                }}
                title={c.name}
                style={{ backgroundColor: c.value }}
                className={cn(
                  'w-5 h-5 rounded-full border transition-all cursor-pointer',
                  activeColor === c.value && activeTool !== 'eraser'
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-paper-card scale-110 border-white'
                    : 'border-transparent opacity-80 hover:opacity-100 hover:scale-105'
                )}
              />
            ))}
          </div>

          {/* History Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={undoStack.length <= 1}
              title="Urungkan (Undo)"
              className="p-1.5 rounded-lg border border-paper-border text-ink-secondary hover:text-ink-primary hover:bg-paper-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ArrowUUpLeft size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Ulangi (Redo)"
              className="p-1.5 rounded-lg border border-paper-border text-ink-secondary hover:text-ink-primary hover:bg-paper-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ArrowUUpRight size={14} />
            </button>
            <button
              onClick={handleClear}
              title="Bersihkan Kanvas"
              className="p-1.5 rounded-lg border border-paper-border text-ink-muted hover:text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-4 bg-paper-sidebar/30 flex justify-center items-center">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            className="w-full h-[400px] rounded-xl border border-paper-border bg-[#FCFBF9] shadow-inner cursor-crosshair touch-none"
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-paper-border bg-paper-sidebar/50">
          <span className="text-xs text-ink-muted">
            Gunakan mouse atau stylus untuk mulai menggambar
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-ink-secondary hover:text-ink-primary rounded-xl border border-paper-border hover:bg-paper-hover transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAndInsert}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <Check size={14} weight="bold" />
              <span>{isSaving ? 'Menyimpan...' : 'Sisipkan ke Catatan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
