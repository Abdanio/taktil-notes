import { Note } from '../types'

export interface SearchResult {
  note: Note
  score: number
  snippet?: string
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u024F]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0)
}

/**
 * Fast in-memory full-text search engine with token scoring and snippet generation
 */
export function searchNotes(
  notes: Note[],
  query: string,
  unlockedContents?: Record<string, string>
): SearchResult[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) {
    return notes.map((note) => ({ note, score: 0 }))
  }

  const queryTokens = tokenize(trimmed)
  if (queryTokens.length === 0) {
    return notes.map((note) => ({ note, score: 0 }))
  }

  const results: SearchResult[] = []

  for (const note of notes) {
    if (note.isTrash) continue

    const titleTokens = tokenize(note.title)
    const content = (note.isEncrypted && unlockedContents?.[note.id])
      ? unlockedContents[note.id]
      : note.isEncrypted
        ? '' // Content locked
        : note.content

    const contentTokens = tokenize(content)
    let score = 0

    // Title exact match or title includes query
    if (note.title.toLowerCase().includes(trimmed)) {
      score += 15
    }

    // Token scoring
    for (const qToken of queryTokens) {
      // Title match
      const titleMatches = titleTokens.filter((t) => t.startsWith(qToken)).length
      score += titleMatches * 6

      // Content match
      const contentMatches = contentTokens.filter((t) => t.startsWith(qToken)).length
      score += Math.min(contentMatches * 2, 10) // Cap to avoid repetitive spam skewing
    }

    // Only include if score > 0
    if (score > 0) {
      // Recency bonus (updated within last 7 days gets up to 2 points)
      const daysOld = (Date.now() - note.updatedAt) / (1000 * 60 * 60 * 24)
      if (daysOld < 7) {
        score += Math.max(0, 2 - Math.floor(daysOld * 0.25))
      }

      // Generate snippet
      let snippet: string | undefined
      if (content) {
        const lowerContent = content.toLowerCase()
        const firstIndex = lowerContent.indexOf(trimmed)
        if (firstIndex !== -1) {
          const start = Math.max(0, firstIndex - 30)
          const end = Math.min(content.length, firstIndex + trimmed.length + 50)
          snippet = (start > 0 ? '...' : '') + content.slice(start, end).replace(/\n/g, ' ') + (end < content.length ? '...' : '')
        }
      }

      results.push({
        note,
        score,
        snippet
      })
    }
  }

  return results.sort((a, b) => b.score - a.score)
}
