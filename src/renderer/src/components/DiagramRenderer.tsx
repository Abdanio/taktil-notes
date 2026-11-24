import React, { useMemo } from 'react'
import { GitFork, Copy, Checks } from '@phosphor-icons/react'

interface DiagramRendererProps {
  code: string
}

interface ParsedNode {
  id: string
  label: string
  shape: 'box' | 'round' | 'rhombus'
}

interface ParsedLink {
  source: string
  target: string
  label?: string
  style: 'arrow' | 'line'
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({ code }) => {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = (): void => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Parse basic Mermaid flowchart and sequence definitions
  const parsed = useMemo(() => {
    const lines = code
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('%%'))

    if (lines.length === 0) return null

    const firstLine = lines[0].toLowerCase()
    const isFlowchart = firstLine.startsWith('graph') || firstLine.startsWith('flowchart')
    const isSequence = firstLine.startsWith('sequencediagram')

    if (isSequence) {
      // Sequence diagram
      const actors = new Set<string>()
      const messages: { from: string; to: string; text: string }[] = []

      for (let i = 1; i < lines.length; i++) {
        const m = lines[i].match(/^([A-Za-z0-9_-]+)\s*->>\s*([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
        if (m) {
          actors.add(m[1])
          actors.add(m[2])
          messages.push({ from: m[1], to: m[2], text: m[3] })
        }
      }

      return {
        type: 'sequence' as const,
        actors: Array.from(actors),
        messages
      }
    }

    if (isFlowchart) {
      const nodesMap = new Map<string, ParsedNode>()
      const links: ParsedLink[] = []

      const addNode = (id: string, rawLabel?: string, shape: ParsedNode['shape'] = 'box'): void => {
        if (!nodesMap.has(id)) {
          nodesMap.set(id, {
            id,
            label: rawLabel ? rawLabel.replace(/^["']|["']$/g, '') : id,
            shape
          })
        }
      }

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]

        // Link pattern: A[Label A] -->|text| B(Label B) or A --> B
        const linkMatch = line.match(
          /^([A-Za-z0-9_-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?\s*(-->|---|-.->)\s*(?:\|(.*?)\|)?\s*([A-Za-z0-9_-]+)(?:\[(.*?)\]|\((.*?)\)|\{(.*?)\})?$/
        )

        if (linkMatch) {
          const srcId = linkMatch[1]
          const srcBox = linkMatch[2]
          const srcRound = linkMatch[3]
          const srcRhombus = linkMatch[4]
          const srcLabel = srcBox || srcRound || srcRhombus || srcId
          const srcShape: ParsedNode['shape'] = srcRound
            ? 'round'
            : srcRhombus
              ? 'rhombus'
              : 'box'

          const linkType = linkMatch[5]
          const linkLabel = linkMatch[6]

          const targetId = linkMatch[7]
          const targetBox = linkMatch[8]
          const targetRound = linkMatch[9]
          const targetRhombus = linkMatch[10]
          const targetLabel = targetBox || targetRound || targetRhombus || targetId
          const targetShape: ParsedNode['shape'] = targetRound
            ? 'round'
            : targetRhombus
              ? 'rhombus'
              : 'box'

          addNode(srcId, srcLabel, srcShape)
          addNode(targetId, targetLabel, targetShape)

          links.push({
            source: srcId,
            target: targetId,
            label: linkLabel,
            style: linkType.includes('>') ? 'arrow' : 'line'
          })
        }
      }

      return {
        type: 'flowchart' as const,
        nodes: Array.from(nodesMap.values()),
        links
      }
    }

    return null
  }, [code])

  if (!parsed) {
    return (
      <div className="my-4 rounded-xl border border-paper-border bg-paper-sidebar/50 p-4 font-mono text-xs text-ink-muted">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-paper-border/60">
          <span className="font-semibold text-accent">Mermaid Diagram</span>
          <button onClick={handleCopy} className="hover:text-ink-primary">
            {copied ? 'Tersalin' : 'Salin'}
          </button>
        </div>
        <pre className="overflow-x-auto whitespace-pre-wrap">{code}</pre>
      </div>
    )
  }

  return (
    <div className="my-5 rounded-2xl border border-paper-border/80 bg-paper-card shadow-sm overflow-hidden select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-paper-border/60 bg-paper-sidebar/60 text-xs">
        <div className="flex items-center gap-2">
          <GitFork size={15} weight="duotone" className="text-accent" />
          <span className="font-semibold text-[11px] text-ink-primary">
            {parsed.type === 'sequence' ? 'Diagram Urutan (Sequence)' : 'Diagram Alir (Flowchart)'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-ink-primary transition-colors py-0.5 px-2 rounded-md hover:bg-paper-card cursor-pointer"
        >
          {copied ? (
            <>
              <Checks size={12} weight="bold" className="text-emerald-500" />
              <span className="text-emerald-500">Tersalin</span>
            </>
          ) : (
            <>
              <Copy size={12} weight="bold" />
              <span>Salin Sintaks</span>
            </>
          )}
        </button>
      </div>

      {/* SVG Canvas */}
      <div className="p-6 overflow-x-auto flex justify-center bg-paper-canvas/40">
        {parsed.type === 'flowchart' && (
          <svg
            className="w-full max-w-lg min-h-[160px]"
            viewBox={`0 0 520 ${Math.max(160, parsed.nodes.length * 55 + 40)}`}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#D95D39" />
              </marker>
            </defs>

            {/* Compute node layout: vertical cascade */}
            {(() => {
              const nodePositions = new Map<string, { x: number; y: number; w: number; h: number }>()
              parsed.nodes.forEach((node, idx) => {
                const w = Math.max(120, node.label.length * 9 + 30)
                const h = 36
                const x = 260 - w / 2
                const y = 30 + idx * 60
                nodePositions.set(node.id, { x, y, w, h })
              })

              return (
                <>
                  {/* Links */}
                  {parsed.links.map((link, idx) => {
                    const src = nodePositions.get(link.source)
                    const tgt = nodePositions.get(link.target)
                    if (!src || !tgt) return null

                    const startX = src.x + src.w / 2
                    const startY = src.y + src.h
                    const endX = tgt.x + tgt.w / 2
                    const endY = tgt.y

                    return (
                      <g key={`link-${idx}`}>
                        <path
                          d={`M ${startX} ${startY} C ${startX} ${startY + 15}, ${endX} ${endY - 15}, ${endX} ${endY}`}
                          fill="none"
                          stroke="#D95D39"
                          strokeWidth="2"
                          markerEnd={link.style === 'arrow' ? 'url(#arrowhead)' : undefined}
                        />
                        {link.label && (
                          <text
                            x={(startX + endX) / 2 + 10}
                            y={(startY + endY) / 2}
                            fontSize="10"
                            fill="#8C877D"
                            fontFamily="Plus Jakarta Sans, sans-serif"
                          >
                            {link.label}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* Nodes */}
                  {parsed.nodes.map((node) => {
                    const pos = nodePositions.get(node.id)
                    if (!pos) return null

                    return (
                      <g key={`node-${node.id}`}>
                        <rect
                          x={pos.x}
                          y={pos.y}
                          width={pos.w}
                          height={pos.h}
                          rx={node.shape === 'round' ? 18 : 8}
                          fill="#ffffff"
                          stroke="#E2DED5"
                          strokeWidth="1.5"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))"
                        />
                        <text
                          x={pos.x + pos.w / 2}
                          y={pos.y + pos.h / 2 + 4}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="#171615"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {node.label}
                        </text>
                      </g>
                    )
                  })}
                </>
              )
            })()}
          </svg>
        )}

        {parsed.type === 'sequence' && (
          <svg
            className="w-full max-w-lg min-h-[180px]"
            viewBox={`0 0 500 ${Math.max(180, parsed.messages.length * 45 + 100)}`}
          >
            <defs>
              <marker
                id="seq-arrow"
                markerWidth="8"
                markerHeight="6"
                refX="7"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 8 3, 0 6" fill="#D95D39" />
              </marker>
            </defs>

            {(() => {
              const actorX = new Map<string, number>()
              const totalActors = parsed.actors.length
              parsed.actors.forEach((actor, idx) => {
                const x = 80 + (idx / Math.max(1, totalActors - 1)) * 340
                actorX.set(actor, x)
              })

              const totalHeight = Math.max(180, parsed.messages.length * 45 + 90)

              return (
                <>
                  {/* Lifelines */}
                  {parsed.actors.map((actor) => {
                    const x = actorX.get(actor) || 100
                    return (
                      <g key={`actor-${actor}`}>
                        <line
                          x1={x}
                          y1={45}
                          x2={x}
                          y2={totalHeight - 20}
                          stroke="#E2DED5"
                          strokeDasharray="4 4"
                          strokeWidth="1.5"
                        />
                        <rect
                          x={x - 45}
                          y={15}
                          width="90"
                          height="28"
                          rx="6"
                          fill="#ffffff"
                          stroke="#D95D39"
                          strokeWidth="1.5"
                        />
                        <text
                          x={x}
                          y={33}
                          textAnchor="middle"
                          fontSize="11"
                          fontWeight="600"
                          fill="#171615"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {actor}
                        </text>
                      </g>
                    )
                  })}

                  {/* Messages */}
                  {parsed.messages.map((msg, idx) => {
                    const x1 = actorX.get(msg.from) || 100
                    const x2 = actorX.get(msg.to) || 200
                    const y = 75 + idx * 42

                    return (
                      <g key={`msg-${idx}`}>
                        <line
                          x1={x1}
                          y1={y}
                          x2={x2}
                          y2={y}
                          stroke="#D95D39"
                          strokeWidth="1.8"
                          markerEnd="url(#seq-arrow)"
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={y - 6}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#555047"
                          fontFamily="Plus Jakarta Sans, sans-serif"
                        >
                          {msg.text}
                        </text>
                      </g>
                    )
                  })}
                </>
              )
            })()}
          </svg>
        )}
      </div>
    </div>
  )
}
