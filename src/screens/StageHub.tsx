import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Floppy } from '../components/Floppy'
import { BackButton, Bouncy, Stars } from '../components/ui'
import { LINES } from '../content/phrases'
import type { Stage } from '../content/stages'
import { GAMES, GAME_INFO, useProgress, type GameId } from '../lib/store'
import { say } from '../lib/voice'

/** Pick one of the six games for a stage. */
export function StageHub({ stage, onBack, onGame, onCertificate }: { stage: Stage; onBack: () => void; onGame: (g: GameId) => void; onCertificate: () => void }) {
  const stars = useProgress((s) => s.stars[stage.id]) ?? {}
  const done = useProgress((s) => !!s.completed[stage.id])

  useEffect(() => {
    void say([stage.title, LINES.pickGame])
  }, [stage])

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <BackButton onClick={onBack} />
        <motion.div
          className="grid h-16 w-16 place-items-center rounded-full text-4xl shadow-lg"
          style={{ background: stage.colour }}
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180 }}
        >
          {stage.icon}
        </motion.div>
        <div className="min-w-0">
          <h1 className="font-display truncate text-3xl text-sky-900 drop-shadow-[0_2px_0_white]">
            Stage {stage.id}: {stage.title}
          </h1>
          <p className="font-letters text-lg text-sky-800/80">{stage.subtitle}</p>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
        {GAMES.map((g, i) => {
          const info = GAME_INFO[g]
          const earned = stars[g] ?? 0
          return (
            <motion.button
              key={g}
              onClick={() => onGame(g)}
              className="relative flex cursor-pointer touch-manipulation flex-col items-center gap-2 overflow-hidden rounded-[2rem] border-4 border-white p-5 text-white shadow-xl"
              style={{ background: `linear-gradient(160deg, ${info.colour}, ${info.colour}cc)` }}
              initial={{ y: 80, opacity: 0, rotate: i % 2 ? 6 : -6 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 200, damping: 15 }}
              whileHover={{ y: -8, rotate: i % 2 ? 2 : -2 }}
              whileTap={{ scale: 0.92 }}
            >
              <motion.span
                className="text-6xl drop-shadow-lg"
                animate={{ rotate: [0, -10, 10, 0], y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
              >
                {info.icon}
              </motion.span>
              <span className="font-display text-xl drop-shadow">{info.name}</span>
              <div className="rounded-full bg-white/90 px-2 py-0.5">
                <Stars count={earned} size="text-lg" />
              </div>
              {earned > 0 && <span className="absolute right-3 top-3 text-xl">✅</span>}
            </motion.button>
          )
        })}
      </div>

      <div className="mt-8 flex items-end justify-center gap-4">
        <Floppy mood={done ? 'celebrate' : 'idle'} size={120} />
        {done && (
          <Bouncy
            onClick={onCertificate}
            className="font-display mb-6 rounded-full bg-amber-400 px-6 py-3 text-xl text-amber-900 shadow-[0_6px_0_#b45309]"
            animate={{ rotate: [0, -3, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            🏆 My certificate
          </Bouncy>
        )}
      </div>
    </div>
  )
}
