import { motion, useAnimationControls } from 'framer-motion'
import { useEffect } from 'react'
import { GameShell } from '../components/ui'
import { LINES } from '../content/phrases'
import { sfx } from '../lib/audio'
import { STICKERS, useProgress } from '../lib/store'
import { say } from '../lib/voice'

export function StickerBook({ onBack }: { onBack: () => void }) {
  const owned = useProgress((s) => s.stickers)
  useEffect(() => {
    void say(LINES.stickerBook)
  }, [])
  return (
    <GameShell title={`My Stickers (${owned.length}/${STICKERS.length})`} onBack={onBack}>
      <div className="grid w-full max-w-3xl grid-cols-4 gap-3 rounded-[2rem] bg-white/80 p-4 shadow-xl sm:grid-cols-6 sm:gap-4 sm:p-6">
        {STICKERS.map((st, i) => (
          <Slot key={st} sticker={st} have={owned.includes(st)} index={i} />
        ))}
      </div>
      <p className="font-display mt-4 text-center text-lg text-sky-900/80">Finish games to win more stickers!</p>
    </GameShell>
  )
}

function Slot({ sticker, have, index }: { sticker: string; have: boolean; index: number }) {
  const ctl = useAnimationControls()
  return (
    <motion.button
      className={`grid aspect-square cursor-pointer place-items-center rounded-2xl text-4xl sm:text-5xl ${have ? 'bg-amber-50 shadow-md' : 'border-4 border-dashed border-slate-200'}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ delay: index * 0.025, type: 'spring', stiffness: 300, damping: 15 }}
      onClick={() => {
        if (!have) return
        sfx.squeak()
        void ctl.start({ y: [0, -40, 0], rotate: [0, 360], scale: [1, 1.4, 1], transition: { duration: 0.7 } })
      }}
      aria-label={have ? `Sticker ${sticker}` : 'Empty sticker slot'}
    >
      <motion.span animate={ctl} className={have ? '' : 'opacity-15 grayscale'}>
        {have ? sticker : '❔'}
      </motion.span>
    </motion.button>
  )
}
