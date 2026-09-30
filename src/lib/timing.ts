// Shared by the browser and the audio generator script.

export interface Alignment {
  characters: string[]
  character_start_times_seconds: number[]
  character_end_times_seconds: number[]
}

/** [start, end] in seconds for each whitespace-separated word of `text`. */
export type WordTimings = [number, number][]

export const splitWords = (text: string) => text.trim().split(/\s+/)

/** Turn ElevenLabs character alignment into per-word timings. */
export function wordTimings(text: string, al: Alignment, duration?: number): WordTimings {
  const words = splitWords(text)
  const spans: WordTimings = []
  let current: [number, number] | null = null
  al.characters.forEach((ch, i) => {
    if (/\s/.test(ch)) {
      if (current) spans.push(current)
      current = null
      return
    }
    const start = al.character_start_times_seconds[i]
    const end = al.character_end_times_seconds[i]
    if (current) current[1] = end
    else current = [start, end]
  })
  if (current) spans.push(current)
  if (spans.length === words.length) return spans.map(([a, b]) => [round(a), round(b)])
  return evenTimings(text, duration ?? al.character_end_times_seconds.at(-1) ?? words.length * 0.5)
}

/** Fallback: spread words across the clip, weighted by length. */
export function evenTimings(text: string, duration: number): WordTimings {
  const words = splitWords(text)
  const total = words.reduce((n, w) => n + w.length + 1, 0)
  let t = 0
  return words.map((w) => {
    const len = ((w.length + 1) / total) * duration
    const span: [number, number] = [round(t), round(t + len)]
    t += len
    return span
  })
}

const round = (n: number) => Math.round(n * 1000) / 1000

/** Stable, short file name for a line of speech (FNV-1a). */
export function clipId(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
