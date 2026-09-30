import type { Alignment } from './timing'

// Minimal ElevenLabs text-to-speech client (used by the browser in live mode
// and by scripts/generate-audio.ts at build time).

export const DEFAULT_VOICE_ID = 'QJksobp1edMNvmwcG5lm' // "Juliet" – warm British storyteller
export const DEFAULT_MODEL_ID = 'eleven_multilingual_v2'

export const VOICE_SETTINGS = {
  stability: 0.6,
  similarity_boost: 0.8,
  style: 0.35,
  use_speaker_boost: true,
  speed: 0.9, // a touch slower for early readers
}

export interface TtsResult {
  audioBase64: string
  alignment: Alignment | null
}

export async function synthesise(opts: {
  text: string
  apiKey: string
  voiceId?: string
  modelId?: string
  signal?: AbortSignal
}): Promise<TtsResult> {
  const voiceId = opts.voiceId || DEFAULT_VOICE_ID
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: 'POST',
      signal: opts.signal,
      headers: { 'xi-api-key': opts.apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: opts.text,
        model_id: opts.modelId || DEFAULT_MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    },
  )
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`ElevenLabs ${res.status}: ${detail.slice(0, 200)}`)
  }
  const json = (await res.json()) as { audio_base64: string; alignment?: Alignment }
  return { audioBase64: json.audio_base64, alignment: json.alignment ?? null }
}
