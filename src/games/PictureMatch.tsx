import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bouncy, Burst, GameShell, shuffle } from '../components/ui'
import { LINES } from '../content/phrases'
import { partSound, wordText, type Word } from '../content/stages'
import { sfx } from '../lib/audio'
import { starsFor, useProgress } from '../lib/store'
import { say } from '../lib/voice'
import { encourage, praise, useFinish, useMood, useStopOnUnmount, wait, type GameProps } from './common'

const ROUNDS = 6

/** Read the word (with sound buttons), then pick the matching picture. */
export function PictureMatch({ stage, onExit, onAgain }: GameProps) {
  const rounds = useMemo(() => {
    const targets = shuffle(stage.words).slice(0, ROUNDS)
    return targets.map((t) => ({
      word: t,
      options: shuffle([t, ...shuffle(stage.words.filter((w) => w !== t && w.emoji !== t.emoji)).slice(0, 2)]),
    }))
  }, [stage.words])
  const [round, setRound] = useState(0)
  const [right, setRight] = useState<string | null>(null)
  const [wrong, setWrong] = useState<Set<string>>(new Set())
  const [lit, setLit] = useState<number | 'all' | null>(null)
  const firstTry = useRef(0)
  const { mood, react } = useMood()
  const { finish, overlay } = useFinish(stage.id, 'match', { onExit, onAgain })
  const recordWord = useProgress((s) => s.recordWord)
  useStopOnUnmount()

  const { word, options } = rounds[round]
  const text = wordText(word)

  useEffect(() => {
    if (round === 0) void say(LINES.matchIntro)
  }, [round])

  const blend = async () => {
    for (let i = 0; i < word.parts.length; i++) {
      const s = partSound(word, i)
      if (!s) continue
      setLit(i)
      await say(s)
    }
    setLit('all')
    await say(text)
    setLit(null)
  }

  const choose = async (opt: Word) => {
    if (right) return
    if (opt === word) {
      setRight(opt.emoji)
      sfx.correct()
      react('happy')
      recordWord(text, wrong.size === 0)
      if (wrong.size === 0) firstTry.current++
      setLit('all')
      await say(text)
      await Promise.all([praise(), wait(900)])
      if (round + 1 >= ROUNDS) return finish(starsFor(firstTry.current, ROUNDS))
      setRight(null)
      setWrong(new Set())
      setLit(null)
      setRound(round + 1)
    } else {
      sfx.wrong()
      react('oops')
      setWrong((w) => new Set(w).add(opt.emoji))
      void say(encourage())
    }
  }

  return (
    <GameShell title="Picture Match" onBack={() => onExit()} progress={round} total={ROUNDS} mood={mood}>
      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          className="flex w-full flex-col items-center gap-8"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 20 }}
        >
          <div className="flex items-end gap-1 rounded-[2rem] bg-white px-6 pb-4 pt-2 shadow-xl sm:gap-2 sm:px-10">
            {word.parts.map((p, i) => (
              <SoundButtonLetter
                key={i}
                part={p}
                digraph={p.length > 1}
                silent={!partSound(word, i)}
                lit={lit === 'all' || lit === i}
                onTap={() => {
                  const s = partSound(word, i)
                  if (s) void say(s)
                }}
              />
            ))}
          </div>
          <Bouncy onClick={() => void blend()} className="font-display rounded-full bg-amber-400 px-5 py-2 text-xl text-amber-900 shadow-[0_5px_0_#b45309]">
            🐶 Sound it out
          </Bouncy>
          <div className="grid w-full max-w-2xl grid-cols-3 gap-3 sm:gap-6" style={{ perspective: 1000 }}>
            {options.map((opt, i) => {
              const isWrong = wrong.has(opt.emoji)
              const isRight = right === opt.emoji
              return (
                <motion.button
                  key={opt.emoji}
                  onClick={() => void choose(opt)}
                  disabled={isWrong}
                  aria-label={`Picture ${i + 1}`}
                  className="relative grid aspect-square cursor-pointer touch-manipulation place-items-center rounded-3xl border-4 border-white bg-white/90 text-6xl shadow-xl sm:text-8xl"
                  initial={{ rotateY: 180, opacity: 0 }}
                  animate={{
                    rotateY: 0,
                    opacity: isWrong ? 0.35 : 1,
                    scale: isRight ? 1.15 : 1,
                    borderColor: isRight ? '#22c55e' : isWrong ? '#fca5a5' : '#ffffff',
                    x: isWrong ? [0, -10, 10, -6, 6, 0] : 0,
                  }}
                  transition={{ delay: right || isWrong ? 0 : 0.15 * i, type: 'spring', stiffness: 180, damping: 14 }}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.92 }}
                >
                  <motion.span animate={isRight ? { rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.6 }}>
                    {opt.emoji}
                  </motion.span>
                  <Burst show={isRight} />
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>
      {overlay}
    </GameShell>
  )
}

/**
 * A grapheme with a UK-style "sound button" underneath: a dot for one letter,
 * a dash for a digraph. Tapping plays the sound.
 */
export function SoundButtonLetter({
  part,
  digraph,
  silent,
  lit,
  onTap,
}: {
  part: string
  digraph: boolean
  silent?: boolean
  lit: boolean
  onTap: () => void
}) {
  return (
    <motion.button
      onClick={onTap}
      className="flex cursor-pointer touch-manipulation flex-col items-center"
      animate={{ y: lit ? -12 : 0, scale: lit ? 1.12 : 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 14 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.span className="font-letters text-6xl sm:text-8xl" animate={{ color: lit ? '#f97316' : silent ? '#94a3b8' : '#1e293b' }}>
        {part}
      </motion.span>
      {!silent && (
        <motion.span
          className="mt-1 block rounded-full"
          style={{ height: 14, width: digraph ? 48 : 14 }}
          animate={{ backgroundColor: lit ? '#f97316' : '#fb7185', scale: lit ? 1.3 : 1 }}
        />
      )}
    </motion.button>
  )
}
