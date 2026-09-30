/**
 * Pre-record every line Floppy speaks with ElevenLabs.
 *
 *   ELEVENLABS_API_KEY=sk_... npm run voice:generate
 *
 * Optional env: ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL_ID.
 * Flags: --force (re-record everything), --dry-run (list what would be recorded).
 *
 * Writes public/audio/<id>.mp3 and public/audio/manifest.json. Runs are
 * incremental: only new or changed lines are sent to ElevenLabs, and clips for
 * lines that no longer exist are deleted.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { allPhrases } from '../src/content/phrases.ts'
import { DEFAULT_MODEL_ID, DEFAULT_VOICE_ID, synthesise } from '../src/lib/elevenlabs.ts'
import { clipId, splitWords, wordTimings, type WordTimings } from '../src/lib/timing.ts'

const OUT = join(import.meta.dirname, '..', 'public', 'audio')
const MANIFEST = join(OUT, 'manifest.json')
const CONCURRENCY = 3

interface Manifest {
  voiceId: string
  modelId: string
  clips: Record<string, { file: string; words?: WordTimings }>
}

const args = new Set(process.argv.slice(2))
const force = args.has('--force')
const dryRun = args.has('--dry-run')
const apiKey = process.env.ELEVENLABS_API_KEY ?? ''
const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID
const modelId = process.env.ELEVENLABS_MODEL_ID || DEFAULT_MODEL_ID

if (!apiKey && !dryRun) {
  console.error('Set ELEVENLABS_API_KEY to generate audio (or pass --dry-run).')
  process.exit(1)
}

mkdirSync(OUT, { recursive: true })
const old: Partial<Manifest> = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
const sameVoice = old.voiceId === voiceId && old.modelId === modelId
const manifest: Manifest = { voiceId, modelId, clips: {} }

const phrases = allPhrases()
const todo: string[] = []
for (const text of phrases) {
  const prev = old.clips?.[text]
  if (!force && sameVoice && prev && existsSync(join(OUT, prev.file))) manifest.clips[text] = prev
  else todo.push(text)
}

console.log(`${phrases.length} lines · ${phrases.length - todo.length} already recorded · ${todo.length} to record`)
console.log(`voice ${voiceId} · model ${modelId}`)
if (dryRun) {
  for (const t of todo) console.log('  +', t)
  process.exit(0)
}

let done = 0
let failed = 0
async function worker() {
  while (todo.length) {
    const text = todo.shift()!
    try {
      const res = await withRetry(() => synthesise({ text, apiKey, voiceId, modelId }))
      const file = `${clipId(text)}.mp3`
      writeFileSync(join(OUT, file), Buffer.from(res.audioBase64, 'base64'))
      const multiWord = splitWords(text).length > 1
      manifest.clips[text] = multiWord && res.alignment ? { file, words: wordTimings(text, res.alignment) } : { file }
      done++
      process.stdout.write(`\r  recorded ${done}`)
    } catch (err) {
      failed++
      console.error(`\n  ✗ "${text}": ${err instanceof Error ? err.message : err}`)
    }
  }
}

async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn()
    } catch (err) {
      const msg = String(err)
      const retryable = /ElevenLabs (429|5\d\d)/.test(msg) || /fetch failed/.test(msg)
      if (!retryable || i >= tries - 1) throw err
      await new Promise((r) => setTimeout(r, 2000 * 2 ** i))
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker))
console.log()

// Sort keys so the manifest diff stays readable.
manifest.clips = Object.fromEntries(Object.entries(manifest.clips).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n')

// Remove clips that are no longer referenced.
const keep = new Set(Object.values(manifest.clips).map((c) => c.file))
for (const f of readdirSync(OUT)) {
  if (f.endsWith('.mp3') && !keep.has(f)) rmSync(join(OUT, f))
}

console.log(`Done: ${done} recorded, ${failed} failed, ${Object.keys(manifest.clips).length} in manifest.`)
if (failed) process.exit(1)
