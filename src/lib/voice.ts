import { create } from 'zustand'
import { audioContext } from './audio'
import { synthesise } from './elevenlabs'
import { clipId, evenTimings, splitWords, wordTimings, type WordTimings } from './timing'

// Floppy's voice. Each line is resolved in this order:
//   1. A clip pre-recorded with ElevenLabs at build time (public/audio)
//   2. Live ElevenLabs, if a parent has added an API key (cached on-device)
//   3. The browser's built-in speech synthesis
// Word timings come along with 1 and 2, so stories can highlight each word as
// it's spoken.

export type VoiceMode = 'auto' | 'browser'

export interface VoiceConfig {
  mode: VoiceMode
  apiKey: string
  voiceId: string
  modelId: string
}

interface ManifestClip {
  file: string
  words?: WordTimings
}
interface Manifest {
  voiceId?: string
  modelId?: string
  clips?: Record<string, ManifestClip>
}

export type VoiceSource = 'recorded' | 'elevenlabs' | 'browser'

export const useVoiceState = create<{ speaking: boolean; lastSource: VoiceSource | null; error: string | null }>(
  () => ({ speaking: false, lastSource: null, error: null }),
)

let config: VoiceConfig = { mode: 'auto', apiKey: '', voiceId: '', modelId: '' }
export const configureVoice = (c: VoiceConfig) => {
  config = c
}

const base = import.meta.env.BASE_URL
let manifest: Promise<Manifest> | null = null
function loadManifest(): Promise<Manifest> {
  manifest ??= fetch(`${base}audio/manifest.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  return manifest
}

interface Clip {
  buffer: AudioBuffer
  words?: WordTimings
  source: VoiceSource
}

const memory = new Map<string, Promise<Clip | null>>()

async function decode(bytes: ArrayBuffer): Promise<AudioBuffer> {
  return audioContext().decodeAudioData(bytes)
}

async function recordedClip(text: string): Promise<Clip | null> {
  const m = await loadManifest()
  const entry = m.clips?.[text]
  if (!entry) return null
  const res = await fetch(`${base}audio/${entry.file}`)
  if (!res.ok) return null
  return { buffer: await decode(await res.arrayBuffer()), words: entry.words, source: 'recorded' }
}

const CACHE = 'floppy-voice-v1'
async function liveClip(text: string): Promise<Clip | null> {
  if (!config.apiKey) return null
  const key = `https://floppy.local/voice/${config.voiceId}/${config.modelId}/${clipId(text)}`
  const cache = 'caches' in window ? await caches.open(CACHE).catch(() => null) : null
  let payload: { audioBase64: string; words: WordTimings } | null = null
  const hit = await cache?.match(key)
  if (hit) payload = await hit.json()
  if (!payload) {
    const result = await synthesise({ text, apiKey: config.apiKey, voiceId: config.voiceId, modelId: config.modelId })
    payload = {
      audioBase64: result.audioBase64,
      words: result.alignment ? wordTimings(text, result.alignment) : [],
    }
    await cache?.put(key, new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } }))
  }
  const bytes = Uint8Array.from(atob(payload.audioBase64), (c) => c.charCodeAt(0))
  return { buffer: await decode(bytes.buffer), words: payload.words, source: 'elevenlabs' }
}

function getClip(text: string): Promise<Clip | null> {
  if (config.mode === 'browser') return Promise.resolve(null)
  const cacheKey = `${config.apiKey ? config.voiceId : ''}|${text}`
  let p = memory.get(cacheKey)
  if (!p) {
    p = (async () => {
      try {
        return (await recordedClip(text)) ?? (await liveClip(text))
      } catch (err) {
        console.warn('[voice] falling back to browser speech:', err)
        useVoiceState.setState({ error: String(err instanceof Error ? err.message : err) })
        return null
      }
    })()
    memory.set(cacheKey, p)
    // Don't keep failures around; a key might be added later.
    void p.then((c) => c || memory.delete(cacheKey))
  }
  return p
}

/** Warm the cache so the next line plays instantly. */
export function preload(lines: string[]) {
  for (const l of lines) void getClip(l)
}

// --- playback --------------------------------------------------------------

let generation = 0
let stopCurrent: (() => void) | null = null

export interface SayOptions {
  /** Called with the index of the word being spoken (-1 when finished). */
  onWord?: (index: number) => void
  /** Gap between chained lines, in seconds. */
  gap?: number
}

/**
 * Speak one or more lines in order. Interrupts anything already playing.
 * Resolves true when finished, false if interrupted.
 */
export async function say(lines: string | string[], opts: SayOptions = {}): Promise<boolean> {
  stop()
  const my = ++generation
  const list = (Array.isArray(lines) ? lines : [lines]).filter(Boolean)
  useVoiceState.setState({ speaking: true })
  try {
    for (let i = 0; i < list.length; i++) {
      if (my !== generation) return false
      const clip = await getClip(list[i])
      if (my !== generation) return false
      const ok = clip ? await playClip(clip, list[i], opts.onWord) : await speakBrowser(list[i], opts.onWord)
      if (!ok || my !== generation) return false
      if (i < list.length - 1) await wait((opts.gap ?? 0.15) * 1000)
    }
    return true
  } finally {
    if (my === generation) {
      useVoiceState.setState({ speaking: false })
      opts.onWord?.(-1)
    }
  }
}

export function stop() {
  generation++
  stopCurrent?.()
  stopCurrent = null
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  useVoiceState.setState({ speaking: false })
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function playClip(clip: Clip, text: string, onWord?: (i: number) => void): Promise<boolean> {
  const c = audioContext()
  if (c.state === 'suspended') void c.resume()
  useVoiceState.setState({ lastSource: clip.source })
  return new Promise((resolve) => {
    const src = c.createBufferSource()
    src.buffer = clip.buffer
    src.connect(c.destination)
    const startAt = c.currentTime + 0.02
    let raf = 0
    let finished = false
    const words = onWord ? (clip.words?.length ? clip.words : evenTimings(text, clip.buffer.duration)) : null
    const tick = () => {
      if (!words || finished) return
      const t = c.currentTime - startAt
      const idx = words.findIndex(([a, b], i) => t >= a && (t < b || (words[i + 1] && t < words[i + 1][0])))
      if (idx >= 0) onWord!(idx)
      raf = requestAnimationFrame(tick)
    }
    const done = (ok: boolean) => {
      if (finished) return
      finished = true
      cancelAnimationFrame(raf)
      resolve(ok)
    }
    src.onended = () => done(true)
    stopCurrent = () => {
      try {
        src.stop()
      } catch {
        /* not started */
      }
      done(false)
    }
    src.start(startAt)
    raf = requestAnimationFrame(tick)
  })
}

let browserVoice: SpeechSynthesisVoice | null | undefined
function pickBrowserVoice(): SpeechSynthesisVoice | null {
  if (browserVoice !== undefined && browserVoice !== null) return browserVoice
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const prefer = ['Google UK English Female', 'Serena', 'Kate', 'Martha', 'Stephanie', 'Libby', 'Sonia']
  browserVoice =
    prefer.map((n) => voices.find((v) => v.name.includes(n))).find(Boolean) ??
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  return browserVoice
}

function speakBrowser(text: string, onWord?: (i: number) => void): Promise<boolean> {
  if (!('speechSynthesis' in window)) return wait(400).then(() => true)
  useVoiceState.setState({ lastSource: 'browser' })
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const v = pickBrowserVoice()
    if (v) u.voice = v
    u.lang = 'en-GB'
    u.rate = 0.85
    u.pitch = 1.1
    // Map character offsets to word indices for highlighting.
    const starts: number[] = []
    let pos = 0
    for (const w of splitWords(text)) {
      pos = text.indexOf(w, pos)
      starts.push(pos)
      pos += w.length
    }
    u.onboundary = (e) => {
      if (!onWord || e.name !== 'word') return
      let idx = 0
      while (idx + 1 < starts.length && starts[idx + 1] <= e.charIndex) idx++
      onWord(idx)
    }
    let settled = false
    const finish = (ok: boolean) => {
      if (!settled) {
        settled = true
        resolve(ok)
      }
    }
    u.onend = () => finish(true)
    u.onerror = () => finish(false)
    stopCurrent = () => finish(false)
    window.speechSynthesis.speak(u)
    // Safari sometimes never fires onend.
    setTimeout(() => finish(true), 1500 + text.length * 120)
  })
}

/** Used by the parent zone to check an API key and voice. */
export async function testVoice(text: string): Promise<VoiceSource> {
  memory.clear()
  await say(text)
  return useVoiceState.getState().lastSource ?? 'browser'
}

/** How many lines were pre-recorded at build time, and with which voice. */
export async function recordedInfo(): Promise<{ count: number; voiceId?: string }> {
  const m = await loadManifest()
  return { count: Object.keys(m.clips ?? {}).length, voiceId: m.voiceId }
}
