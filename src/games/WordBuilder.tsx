import { AnimatePresence, LayoutGroup, motion, useAnimationControls } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bouncy, GameShell, SpeakerButton, shuffle } from '../components/ui'
import { LINES } from '../content/phrases'
import { partSound, soundFor, wordText } from '../content/stages'
import { sfx } from '../lib/audio'
import { starsFor, useProgress } from '../lib/store'
import { preload, say } from '../lib/voice'
import { praise, useFinish, useMood, useStopOnUnmount, wait, type GameProps } from './common'

const ROUNDS = 5

interface Tile {
  id: string
  part: string
}

/** Build the word by tapping its sounds in order, then blend and send the train off. */
export function WordBuilder({ stage, onExit, onAgain }: GameProps) {
  const words = useMemo(() => shuffle(stage.words).slice(0, ROUNDS), [stage.words])
  const [round, setRound] = useState(0)
  const [placed, setPlaced] = useState<Tile[]>([])
  const [tray, setTray] = useState<Tile[]>([])
  const [shake, setShake] = useState<string | null>(null)
  const [blendIndex, setBlendIndex] = useState<number | 'all' | null>(null)
  const [phase, setPhase] = useState<'build' | 'blend' | 'leave'>('build')
  const firstTry = useRef(0)
  const missed = useRef(false)
  const train = useAnimationControls()
  const { mood, react, setMood } = useMood()
  const { finish, overlay } = useFinish(stage.id, 'build', { onExit, onAgain })
  const recordWord = useProgress((s) => s.recordWord)
  useStopOnUnmount()

  const word = words[round]
  const text = wordText(word)

  useEffect(() => {
    preload(words.flatMap((w) => [wordText(w), ...w.parts.map((_, i) => partSound(w, i) ?? '')]))
  }, [words])

  // Set up each round: shuffle tiles, roll the train in.
  useEffect(() => {
    setPlaced([])
    setTray(shuffle(word.parts.map((part, i) => ({ id: `${round}-${i}`, part }))))
    setPhase('build')
    setBlendIndex(null)
    missed.current = false
    train.set({ x: '-110vw' })
    void train.start({ x: 0, transition: { type: 'spring', stiffness: 50, damping: 12 } })
    sfx.choo()
    void say(round === 0 ? [LINES.buildIntro, text] : text)
  }, [round, word, text, train])

  const tapTile = async (tile: Tile) => {
    if (phase !== 'build') return
    const needed = word.parts[placed.length]
    const snd = soundFor(tile.part)
    if (tile.part === needed) {
      sfx.tap()
      const next = [...placed, tile]
      setPlaced(next)
      setTray((t) => t.filter((x) => x.id !== tile.id))
      const s = partSound(word, placed.length)
      if (s) void say(s)
      if (next.length === word.parts.length) await complete()
    } else {
      missed.current = true
      sfx.wrong()
      react('oops')
      setShake(tile.id)
      setTimeout(() => setShake(null), 500)
      if (snd) void say([snd.say])
    }
  }

  const complete = async () => {
    setPhase('blend')
    recordWord(text, !missed.current)
    if (!missed.current) firstTry.current++
    await wait(500)
    setMood('thinking')
    await say(LINES.blendIt)
    for (let i = 0; i < word.parts.length; i++) {
      const s = partSound(word, i)
      if (!s) continue
      setBlendIndex(i)
      await say(s)
      await wait(120)
    }
    setBlendIndex('all')
    react('happy', 2000)
    sfx.correct()
    await say(text)
    await praise()
    setPhase('leave')
    sfx.choo()
    await train.start({ x: '120vw', transition: { duration: 1.4, ease: 'easeIn' } })
    if (round + 1 >= ROUNDS) finish(starsFor(firstTry.current, ROUNDS))
    else setRound(round + 1)
  }

  return (
    <GameShell title="Word Train" onBack={() => onExit()} progress={round} total={ROUNDS} mood={mood}>
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={round}
            className="text-8xl drop-shadow-lg sm:text-9xl"
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0, y: [0, -8, 0] }}
            exit={{ scale: 0, rotate: 30 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, y: { duration: 2, repeat: Infinity } }}
          >
            {word.emoji}
          </motion.div>
        </AnimatePresence>
        <SpeakerButton lines={text} label="Hear the word" />
      </div>

      <LayoutGroup>
        {/* the train */}
        <motion.div animate={train} className="my-6 flex items-end">
          <Engine puffing={phase === 'leave' || phase === 'build'} />
          {word.parts.map((part, i) => {
            const tile = placed[i]
            const lit = blendIndex === 'all' || blendIndex === i
            const isSplit = word.split?.includes(i)
            return (
              <div key={`${round}-${i}`} className="relative -ml-1 flex flex-col items-center">
                {isSplit && tile && blendIndex === 'all' && i === word.split![0] && <MagicArc span={word.split![1] - word.split![0]} />}
                <motion.div
                  className="grid h-20 w-16 place-items-center rounded-xl border-4 border-white bg-sky-100 shadow-inner sm:h-24 sm:w-20"
                  animate={{ backgroundColor: lit ? '#fde047' : '#e0f2fe', y: lit ? -10 : 0, scale: lit ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  {tile ? (
                    <motion.span layoutId={tile.id} className="font-letters text-4xl text-slate-800 sm:text-5xl">
                      {part}
                    </motion.span>
                  ) : (
                    <span className="font-letters text-4xl text-sky-300">?</span>
                  )}
                </motion.div>
                <Wheels />
              </div>
            )
          })}
        </motion.div>

        {/* the tiles */}
        <div className="flex min-h-24 flex-wrap justify-center gap-3">
          {tray.map((tile) => (
            <motion.button
              key={tile.id}
              layoutId={tile.id}
              onClick={() => void tapTile(tile)}
              className="font-letters grid h-20 w-20 cursor-pointer touch-manipulation place-items-center rounded-2xl bg-white text-4xl text-slate-800 shadow-[0_6px_0_#cbd5e1] sm:h-24 sm:w-24 sm:text-5xl"
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.9 }}
              animate={shake === tile.id ? { x: [0, -10, 10, -6, 6, 0], backgroundColor: ['#fff', '#fecaca', '#fff'] } : { x: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            >
              {tile.part}
            </motion.button>
          ))}
        </div>
      </LayoutGroup>
      {phase === 'build' && placed.length === 0 && round === 0 && (
        <motion.p className="font-display mt-4 text-lg text-sky-800" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          Tap the first sound 👆
        </motion.p>
      )}
      {phase === 'build' && (
        <Bouncy
          className="font-display mt-4 rounded-full bg-white/80 px-4 py-2 text-sky-800 shadow"
          onClick={() => void say(word.parts.map((_, i) => partSound(word, i) ?? '').filter(Boolean).concat(text))}
        >
          🙋 Help me
        </Bouncy>
      )}
      {overlay}
    </GameShell>
  )
}

function Engine({ puffing }: { puffing: boolean }) {
  return (
    <div className="relative mr-1 flex flex-col items-center">
      <div className="absolute -top-12 left-4">
        {puffing &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="absolute block h-6 w-6 rounded-full bg-white/90"
              initial={{ y: 0, x: 0, scale: 0.4, opacity: 0.9 }}
              animate={{ y: -50, x: -30, scale: 1.8, opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
      </div>
      <div className="relative h-24 w-24 sm:h-28 sm:w-28">
        <div className="absolute bottom-0 h-14 w-full rounded-l-2xl rounded-r-md bg-red-500 shadow-inner" />
        <div className="absolute bottom-10 right-0 h-14 w-12 rounded-t-lg bg-red-600">
          <div className="m-2 h-6 w-7 rounded bg-sky-200" />
        </div>
        <div className="absolute bottom-12 left-3 h-10 w-5 rounded-t bg-slate-700" />
        <div className="absolute bottom-3 left-2 text-2xl">🐶</div>
      </div>
      <Wheels />
    </div>
  )
}

function Wheels() {
  return (
    <div className="flex gap-4">
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="h-6 w-6 rounded-full border-4 border-slate-700 bg-slate-400"
          style={{ borderTopColor: '#facc15' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

/** Sparkly arc linking the two halves of a magic-e split digraph. */
function MagicArc({ span }: { span: number }) {
  const width = span * 76
  return (
    <svg className="pointer-events-none absolute -top-10 left-8 z-10 overflow-visible" width={width} height="40">
      <motion.path
        d={`M0 36 Q ${width / 2} -18 ${width} 36`}
        stroke="#a855f7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="1 0"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
      <motion.text x={width / 2} y="4" textAnchor="middle" fontSize="20" animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
        ✨
      </motion.text>
    </svg>
  )
}
