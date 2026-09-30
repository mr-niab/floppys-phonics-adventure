import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Floppy } from '../components/Floppy'
import { Bouncy, celebrate } from '../components/ui'
import { LINES } from '../content/phrases'
import type { Stage } from '../content/stages'
import { sfx } from '../lib/audio'
import { useProgress } from '../lib/store'
import { say } from '../lib/voice'

export function Certificate({ stage, onDone }: { stage: Stage; onDone: () => void }) {
  const name = useProgress((s) => s.settings.childName)
  const when = useProgress((s) => s.completed[stage.id])

  useEffect(() => {
    celebrate('big')
    sfx.fanfare()
    void say(LINES.stageDone)
  }, [])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-4">
      <motion.div
        className="certificate relative w-full max-w-2xl rounded-[2rem] border-[12px] bg-[#fffbeb] p-8 text-center shadow-2xl"
        style={{ borderColor: stage.colour }}
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 12 }}
      >
        <motion.div
          className="absolute -right-6 -top-10 text-8xl"
          animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🏅
        </motion.div>
        <p className="font-display text-xl uppercase tracking-widest text-amber-700">Certificate of Reading</p>
        <p className="font-letters mt-4 text-2xl text-slate-600">This is to say that</p>
        <motion.p
          className="font-display my-2 text-5xl sm:text-6xl"
          style={{ color: stage.colour }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {name || 'Super Reader'}
        </motion.p>
        <p className="font-letters text-2xl text-slate-600">has finished</p>
        <p className="font-display mt-2 text-3xl text-slate-800">
          {stage.icon} Stage {stage.id}: {stage.title}
        </p>
        <div className="mt-4 flex justify-center">
          <Floppy mood="celebrate" size={110} />
        </div>
        <p className="font-letters mt-2 text-lg text-slate-500">
          {new Date(when ?? Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · Signed, Floppy 🐾
        </p>
      </motion.div>
      <div className="flex gap-4 print:hidden">
        <Bouncy onClick={() => window.print()} className="font-display rounded-full bg-white px-6 py-3 text-xl text-sky-800 shadow-lg">
          🖨️ Print
        </Bouncy>
        <Bouncy onClick={onDone} className="font-display rounded-full bg-green-500 px-6 py-3 text-xl text-white shadow-[0_6px_0_#15803d]">
          🗺️ Back to map
        </Bouncy>
      </div>
    </div>
  )
}
