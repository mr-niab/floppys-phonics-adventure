import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameShell, SpeakerButton, shuffle } from '../components/ui'
import { LINES } from '../content/phrases'
import { STAGES, type Sound } from '../content/stages'
import { sfx } from '../lib/audio'
import { starsFor, useProgress } from '../lib/store'
import { preload, say } from '../lib/voice'
import { encourage, praise, useFinish, useMood, useStopOnUnmount, wait, type GameProps } from './common'

const ROUNDS = 6
const COLOURS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6', '#ec4899']

interface Round {
  target: Sound
  options: Sound[]
}

function makeRounds(stageId: number): Round[] {
  const stage = STAGES[stageId - 1]
  // Distractors come from this stage first, then earlier stages.
  const pool = [...stage.sounds, ...STAGES.slice(0, stageId - 1).flatMap((s) => s.sounds)]
  const targets = shuffle(stage.sounds)
  return Array.from({ length: ROUNDS }, (_, i) => {
    const target = targets[i % targets.length]
    const others = shuffle(pool.filter((s) => s.say !== target.say && s.g !== target.g))
    const unique: Sound[] = []
    for (const o of others) if (!unique.some((u) => u.g === o.g) && unique.length < 3) unique.push(o)
    return { target, options: shuffle([target, ...unique]) }
  })
}

/** Hear a sound, pop the balloon that shows it. */
export function SoundPop({ stage, onExit, onAgain }: GameProps) {
  const rounds = useMemo(() => makeRounds(stage.id), [stage.id])
  const [round, setRound] = useState(0)
  const [popped, setPopped] = useState<string | null>(null)
  const [wobble, setWobble] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const firstTry = useRef(0)
  const missed = useRef(false)
  const { mood, react } = useMood()
  const { finish, overlay } = useFinish(stage.id, 'pop', { onExit, onAgain })
  const recordSound = useProgress((s) => s.recordSound)
  useStopOnUnmount()

  const current = rounds[round]
  const prompt = useCallback((r: Round) => [LINES.findSound, r.target.say], [])

  useEffect(() => {
    preload([LINES.findSound, ...rounds.map((r) => r.target.say)])
    void say([LINES.popIntro, ...prompt(rounds[0])])
  }, [rounds, prompt])

  const tap = async (opt: Sound) => {
    if (locked) return
    if (opt.g === current.target.g) {
      setLocked(true)
      setPopped(opt.g)
      sfx.pop()
      react('happy')
      recordSound(current.target.g, !missed.current)
      if (!missed.current) firstTry.current++
      await Promise.all([praise(), wait(1300)])
      if (round + 1 >= ROUNDS) {
        finish(starsFor(firstTry.current, ROUNDS))
        return
      }
      missed.current = false
      setPopped(null)
      setRound(round + 1)
      setLocked(false)
      void say(prompt(rounds[round + 1]))
    } else {
      missed.current = true
      sfx.wrong()
      setWobble(opt.g)
      react('oops')
      setTimeout(() => setWobble(null), 600)
      void say([encourage(), ...prompt(current)])
    }
  }

  return (
    <GameShell title="Balloon Pop" onBack={() => onExit()} progress={round} total={ROUNDS} mood={mood}>
      <div className="mb-4 flex items-center gap-3 rounded-full bg-white/85 px-5 py-2 shadow-lg">
        <SpeakerButton lines={prompt(current)} size="lg" label="Hear the sound again" />
        <span className="font-display text-2xl text-sky-900">Which balloon?</span>
      </div>
      <div className="relative flex h-[55vh] w-full items-end justify-center gap-3 sm:gap-8">
        <AnimatePresence mode="popLayout">
          {current.options.map((opt, i) => (
            <Balloon
              key={`${round}-${opt.g}`}
              label={opt.g}
              colour={COLOURS[(round * 3 + i) % COLOURS.length]}
              index={i}
              popped={popped === opt.g}
              flyAway={popped !== null && popped !== opt.g}
              wobble={wobble === opt.g}
              onTap={() => void tap(opt)}
            />
          ))}
        </AnimatePresence>
      </div>
      {overlay}
    </GameShell>
  )
}

function Balloon({
  label,
  colour,
  index,
  popped,
  flyAway,
  wobble,
  onTap,
}: {
  label: string
  colour: string
  index: number
  popped: boolean
  flyAway: boolean
  wobble: boolean
  onTap: () => void
}) {
  const shards = Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2)
  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ y: '70vh', opacity: 0 }}
      animate={
        flyAway
          ? { y: '-90vh', opacity: 0, transition: { duration: 1.2, ease: 'easeIn' } }
          : { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60, damping: 11, delay: index * 0.15 } }
      }
      exit={{ opacity: 0 }}
    >
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 2.4 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center"
      >
        <AnimatePresence>
          {!popped && (
            <motion.button
              onClick={onTap}
              aria-label={`Balloon ${label}`}
              className="relative grid h-32 w-24 cursor-pointer touch-manipulation place-items-center rounded-[50%_50%_48%_48%/55%_55%_45%_45%] sm:h-40 sm:w-32"
              style={{ background: `radial-gradient(circle at 30% 25%, #ffffffaa 0 12%, ${colour} 13%)`, boxShadow: `inset -10px -14px 0 ${colour}99` }}
              animate={wobble ? { x: [0, -14, 14, -10, 10, 0], rotate: [0, -8, 8, 0] } : { x: 0 }}
              transition={{ duration: 0.5 }}
              whileTap={{ scale: 0.92 }}
              exit={{ scale: 1.6, opacity: 0, transition: { duration: 0.18 } }}
            >
              <span className="font-letters text-5xl text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.25)] sm:text-6xl">{label}</span>
              <span className="absolute -bottom-2 h-3 w-4 rounded-sm" style={{ background: colour }} />
            </motion.button>
          )}
        </AnimatePresence>
        {popped &&
          shards.map((a, i) => (
            <motion.span
              key={i}
              className="absolute top-14 h-4 w-4 rounded-full"
              style={{ background: i % 2 ? colour : '#facc15' }}
              initial={{ x: 0, y: 0, scale: 1 }}
              animate={{ x: Math.cos(a) * 110, y: Math.sin(a) * 110, scale: 0, rotate: 180 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          ))}
        <motion.svg width="20" height="90" viewBox="0 0 20 90" animate={{ opacity: popped ? 0 : 1 }}>
          <path d="M10 0 Q0 22 10 45 T10 90" stroke="#94a3b8" strokeWidth="2" fill="none" />
        </motion.svg>
      </motion.div>
    </motion.div>
  )
}
