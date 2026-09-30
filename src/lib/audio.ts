// One shared Web Audio context for voice clips and sound effects. Browsers
// (especially iOS Safari) only allow audio after a user gesture, so we resume
// the context on the first tap anywhere.

let ctx: AudioContext | null = null

export function audioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function unlockAudioOnFirstGesture() {
  const unlock = () => {
    const c = audioContext()
    if (c.state === 'suspended') void c.resume()
    // Play one silent buffer; needed on older iOS.
    const src = c.createBufferSource()
    src.buffer = c.createBuffer(1, 1, 22050)
    src.connect(c.destination)
    src.start()
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
}

let sfxEnabled = true
export const setSfxEnabled = (on: boolean) => {
  sfxEnabled = on
}

type Note = { f: number; t: number; d: number; type?: OscillatorType; v?: number; slide?: number }

function play(notes: Note[]) {
  if (!sfxEnabled) return
  const c = audioContext()
  const now = c.currentTime + 0.01
  for (const n of notes) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = n.type ?? 'sine'
    osc.frequency.setValueAtTime(n.f, now + n.t)
    if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.slide, now + n.t + n.d)
    const v = n.v ?? 0.18
    gain.gain.setValueAtTime(0.0001, now + n.t)
    gain.gain.exponentialRampToValueAtTime(v, now + n.t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d)
    osc.connect(gain).connect(c.destination)
    osc.start(now + n.t)
    osc.stop(now + n.t + n.d + 0.05)
  }
}

function noiseBurst(duration = 0.12, v = 0.25) {
  if (!sfxEnabled) return
  const c = audioContext()
  const len = Math.floor(c.sampleRate * duration)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3
  const src = c.createBufferSource()
  const gain = c.createGain()
  const filter = c.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 900
  gain.gain.value = v
  src.buffer = buf
  src.connect(filter).connect(gain).connect(c.destination)
  src.start()
}

export const sfx = {
  tap: () => play([{ f: 660, t: 0, d: 0.08, type: 'triangle', v: 0.12 }]),
  pop: () => {
    noiseBurst(0.1, 0.3)
    play([{ f: 900, t: 0, d: 0.12, slide: 300, type: 'triangle' }])
  },
  correct: () =>
    play([
      { f: 523.25, t: 0, d: 0.15, type: 'triangle' },
      { f: 659.25, t: 0.1, d: 0.15, type: 'triangle' },
      { f: 783.99, t: 0.2, d: 0.3, type: 'triangle' },
    ]),
  wrong: () =>
    play([
      { f: 330, t: 0, d: 0.15, type: 'sine', v: 0.12 },
      { f: 262, t: 0.12, d: 0.25, type: 'sine', v: 0.12 },
    ]),
  whoosh: () => play([{ f: 200, t: 0, d: 0.35, slide: 1200, type: 'sine', v: 0.08 }]),
  star: () =>
    play([
      { f: 1046.5, t: 0, d: 0.12, type: 'sine', v: 0.1 },
      { f: 1318.5, t: 0.07, d: 0.12, type: 'sine', v: 0.1 },
      { f: 1568, t: 0.14, d: 0.25, type: 'sine', v: 0.1 },
    ]),
  fanfare: () =>
    play([
      { f: 523.25, t: 0, d: 0.18, type: 'square', v: 0.07 },
      { f: 523.25, t: 0.2, d: 0.1, type: 'square', v: 0.07 },
      { f: 659.25, t: 0.32, d: 0.18, type: 'square', v: 0.07 },
      { f: 783.99, t: 0.52, d: 0.18, type: 'square', v: 0.07 },
      { f: 1046.5, t: 0.72, d: 0.5, type: 'square', v: 0.07 },
    ]),
  choo: () => {
    play([
      { f: 587, t: 0, d: 0.35, type: 'sawtooth', v: 0.05 },
      { f: 740, t: 0, d: 0.35, type: 'sawtooth', v: 0.05 },
      { f: 587, t: 0.45, d: 0.5, type: 'sawtooth', v: 0.05 },
      { f: 740, t: 0.45, d: 0.5, type: 'sawtooth', v: 0.05 },
    ])
  },
  squeak: () => play([{ f: 1200, t: 0, d: 0.1, slide: 1800, type: 'sine', v: 0.1 }]),
}
