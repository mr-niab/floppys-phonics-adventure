import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STAGES } from '../content/stages'
import { DEFAULT_MODEL_ID, DEFAULT_VOICE_ID } from './elevenlabs'
import type { VoiceMode } from './voice'

export const GAMES = ['learn', 'trace', 'pop', 'build', 'match', 'story'] as const
export type GameId = (typeof GAMES)[number]

export const GAME_INFO: Record<GameId, { name: string; icon: string; colour: string }> = {
  learn: { name: 'Sound Cards', icon: '🃏', colour: '#f97316' },
  trace: { name: 'Magic Trace', icon: '✏️', colour: '#a855f7' },
  pop: { name: 'Balloon Pop', icon: '🎈', colour: '#ef4444' },
  build: { name: 'Word Train', icon: '🚂', colour: '#22c55e' },
  match: { name: 'Picture Match', icon: '🖼️', colour: '#0ea5e9' },
  story: { name: 'Story Time', icon: '📖', colour: '#ec4899' },
}

/** Stickers, awarded in order: one per finished game (first time) and per stage. */
export const STICKERS = [
  '🦖', '🦄', '🐙', '🦋', '🐢', '🦊', '🐼', '🦁', '🐸', '🦉', '🐬', '🦜',
  '🐝', '🦒', '🐧', '🐨', '🦔', '🐳', '🦩', '🐞', '🐿️', '🦓', '🐯', '🐹',
  '🚀', '🌈', '🏰', '🎸', '🍩', '🧁', '🎠', '🪐', '🌋', '🛸', '🏆', '👑',
]

interface SoundStat {
  right: number
  wrong: number
}

export interface Settings {
  childName: string
  voiceMode: VoiceMode
  apiKey: string
  voiceId: string
  modelId: string
  sfx: boolean
  unlockAll: boolean
}

interface State {
  stars: Record<number, Partial<Record<GameId, number>>>
  completed: Record<number, number>
  stickers: string[]
  soundStats: Record<string, SoundStat>
  wordStats: Record<string, SoundStat>
  /** seconds of active use per day, keyed YYYY-MM-DD */
  daily: Record<string, number>
  seenWelcome: boolean
  settings: Settings

  /** Returns the sticker won (if any) and whether this finished the stage. */
  finishGame: (stageId: number, game: GameId, stars: number) => { sticker?: string; stageDone: boolean }
  recordSound: (g: string, correct: boolean) => void
  recordWord: (word: string, correct: boolean) => void
  addTime: (seconds: number) => void
  setSettings: (s: Partial<Settings>) => void
  markWelcome: () => void
  reset: () => void
}

const initial = {
  stars: {},
  completed: {},
  stickers: [],
  soundStats: {},
  wordStats: {},
  daily: {},
  seenWelcome: false,
}

export const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD

export const useProgress = create<State>()(
  persist(
    (set, get) => ({
      ...initial,
      settings: {
        childName: '',
        voiceMode: 'auto',
        apiKey: '',
        voiceId: DEFAULT_VOICE_ID,
        modelId: DEFAULT_MODEL_ID,
        sfx: true,
        unlockAll: false,
      },

      finishGame(stageId, game, earned) {
        const st = get()
        const prev = st.stars[stageId]?.[game] ?? 0
        const stageStars = { ...st.stars[stageId], [game]: Math.max(prev, earned) }
        const stars = { ...st.stars, [stageId]: stageStars }
        const stickers = [...st.stickers]
        let sticker: string | undefined
        const award = () => {
          const next = STICKERS.find((x) => !stickers.includes(x))
          if (next) {
            stickers.push(next)
            sticker = next
          }
        }
        if (prev === 0) award()
        const wasDone = !!st.completed[stageId]
        const stageDone = !wasDone && GAMES.every((g) => (stageStars[g] ?? 0) > 0)
        const completed = stageDone ? { ...st.completed, [stageId]: Date.now() } : st.completed
        if (stageDone) award()
        set({ stars, stickers, completed })
        return { sticker, stageDone }
      },

      recordSound(g, correct) {
        const cur = get().soundStats[g] ?? { right: 0, wrong: 0 }
        set({
          soundStats: {
            ...get().soundStats,
            [g]: correct ? { ...cur, right: cur.right + 1 } : { ...cur, wrong: cur.wrong + 1 },
          },
        })
      },

      recordWord(word, correct) {
        const cur = get().wordStats[word] ?? { right: 0, wrong: 0 }
        set({
          wordStats: {
            ...get().wordStats,
            [word]: correct ? { ...cur, right: cur.right + 1 } : { ...cur, wrong: cur.wrong + 1 },
          },
        })
      },

      addTime(seconds) {
        const d = today()
        set({ daily: { ...get().daily, [d]: (get().daily[d] ?? 0) + seconds } })
      },

      setSettings(s) {
        set({ settings: { ...get().settings, ...s } })
      },

      markWelcome: () => set({ seenWelcome: true }),

      reset: () => set({ ...initial }),
    }),
    { name: 'floppy-phonics-v2', version: 1 },
  ),
)

export const stageStarTotal = (stars: State['stars'], stageId: number) =>
  GAMES.reduce((n, g) => n + (stars[stageId]?.[g] ?? 0), 0)

export function isUnlocked(stageId: number, s: Pick<State, 'completed' | 'settings'>) {
  if (stageId === 1 || s.settings.unlockAll) return true
  return !!s.completed[stageId - 1]
}

/** Current stage = first unlocked, not-yet-completed stage. */
export function currentStage(s: Pick<State, 'completed' | 'settings'>) {
  return STAGES.find((st) => !s.completed[st.id] && isUnlocked(st.id, s))?.id ?? STAGES.length
}

/** Score 1–3 stars from first-try correct answers. */
export const starsFor = (firstTry: number, total: number) =>
  firstTry >= total ? 3 : firstTry >= Math.ceil(total * 0.6) ? 2 : 1
