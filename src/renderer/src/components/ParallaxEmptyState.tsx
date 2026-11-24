import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import { useNotes } from '../context/NotesContext'

interface ParallaxEmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  showAction?: boolean
}

export const ParallaxEmptyState: React.FC<ParallaxEmptyStateProps> = ({
  title = 'Belum Ada Catatan',
  description = 'Ruang tenang untuk menuangkan pemikiran Anda.',
  actionLabel = 'Buat Catatan Baru',
  showAction = true
}) => {
  const { createNote } = useNotes()
  const [isHovered, setIsHovered] = useState(false)

  // Mouse tilt tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring physics for buttery soft tilt
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  // Layer transforms
  const rotateX = useTransform(springY, [-100, 100], [8, -8])
  const rotateY = useTransform(springX, [-100, 100], [-8, 8])

  // Parallax shifts for layers
  const sheet1X = useTransform(springX, [-100, 100], [-6, 6])
  const sheet1Y = useTransform(springY, [-100, 100], [-6, 6])
  const sheet2X = useTransform(springX, [-100, 100], [-12, 12])
  const sheet2Y = useTransform(springY, [-100, 100], [-12, 12])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  const handleMouseLeave = (): void => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full p-8 text-center select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 800
        }}
        className="relative w-36 h-44 mb-6 cursor-pointer flex items-center justify-center"
      >
        {/* Layer 3 - Bottom Paper Sheet */}
        <motion.div
          style={{ x: sheet2X, y: sheet2Y }}
          animate={{ rotate: isHovered ? -10 : -6 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="absolute inset-0 rounded-xl bg-paper-border/60 border border-paper-border/80 shadow-sm"
        />

        {/* Layer 2 - Middle Paper Sheet */}
        <motion.div
          style={{ x: sheet1X, y: sheet1Y }}
          animate={{ rotate: isHovered ? 8 : 4 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="absolute inset-0 rounded-xl bg-paper-sidebar border border-paper-border shadow-sm"
        />

        {/* Layer 1 - Top Paper Sheet with subtle embossed lines */}
        <motion.div
          animate={{ scale: isHovered ? 1.02 : 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="absolute inset-0 rounded-xl bg-paper-card border border-paper-border shadow-md p-4 flex flex-col justify-between"
        >
          {/* Paper lines simulation */}
          <div className="space-y-2.5 pt-2">
            <div className="h-1.5 w-16 bg-accent/40 rounded-full" />
            <div className="h-1 w-full bg-paper-border/80 rounded-full" />
            <div className="h-1 w-4/5 bg-paper-border/70 rounded-full" />
            <div className="h-1 w-2/3 bg-paper-border/60 rounded-full" />
            <div className="h-1 w-3/4 bg-paper-border/50 rounded-full" />
          </div>

          {/* Bottom subtle watermark icon */}
          <div className="flex justify-end pr-1 pb-1 opacity-25">
            <div className="w-5 h-5 rounded-full border border-ink-secondary" />
          </div>
        </motion.div>
      </motion.div>

      <h3 className="font-heading text-lg font-semibold text-ink-primary mb-1.5">{title}</h3>
      <p className="text-sm text-ink-secondary max-w-xs mb-5 font-body leading-relaxed">
        {description}
      </p>

      {showAction && (
        <button
          onClick={() => createNote()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white font-medium text-sm shadow-sm hover:bg-accent-hover transition-colors duration-150 active:scale-[0.98]"
        >
          <Plus size={16} weight="bold" />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
