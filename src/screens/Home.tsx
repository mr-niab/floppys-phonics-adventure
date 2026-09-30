import { motion, useAnimationControls } from 'framer-motion'
import { Floppy } from '../components/Floppy'
import { Bouncy } from '../components/ui'
import { LINES } from '../content/phrases'
import { STAGES, type Stage } from '../content/stages'
import { sfx } from '../lib/audio'
import { GAMES, currentStage, isUnlocked, stageStarTotal, useProgress } from '../lib/store'
import { say } from '../lib/voice'

const ROW = 170
const XS = [95, 265, 120, 255, 105, 250] // positions in a 360-wide map

/** The adventure map: a winding path through all six stages. */
export function Home({ onStage, onStickers, onParent }: { onStage: (id: number) => void; onStickers: () => void; onParent: () => void }) {
  const progress = useProgress()
  const current = currentStage(progress)
  const height = STAGES.length * ROW + 40
  const pts = STAGES.map((_, i) => ({ x: XS[i], y: 80 + i * ROW }))
  const path = pts.reduce((d, p, i) => {
    if (i === 0) return `M${p.x} ${p.y}`
    const prev = pts[i - 1]
    const midY = (prev.y + p.y) / 2
    return `${d} C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`
  }, '')
  const doneCount = STAGES.filter((s) => progress.completed[s.id]).length

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <motion.h1
          className="font-display flex-1 text-3xl text-sky-900 drop-shadow-[0_2px_0_white] sm:text-4xl"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
        >
          {progress.settings.childName ? `${progress.settings.childName}'s Adventure` : "Floppy's Adventure"}
        </motion.h1>
        <Bouncy onClick={onStickers} aria-label="Sticker book" className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white text-3xl shadow-lg">
          📒
          {progress.stickers.length > 0 && (
            <motion.span
              key={progress.stickers.length}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="font-display absolute -right-2 -top-2 grid h-7 min-w-7 place-items-center rounded-full bg-pink-500 px-1 text-sm text-white"
            >
              {progress.stickers.length}
            </motion.span>
          )}
        </Bouncy>
        <Bouncy onClick={onParent} aria-label="Grown-ups" className="grid h-14 w-14 place-items-center rounded-2xl bg-white/70 text-2xl shadow">
          👪
        </Bouncy>
      </header>

      <div className="relative mx-auto mt-4 w-full max-w-[420px]" style={{ height }}>
        <svg viewBox={`0 0 360 ${height}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <path d={path} stroke="#fef3c7" strokeWidth="34" fill="none" strokeLinecap="round" />
          <motion.path
            d={path}
            stroke="#fbbf24"
            strokeWidth="8"
            strokeDasharray="2 18"
            fill="none"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />
        </svg>
        {STAGES.map((stage, i) => (
          <StageNode
            key={stage.id}
            stage={stage}
            index={i}
            x={(pts[i].x / 360) * 100}
            y={pts[i].y}
            unlocked={isUnlocked(stage.id, progress)}
            done={!!progress.completed[stage.id]}
            isCurrent={stage.id === current && !progress.completed[stage.id]}
            stars={stageStarTotal(progress.stars, stage.id)}
            onOpen={() => onStage(stage.id)}
          />
        ))}
        {/* Floppy waits beside the current stage */}
        <motion.div
          className="pointer-events-none absolute z-20"
          initial={false}
          animate={{
            left: `calc(${(pts[current - 1].x / 360) * 100}% + ${pts[current - 1].x > 180 ? -150 : 60}px)`,
            top: pts[current - 1].y - 70,
          }}
          transition={{ type: 'spring', stiffness: 60, damping: 14 }}
        >
          <Floppy mood={doneCount === STAGES.length ? 'celebrate' : 'idle'} size={90} />
        </motion.div>
      </div>
    </div>
  )
}

function StageNode({
  stage,
  index,
  x,
  y,
  unlocked,
  done,
  isCurrent,
  stars,
  onOpen,
}: {
  stage: Stage
  index: number
  x: number
  y: number
  unlocked: boolean
  done: boolean
  isCurrent: boolean
  stars: number
  onOpen: () => void
}) {
  const shake = useAnimationControls()
  const tap = () => {
    if (unlocked) {
      sfx.whoosh()
      onOpen()
    } else {
      sfx.wrong()
      void shake.start({ x: [0, -10, 10, -8, 8, 0], transition: { duration: 0.45 } })
      void say(LINES.locked)
    }
  }
  return (
    <motion.div
      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
      style={{ left: `${x}%`, top: y }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3 + index * 0.18, type: 'spring', stiffness: 260, damping: 14 }}
    >
      <motion.div animate={shake}>
        <motion.button
          onClick={tap}
          aria-label={`Stage ${stage.id}: ${stage.title}${unlocked ? '' : ' (locked)'}`}
          className="relative grid h-28 w-28 cursor-pointer touch-manipulation place-items-center rounded-full border-[6px] border-white text-5xl shadow-xl"
          style={{ background: unlocked ? `radial-gradient(circle at 35% 30%, #ffffff66, ${stage.colour} 60%)` : '#cbd5e1' }}
          whileHover={{ scale: 1.08, rotate: -4 }}
          whileTap={{ scale: 0.9 }}
          animate={isCurrent ? { scale: [1, 1.08, 1], boxShadow: ['0 0 0 0 #facc15aa', '0 0 0 18px #facc1500', '0 0 0 0 #facc1500'] } : {}}
          transition={isCurrent ? { duration: 1.6, repeat: Infinity } : undefined}
        >
          <span className={unlocked ? '' : 'opacity-40 grayscale'}>{stage.icon}</span>
          {!unlocked && <span className="absolute text-4xl">🔒</span>}
          <span className="font-display absolute -left-1 -top-1 grid h-9 w-9 place-items-center rounded-full bg-white text-lg" style={{ color: stage.colour }}>
            {stage.id}
          </span>
          {done && (
            <motion.span
              className="absolute -right-2 -top-3 text-4xl"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.8 + index * 0.18, type: 'spring' }}
            >
              👑
            </motion.span>
          )}
        </motion.button>
      </motion.div>
      <div className="font-display mt-2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-center text-base text-slate-700 shadow">
        {stage.title}
        {unlocked && (
          <span className="ml-1.5 text-sm text-amber-600">
            ⭐{stars}/{GAMES.length * 3}
          </span>
        )}
      </div>
    </motion.div>
  )
}
