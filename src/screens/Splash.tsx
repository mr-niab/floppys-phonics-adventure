import { motion } from 'framer-motion'
import { Floppy } from '../components/Floppy'
import { Bouncy } from '../components/ui'

const TITLE = "Floppy's"
const SUB = 'Phonics Adventure'
const COLOURS = ['#f97316', '#eab308', '#22c55e', '#06b6d4', '#6366f1', '#ec4899']

/** Title screen. The first tap also unlocks audio on iOS. */
export function Splash({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="font-display flex text-6xl sm:text-8xl" aria-label={`${TITLE} ${SUB}`}>
        {TITLE.split('').map((ch, i) => (
          <motion.span
            key={i}
            className="inline-block drop-shadow-[0_5px_0_rgba(255,255,255,0.9)]"
            style={{ color: COLOURS[i % COLOURS.length] }}
            initial={{ y: -300, rotate: -40, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 220, damping: 11 }}
            whileHover={{ y: -12, rotate: -8 }}
          >
            {ch}
          </motion.span>
        ))}
      </h1>
      <motion.p
        className="font-display -mt-4 text-3xl text-sky-900 sm:text-4xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.9, type: 'spring' }}
      >
        {SUB}
      </motion.p>
      <motion.div initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, type: 'spring', stiffness: 90 }}>
        <Floppy mood="happy" size={200} />
      </motion.div>
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 12 }}>
        <Bouncy
          onClick={onStart}
          className="font-display rounded-full bg-green-500 px-12 py-5 text-4xl text-white shadow-[0_10px_0_#15803d]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >
          ▶ Play
        </Bouncy>
      </motion.div>
    </div>
  )
}
