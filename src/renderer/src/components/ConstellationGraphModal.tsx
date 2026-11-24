import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Graph,
  X,
  MagnifyingGlass,
  ArrowCounterClockwise,
  Plus,
  Minus,
  LinkSimple,
  Sparkle
} from '@phosphor-icons/react'
import { useNotes } from '../context/NotesContext'
import { NoteIconRenderer } from './NoteIconPicker'
import { soundEffects } from '../lib/sound'

interface ConstellationGraphModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNote: (noteId: string) => void
}

interface GraphNode {
  id: string
  title: string
  icon?: string
  folderId: string | null
  color: string
  degree: number
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface GraphEdge {
  source: string
  target: string
  type: 'wiki' | 'folder'
}

export const ConstellationGraphModal: React.FC<ConstellationGraphModalProps> = ({
  isOpen,
  onClose,
  onSelectNote
}) => {
  const { notes, folders, config } = useNotes()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string>('all')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const activeDraggedNodeRef = useRef<GraphNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const nodesRef = useRef<GraphNode[]>([])

  // Non-trash notes
  const activeNotes = useMemo(() => notes.filter((n) => !n.isTrash), [notes])

  // Extract Nodes and Edges
  const { initialNodes, edges } = useMemo(() => {
    const folderColorMap = new Map<string, string>()
    folders.forEach((f) => folderColorMap.set(f.id, f.color))

    const noteTitleMap = new Map<string, string>()
    activeNotes.forEach((n) => noteTitleMap.set(n.title.toLowerCase().trim(), n.id))

    const rawEdges: GraphEdge[] = []
    const connectionCounts = new Map<string, number>()

    // Find Wiki-links
    activeNotes.forEach((note) => {
      const matches = note.content.matchAll(/\[\[([^\]]+)\]\]/g)
      for (const m of matches) {
        const targetTitle = m[1].toLowerCase().trim()
        const targetId = noteTitleMap.get(targetTitle)
        if (targetId && targetId !== note.id) {
          rawEdges.push({ source: note.id, target: targetId, type: 'wiki' })
          connectionCounts.set(note.id, (connectionCounts.get(note.id) || 0) + 1)
          connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
        }
      }
    })

    // Layout in a circular spiral initially
    const count = activeNotes.length
    const radius = Math.min(280, count * 35 + 80)

    const rawNodes: GraphNode[] = activeNotes.map((note, idx) => {
      const angle = (idx / Math.max(1, count)) * 2 * Math.PI
      const dist = radius * (0.4 + 0.6 * Math.sqrt(idx / Math.max(1, count)))
      const degree = connectionCounts.get(note.id) || 0

      return {
        id: note.id,
        title: note.title || 'Tanpa Judul',
        icon: note.icon,
        folderId: note.folderId,
        color: (note.folderId && folderColorMap.get(note.folderId)) || '#D95D39',
        degree,
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: Math.max(9, Math.min(22, 9 + degree * 2.5))
      }
    })

    return { initialNodes: rawNodes, edges: rawEdges }
  }, [activeNotes, folders])

  // Initialize and run force simulation
  useEffect(() => {
    if (!isOpen) return

    nodesRef.current = initialNodes.map((n) => ({ ...n }))
    const nodes = nodesRef.current

    let isRunning = true

    const stepSimulation = (): void => {
      if (!isRunning) return

      // Physics constants
      const repulsion = 450
      const springLength = 80
      const springK = 0.04
      const centerGravity = 0.015
      const damping = 0.88

      // 1. Center Gravity
      nodes.forEach((node) => {
        node.vx -= node.x * centerGravity
        node.vy -= node.y * centerGravity
      })

      // 2. Node Repulsion
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          if (dist < 400) {
            const force = (repulsion / (dist * dist)) * 20
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            a.vx -= fx
            a.vy -= fy
            b.vx += fx
            b.vy += fy
          }
        }
      }

      // 3. Edge Springs
      edges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source)
        const targetNode = nodes.find((n) => n.id === edge.target)
        if (!sourceNode || !targetNode) return

        const dx = targetNode.x - sourceNode.x
        const dy = targetNode.y - sourceNode.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const displacement = dist - springLength
        const force = displacement * springK
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        sourceNode.vx += fx
        sourceNode.vy += fy
        targetNode.vx -= fx
        targetNode.vy -= fy
      })

      // 4. Update Positions
      nodes.forEach((node) => {
        if (node === activeDraggedNodeRef.current) return
        node.vx *= damping
        node.vy *= damping
        node.x += node.vx
        node.y += node.vy
      })

      // 5. Draw Canvas
      renderCanvas()
      animationFrameRef.current = requestAnimationFrame(stepSimulation)
    }

    animationFrameRef.current = requestAnimationFrame(stepSimulation)

    return () => {
      isRunning = false
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isOpen, initialNodes, edges, scale, pan, hoveredNodeId, searchQuery, selectedFolder])

  // Canvas drawing routine
  const renderCanvas = (): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const isDark = config.theme === 'matte-obsidian'
    const centerX = width / 2 + pan.x
    const centerY = height / 2 + pan.y

    ctx.clearRect(0, 0, width, height)

    // Save transform
    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)

    // Highlighted nodes set
    const connectedToHovered = new Set<string>()
    if (hoveredNodeId) {
      connectedToHovered.add(hoveredNodeId)
      edges.forEach((e) => {
        if (e.source === hoveredNodeId) connectedToHovered.add(e.target)
        if (e.target === hoveredNodeId) connectedToHovered.add(e.source)
      })
    }

    // 1. Draw Constellation Edges
    edges.forEach((edge) => {
      const source = nodesRef.current.find((n) => n.id === edge.source)
      const target = nodesRef.current.find((n) => n.id === edge.target)
      if (!source || !target) return

      const isConnected =
        hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId)

      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)

      if (isConnected) {
        ctx.strokeStyle = '#D95D39'
        ctx.lineWidth = 2.2
        ctx.shadowColor = '#D95D39'
        ctx.shadowBlur = 8
      } else {
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(50, 40, 30, 0.12)'
        ctx.lineWidth = 1
        ctx.shadowBlur = 0
      }
      ctx.stroke()
      ctx.shadowBlur = 0
    })

    // 2. Draw Nodes
    nodesRef.current.forEach((node) => {
      const isHovered = node.id === hoveredNodeId
      const isConnected = connectedToHovered.has(node.id)
      const isFiltered =
        (selectedFolder !== 'all' && node.folderId !== selectedFolder) ||
        (searchQuery && !node.title.toLowerCase().includes(searchQuery.toLowerCase()))

      const alpha = hoveredNodeId ? (isConnected ? 1 : 0.25) : isFiltered ? 0.25 : 1

      ctx.save()
      ctx.globalAlpha = alpha

      // Glow halo for connected / hovered
      if (isHovered) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius + 6, 0, 2 * Math.PI)
        ctx.fillStyle = node.color
        ctx.globalAlpha = 0.25
        ctx.fill()
        ctx.globalAlpha = alpha
      }

      // Outer circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI)
      ctx.fillStyle = node.color
      ctx.fill()

      // Inner tactile core
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius * 0.45, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff'
      ctx.fill()

      // Label
      ctx.font = `${isHovered ? 'bold 12px' : '11px'} "Plus Jakarta Sans", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.85)' : 'rgba(20, 20, 20, 0.85)'
      ctx.fillText(node.title, node.x, node.y + node.radius + 4)

      ctx.restore()
    })

    ctx.restore()
  }

  // Handle Canvas Mouse Events (Drag node, Pan, Hover, Click)
  const getNodeAtCoords = (clientX: number, clientY: number): GraphNode | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const mouseX = clientX - rect.left
    const mouseY = clientY - rect.top

    const centerX = canvas.width / 2 + pan.x
    const centerY = canvas.height / 2 + pan.y

    const graphX = (mouseX - centerX) / scale
    const graphY = (mouseY - centerY) / scale

    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const node = nodesRef.current[i]
      const dx = graphX - node.x
      const dy = graphY - node.y
      if (Math.sqrt(dx * dx + dy * dy) <= node.radius + 6) {
        return node
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const node = getNodeAtCoords(e.clientX, e.clientY)
    if (node) {
      activeDraggedNodeRef.current = node
      soundEffects.playChecklistBounce()
    } else {
      isDraggingRef.current = true
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (activeDraggedNodeRef.current) {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const centerX = canvas.width / 2 + pan.x
      const centerY = canvas.height / 2 + pan.y

      activeDraggedNodeRef.current.x = (mouseX - centerX) / scale
      activeDraggedNodeRef.current.y = (mouseY - centerY) / scale
      activeDraggedNodeRef.current.vx = 0
      activeDraggedNodeRef.current.vy = 0
      return
    }

    if (isDraggingRef.current) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y
      })
      return
    }

    // Hover check
    const node = getNodeAtCoords(e.clientX, e.clientY)
    if (node) {
      setHoveredNodeId(node.id)
      if (canvasRef.current) canvasRef.current.style.cursor = 'pointer'
    } else {
      setHoveredNodeId(null)
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (activeDraggedNodeRef.current) {
      // If minimal drag, treat as click to navigate!
      const node = activeDraggedNodeRef.current
      activeDraggedNodeRef.current = null
      onSelectNote(node.id)
      onClose()
      return
    }

    isDraggingRef.current = false
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>): void => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    setScale((prev) => Math.max(0.4, Math.min(2.5, prev * zoomFactor)))
  }

  if (!isOpen) return null

  const hoveredNode = nodesRef.current.find((n) => n.id === hoveredNodeId)

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="relative w-full max-w-5xl h-[85vh] rounded-2xl bg-paper-card border border-paper-border shadow-2xl flex flex-col overflow-hidden select-none"
        >
          {/* Header Bar */}
          <div className="h-14 px-5 border-b border-paper-border/70 bg-paper-sidebar/80 backdrop-blur-sm flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center shadow-xs">
                <Graph size={20} weight="duotone" />
              </div>
              <div>
                <h2 className="font-editorial text-base font-semibold text-ink-primary flex items-center gap-2">
                  <span>Peta Pengetahuan Konstelasi</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-accent/10 text-accent font-normal">
                    {activeNotes.length} Catatan • {edges.length} Tautan
                  </span>
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Visualisasi relasi tautan Wiki ganda dan kedekatan antar-catatan
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <MagnifyingGlass
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted"
                />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari catatan dalam graf..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-paper-card border border-paper-border text-xs text-ink-primary placeholder:text-ink-muted outline-none focus:border-accent w-48 transition-colors"
                />
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-ink-muted hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
          </div>

          {/* Main Interactive Canvas Area */}
          <div className="relative flex-1 bg-paper-canvas overflow-hidden">
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className="w-full h-full block cursor-grab active:cursor-grabbing"
            />

            {/* Hovered Node Preview Card */}
            {hoveredNode && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-4 bottom-4 p-3.5 rounded-xl bg-paper-card/95 border border-paper-border shadow-xl backdrop-blur-sm max-w-xs pointer-events-none"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: hoveredNode.color }}
                  />
                  <h4 className="font-editorial text-sm font-semibold text-ink-primary truncate">
                    {hoveredNode.title}
                  </h4>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-ink-muted font-mono">
                  <LinkSimple size={12} weight="bold" />
                  <span>{hoveredNode.degree} Tautan terhubung</span>
                </div>
                <div className="mt-1 text-[11px] text-accent font-medium">
                  Klik simpul untuk membuka catatan ini
                </div>
              </motion.div>
            )}

            {/* Canvas Zoom Controls (Bottom Right) */}
            <div className="absolute right-4 bottom-4 flex items-center gap-1 bg-paper-card/90 border border-paper-border rounded-xl p-1 shadow-lg backdrop-blur-sm">
              <button
                onClick={() => setScale((s) => Math.min(2.5, s * 1.15))}
                title="Perbesar Graf"
                className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
              >
                <Plus size={14} weight="bold" />
              </button>
              <button
                onClick={() => setScale((s) => Math.max(0.4, s * 0.85))}
                title="Perkecil Graf"
                className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
              >
                <Minus size={14} weight="bold" />
              </button>
              <button
                onClick={() => {
                  setScale(1)
                  setPan({ x: 0, y: 0 })
                }}
                title="Atur Ulang Tampilan Graf"
                className="w-7 h-7 rounded-lg text-ink-secondary hover:text-ink-primary hover:bg-paper-hover flex items-center justify-center transition-colors cursor-pointer"
              >
                <ArrowCounterClockwise size={14} weight="bold" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
