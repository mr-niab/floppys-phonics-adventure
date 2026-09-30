import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Bouncy, GameShell } from '../components/ui'
import { LINES, soundLine } from '../content/phrases'
import type { Sound } from '../content/stages'
import { sfx } from '../lib/audio'
import { preload, say } from '../lib/voice'
import { useFinish, useMood, useStopOnUnmount, type GameProps } from './common'

/** Flip every card to meet the stage's sounds. */
export function LearnSounds({ stage, onExit, onAgain }: GameProps) {
  const [flipped, setFlipped] = useState<Set<string>>(new Set())
  const [active, setActive] = useState<string | null>(null)
  const { mood, react } = useMood()
  const { finish, overlay } = useFinish(stage.id, 'learn', { onExit, onAgain })
  useStopOnUnmount()

  useEffect(() => {
    preload(stage.sounds.map(soundLine))
    void say([stage.title, LINES.learnIntro])
  }, [stage])

  const tap = async (snd: Sound) => {
    if (!flipped.has(snd.g)) {
      sfx.whoosh()
      setFlipped((f) => new Set(f).add(snd.g))
      react('happy', 900)
    }
    setActive(snd.g)
    await say(soundLine(snd))
    setActive((a) => (a === snd.g ? null : a))
  }

  const allDone = flipped.size === stage.sounds.length

  return (
    <GameShell title="Sound Cards" onBack={() => onExit()} progress={flipped.size} total={stage.sounds.length} mood={mood}>
      <div className="grid w-full max-w-[min(100%,calc((100dvh-200px)*1.15))] grid-cols-3 gap-3 sm:grid-cols-4 sm:gap-5" style={{ perspective: 1200 }}>
        {stage.sounds.map((snd, i) => (
          <Card key={snd.g} snd={snd} index={i} flipped={flipped.has(snd.g)} active={active === snd.g} colour={stage.colour} onTap={() => void tap(snd)} />
        ))}
      </div>
      <AnimatePresence>
        {allDone && (
          <motion.div className="mt-6" initial={{ scale: 0, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
            <Bouncy
              onClick={() => finish(3)}
              className="font-display rounded-full bg-green-500 px-8 py-4 text-2xl text-white shadow-[0_8px_0_#15803d]"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              I know them all! 🎉
            </Bouncy>
          </motion.div>
        )}
      </AnimatePresence>
      {overlay}
    </GameShell>
  )
}

function Card({
  snd,
  index,
  flipped,
  active,
  colour,
  onTap,
}: {
  snd: Sound
  index: number
  flipped: boolean
  active: boolean
  colour: string
  onTap: () => void
}) {
  return (
    <motion.button
      className="relative aspect-[4/5] w-full cursor-pointer touch-manipulation"
      initial={{ opacity: 0, y: 60, rotate: -8 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 200, damping: 14 }}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.93 }}
      onClick={onTap}
      aria-label={flipped ? `${snd.g}, as in ${snd.word}` : 'Hidden sound card'}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        {/* back */}
        <div
          className="absolute inset-0 grid place-items-center rounded-3xl border-4 border-white text-5xl shadow-xl"
          style={{ backfaceVisibility: 'hidden', background: `repeating-linear-gradient(45deg, ${colour}, ${colour} 14px, ${colour}cc 14px, ${colour}cc 28px)` }}
        >
          <motion.span animate={{ rotate: [0, 12, -12, 0] }} transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.2 }}>
            🐾
          </motion.span>
        </div>
        {/* front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-4 bg-white shadow-xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderColor: colour }}
        >
          <motion.span
            className="font-letters leading-none"
            style={{ color: colour, fontSize: snd.g.length > 2 ? '2.6rem' : '3.6rem' }}
            animate={active ? { scale: [1, 1.35, 1], y: [0, -10, 0] } : { scale: 1 }}
            transition={{ duration: 0.6, repeat: active ? Infinity : 0 }}
          >
            {snd.g}
          </motion.span>
          <motion.span className="text-4xl" animate={active ? { rotate: [0, -12, 12, 0] } : {}} transition={{ duration: 0.6, repeat: active ? Infinity : 0 }}>
            {snd.emoji}
          </motion.span>
          <span className="font-letters text-lg text-slate-500">{snd.word}</span>
        </div>
      </motion.div>
    </motion.button>
  )
}
