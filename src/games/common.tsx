import { AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Mood } from '../components/Floppy'
import { RoundComplete, pick } from '../components/ui'
import { ENCOURAGE, PRAISE } from '../content/phrases'
import type { Stage } from '../content/stages'
import { useProgress, type GameId } from '../lib/store'
import { say, stop } from '../lib/voice'

export interface GameProps {
  stage: Stage
  /** Leave the game. `stageDone` is true when this finished the whole stage. */
  onExit: (stageDone?: boolean) => void
  /** Play the same game again from the start. */
  onAgain: () => void
}

/** Handles scoring, stickers and the celebration overlay for a game. */
export function useFinish(stageId: number, game: GameId, { onExit, onAgain }: Pick<GameProps, 'onExit' | 'onAgain'>) {
  const [result, setResult] = useState<{ stars: number; sticker?: string; stageDone: boolean } | null>(null)
  const finish = useCallback(
    (stars: number) => {
      const r = useProgress.getState().finishGame(stageId, game, stars)
      setResult({ stars, ...r })
    },
    [stageId, game],
  )
  const overlay = (
    <AnimatePresence>
      {result && (
        <RoundComplete
          stars={result.stars}
          sticker={result.sticker}
          onAgain={onAgain}
          onDone={() => {
            stop()
            onExit(result.stageDone)
          }}
        />
      )}
    </AnimatePresence>
  )
  return { finish, overlay, finished: !!result }
}

/** Floppy's mood, with happy/oops reactions that settle back to idle. */
export function useMood() {
  const [mood, setMood] = useState<Mood>('idle')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const react = useCallback((m: Mood, ms = 1400) => {
    clearTimeout(timer.current)
    setMood(m)
    timer.current = setTimeout(() => setMood('idle'), ms)
  }, [])
  useEffect(() => () => clearTimeout(timer.current), [])
  return { mood, setMood, react }
}

export const praise = () => say(pick(PRAISE))
export const encourage = () => pick(ENCOURAGE)

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Stop any speech when a game unmounts. */
export function useStopOnUnmount() {
  useEffect(() => () => stop(), [])
}
