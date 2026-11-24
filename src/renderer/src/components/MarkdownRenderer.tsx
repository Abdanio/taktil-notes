import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Copy, Checks } from '@phosphor-icons/react'
import { cn } from '../lib/utils'

interface MarkdownRendererProps {
  content: string
  onToggleCheckbox: (lineIndex: number, newChecked: boolean) => void
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  onToggleCheckbox
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyCode = (code: string, idx: number): void => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []
  let codeLanguage = ''
  let codeBlockStartIdx = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Fenced Code Block Detection
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const fullCode = codeBuffer.join('\n')
        const blockIdx = codeBlockStartIdx
        elements.push(
          <div
            key={`code-${blockIdx}`}
            className="my-4 rounded-xl border border-paper-border bg-paper-sidebar overflow-hidden text-xs shadow-sm"
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-paper-border/60 bg-paper-hover/30 text-[11px] text-ink-muted font-mono">
              <span>{codeLanguage || 'code'}</span>
              <button
                onClick={() => handleCopyCode(fullCode, blockIdx)}
                className="inline-flex items-center gap-1 hover:text-ink-primary transition-colors py-0.5 px-1.5 rounded hover:bg-paper-card"
              >
                {copiedIndex === blockIdx ? (
                  <>
                    <Checks size={13} weight="bold" className="text-emerald-500" />
                    <span className="text-emerald-500 font-medium">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} weight="bold" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 overflow-x-auto font-code text-ink-primary leading-relaxed">
              <code>{fullCode}</code>
            </pre>
          </div>
        )
        inCodeBlock = false
        codeBuffer = []
        codeLanguage = ''
      } else {
        // Open code block
        inCodeBlock = true
        codeLanguage = line.slice(3).trim()
        codeBuffer = []
        codeBlockStartIdx = i
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // Checkbox Checklist: - [ ] or - [x]
    const checkboxMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.*)$/)
    if (checkboxMatch) {
      const isChecked = checkboxMatch[2].toLowerCase() === 'x'
      const taskText = checkboxMatch[3]
      const lineIdx = i

      elements.push(
        <div
          key={`check-${lineIdx}`}
          className="group flex items-start gap-2.5 my-1.5 py-0.5 select-none"
        >
          {/* Tactile Micro-Bounce Checkbox */}
          <motion.button
            type="button"
            onClick={() => onToggleCheckbox(lineIdx, !isChecked)}
            whileTap={{ scale: 0.85 }}
            animate={{
              scale: isChecked ? [0.85, 1.2, 1] : 1
            }}
            transition={{ duration: 0.2 }}
            className={cn(
              'w-4 h-4 mt-1 rounded-md border flex items-center justify-center transition-colors shrink-0',
              isChecked
                ? 'bg-accent border-accent text-white shadow-sm'
                : 'border-paper-border bg-paper-card hover:border-accent/60'
            )}
          >
            {isChecked && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                <Check size={11} weight="bold" />
              </motion.span>
            )}
          </motion.button>

          {/* Living Task Text with Left-to-Right Animated Strikethrough */}
          <div className="relative text-sm text-ink-primary font-body leading-relaxed">
            <span
              className={cn(
                'transition-opacity duration-200',
                isChecked && 'text-ink-muted opacity-60'
              )}
            >
              {renderFormattedInline(taskText)}
            </span>
            {/* Animated Strikethrough Line */}
            <motion.div
              initial={false}
              animate={{ width: isChecked ? '100%' : '0%' }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute left-0 top-1/2 h-[1.5px] bg-ink-muted -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>
      )
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${i}`} className="font-heading text-2xl font-bold mt-6 mb-3 text-ink-primary">
          {renderFormattedInline(line.slice(2))}
        </h1>
      )
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="font-heading text-xl font-bold mt-5 mb-2.5 text-ink-primary"
        >
          {renderFormattedInline(line.slice(3))}
        </h2>
      )
      continue
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="font-heading text-base font-semibold mt-4 mb-2 text-ink-primary"
        >
          {renderFormattedInline(line.slice(4))}
        </h3>
      )
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="my-3 pl-3.5 py-1 border-l-2 border-accent text-sm text-ink-secondary bg-accent/5 rounded-r-lg font-body italic"
        >
          {renderFormattedInline(line.slice(2))}
        </blockquote>
      )
      continue
    }

    // Unordered List
    if (line.match(/^(\s*)[-*]\s+(.*)$/)) {
      const listMatch = line.match(/^(\s*)[-*]\s+(.*)$/)
      if (listMatch) {
        elements.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-sm text-ink-primary my-1 font-body">
            {renderFormattedInline(listMatch[2])}
          </li>
        )
        continue
      }
    }

    // Images: ![alt](url)
    const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imageMatch) {
      elements.push(
        <div key={`img-${i}`} className="my-4 rounded-xl overflow-hidden border border-paper-border shadow-sm">
          <img
            src={imageMatch[2]}
            alt={imageMatch[1] || 'Gambar Catatan'}
            className="w-full max-h-[420px] object-cover bg-paper-sidebar"
            loading="lazy"
          />
          {imageMatch[1] && (
            <div className="px-3 py-1.5 text-center text-[11px] text-ink-muted bg-paper-card border-t border-paper-border">
              {imageMatch[1]}
            </div>
          )}
        </div>
      )
      continue
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-3" />)
      continue
    }

    // Standard Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-ink-primary leading-relaxed font-body my-1.5">
        {renderFormattedInline(line)}
      </p>
    )
  }

  return <div className="space-y-0.5">{elements}</div>
}

// Helper to format inline bold, italic, code, and links
function renderFormattedInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  while (remaining.length > 0) {
    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded bg-paper-sidebar border border-paper-border text-xs font-code text-accent"
        >
          {codeMatch[1]}
        </code>
      )
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // Bold: **text**
    const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/)
    if (boldMatch) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold text-ink-primary">
          {boldMatch[1]}
        </strong>
      )
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)([^*_]+)\1/)
    if (italicMatch) {
      parts.push(
        <em key={`italic-${keyIdx++}`} className="italic text-ink-primary">
          {italicMatch[2]}
        </em>
      )
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // Links: [title](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) {
      parts.push(
        <a
          key={`link-${keyIdx++}`}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-accent underline underline-offset-2 hover:text-accent-hover"
        >
          {linkMatch[1]}
        </a>
      )
      remaining = remaining.slice(linkMatch[0].length)
      continue
    }

    // Regular character
    const nextSpecial = remaining.search(/[`*_\[]/)
    if (nextSpecial === -1) {
      parts.push(remaining)
      break
    } else if (nextSpecial === 0) {
      parts.push(remaining[0])
      remaining = remaining.slice(1)
    } else {
      parts.push(remaining.slice(0, nextSpecial))
      remaining = remaining.slice(nextSpecial)
    }
  }

  return parts
}
