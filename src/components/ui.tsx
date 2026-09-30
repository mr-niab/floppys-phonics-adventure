import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { sfx } from '../lib/audio'
import { say } from '../lib/voice'
import { Floppy, type Mood } from './Floppy'

// --- background --------------------------------------------------------------

export function Sky({ tint = '#7dd3fc' }: { tint?: string }) {
  const clouds = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        top: 6 + i * 11 + Math.random() * 6,
        scale: 0.6 + Math.random() * 0.8,
        duration: 45 + Math.random() * 40,
        delay: -Math.random() * 60,
      })),
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        animate={{ background: `linear-gradient(180deg, ${tint} 0%, #e0f2fe 70%, #f0fdf4 100%)` }}
        transition={{ duration: 1.2 }}
      />
      <motion.div
        className="absolute right-[8%] top-[6%] h-24 w-24 rounded-full bg-yellow-300 shadow-[0_0_80px_30px_rgba(253,224,71,0.6)]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {clouds.map((c, i) => (
        <motion.div
          key={i}
          className="absolute text-white"
          style={{ top: `${c.top}%`, scale: c.scale }}
          initial={{ x: '-30vw' }}
          animate={{ x: '120vw' }}
          transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'linear' }}
        >
          <Cloud />
        </motion.div>
      ))}
      <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ height: '18vh' }}>
        <path d="M0 120 Q 240 40 480 110 T 960 100 T 1440 90 V200 H0Z" fill="#86efac" />
        <path d="M0 160 Q 360 90 720 150 T 1440 140 V200 H0Z" fill="#4ade80" />
      </svg>
    </div>
  )
}

function Cloud() {
  return (
    <svg width="160" height="70" viewBox="0 0 160 70" fill="currentColor" opacity="0.9">
      <circle cx="45" cy="42" r="26" />
      <circle cx="80" cy="30" r="30" />
      <circle cx="115" cy="42" r="24" />
      <rect x="40" y="40" width="80" height="28" rx="14" />
    </svg>
  )
}

// --- buttons -----------------------------------------------------------------

export function Bouncy({ children, className = '', onClick, ...rest }: HTMLMotionProps<'button'>) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.9, y: 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      className={`cursor-pointer touch-manipulation select-none ${className}`}
      onClick={(e) => {
        sfx.tap()
        onClick?.(e)
      }}
      {...rest}
    >
      {children}
    </motion.button>
  )
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Bouncy
      onClick={onClick}
      aria-label="Back"
      className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-3xl shadow-lg ring-4 ring-white/60"
    >
      ⬅️
    </Bouncy>
  )
}

export function SpeakerButton({ lines, size = 'md', label = 'Hear it' }: { lines: string | string[]; size?: 'md' | 'lg'; label?: string }) {
  const big = size === 'lg'
  return (
    <Bouncy
      aria-label={label}
      onClick={() => void say(lines)}
      className={`grid place-items-center rounded-full bg-amber-400 shadow-[0_6px_0_#b45309] ${big ? 'h-24 w-24 text-5xl' : 'h-14 w-14 text-3xl'}`}
    >
      <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.6, repeat: Infinity }}>
        🔊
      </motion.span>
    </Bouncy>
  )
}

// --- game chrome -------------------------------------------------------------

export function GameShell({
  title,
  onBack,
  progress,
  total,
  mood,
  children,
}: {
  title: string
  onBack: () => void
  progress?: number
  total?: number
  mood?: Mood
  children: ReactNode
}) {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="font-display flex-1 truncate text-2xl text-sky-900 drop-shadow-[0_2px_0_white] sm:text-3xl">{title}</h1>
        {total !== undefined && <ProgressDots done={progress ?? 0} total={total} />}
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center">{children}</main>
      {mood && (
        <div className="pointer-events-none fixed bottom-2 left-2 z-10 sm:bottom-4 sm:left-4">
          <Floppy mood={mood} size={110} />
        </div>
      )}
    </div>
  )
}

function ProgressDots({ done, total }: { done: number; total: number }) {
  return (
    <div className="flex gap-1.5 rounded-full bg-white/80 px-3 py-2 shadow">
      {Array.from({ length: total }, (_, i) => (
        <motion.div
          key={i}
          className="h-3.5 w-3.5 rounded-full"
          animate={{
            backgroundColor: i < done ? '#22c55e' : i === done ? '#facc15' : '#e5e7eb',
            scale: i === done ? [1, 1.35, 1] : 1,
          }}
          transition={{ duration: 0.8, repeat: i === done ? Infinity : 0 }}
        />
      ))}
    </div>
  )
}

// --- effects -----------------------------------------------------------------

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function celebrate(power: 'small' | 'big' = 'small') {
  if (reduced()) return
  if (power === 'small') {
    void confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 }, scalar: 1.1 })
    return
  }
  const end = Date.now() + 1800
  const colours = ['#f97316', '#facc15', '#22c55e', '#06b6d4', '#a855f7', '#ec4899']
  ;(function frame() {
    void confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors: colours })
    void confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors: colours })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
  void confetti({ particleCount: 40, spread: 360, startVelocity: 25, shapes: ['star'], colors: ['#facc15', '#fde047'], origin: { y: 0.4 } })
}

/** Ring of particles that bursts out from its parent's centre. */
export function Burst({ show, colour = '#facc15', emoji }: { show: boolean; colour?: string; emoji?: string }) {
  const bits = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), [])
  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          {bits.map((a, i) => (
            <motion.span
              key={i}
              className="absolute text-xl"
              style={{ color: colour }}
              initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
              animate={{ x: Math.cos(a) * 90, y: Math.sin(a) * 90, scale: 1.2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            >
              {emoji ?? '★'}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

export function Stars({ count, size = 'text-3xl', animate = false }: { count: number; size?: string; animate?: boolean }) {
  useEffect(() => {
    if (!animate) return
    const timers = Array.from({ length: count }, (_, i) => setTimeout(sfx.star, 500 + i * 350))
    return () => timers.forEach(clearTimeout)
  }, [animate, count])
  return (
    <div className={`flex gap-1 ${size}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          initial={animate ? { scale: 0, rotate: -180 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: animate ? 0.4 + i * 0.35 : 0, type: 'spring', stiffness: 260, damping: 12 }}
          className={i < count ? '' : 'opacity-25 grayscale'}
        >
          ⭐
        </motion.span>
      ))}
    </div>
  )
}

// --- round complete ------------------------------------------------------------

export function RoundComplete({
  stars,
  sticker,
  onAgain,
  onDone,
}: {
  stars: number
  sticker?: string
  onAgain: () => void
  onDone: () => void
}) {
  const [showSticker, setShowSticker] = useState(false)
  useEffect(() => {
    celebrate('small')
    sfx.fanfare()
    const lines = ['You finished the game!']
    if (sticker) lines.push('You won a new sticker!')
    void say(lines)
    const t = setTimeout(() => setShowSticker(true), 1700)
    return () => clearTimeout(t)
  }, [sticker])

  return (
    <motion.div
      className="fixed inset-0 z-40 grid place-items-center bg-sky-900/40 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="relative flex w-full max-w-md flex-col items-center gap-4 rounded-[2.5rem] bg-white p-8 text-center shadow-2xl"
        initial={{ scale: 0.3, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 14 }}
      >
        <div className="-mt-24">
          <Floppy mood="celebrate" size={140} />
        </div>
        <h2 className="font-display text-4xl text-orange-500">Hooray!</h2>
        <Stars count={stars} size="text-6xl" animate />
        <AnimatePresence>
          {sticker && showSticker && (
            <motion.div
              className="relative flex items-center gap-3 rounded-2xl bg-amber-100 px-5 py-3"
              initial={{ scale: 0, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 12 }}
            >
              <motion.span
                className="text-5xl"
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
              >
                {sticker}
              </motion.span>
              <span className="font-display text-xl text-amber-700">New sticker!</span>
              <Burst show emoji="✨" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-2 flex gap-4">
          <Bouncy onClick={onAgain} className="font-display rounded-full bg-sky-500 px-6 py-3 text-xl text-white shadow-[0_6px_0_#0369a1]">
            🔁 Again
          </Bouncy>
          <Bouncy onClick={onDone} className="font-display rounded-full bg-green-500 px-6 py-3 text-xl text-white shadow-[0_6px_0_#15803d]">
            ✅ Done
          </Bouncy>
        </div>
      </motion.div>
    </motion.div>
  )
}

// --- helpers -------------------------------------------------------------------

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]
