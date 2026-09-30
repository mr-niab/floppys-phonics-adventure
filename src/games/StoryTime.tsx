import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Bouncy, GameShell } from '../components/ui'
import { LINES, cleanWord } from '../content/phrases'
import { TRICKY_WORDS } from '../content/stages'
import { sfx } from '../lib/audio'
import { splitWords } from '../lib/timing'
import { preload, say, stop } from '../lib/voice'
import { useFinish, useMood, useStopOnUnmount, type GameProps } from './common'

/** A short read-along book. Words light up as Floppy reads; tap any word to hear it. */
export function StoryTime({ stage, onExit, onAgain }: GameProps) {
  const { story } = stage
  const [page, setPage] = useState(-1) // -1 = cover
  const [dir, setDir] = useState(1)
  const [wordIdx, setWordIdx] = useState(-1)
  const [reading, setReading] = useState(false)
  const [bounce, setBounce] = useState<number | null>(null)
  const { mood, setMood } = useMood()
  const { finish, overlay } = useFinish(stage.id, 'story', { onExit, onAgain })
  useStopOnUnmount()

  useEffect(() => {
    preload(story.pages.map((p) => p.text))
    void say([story.title, LINES.storyIntro])
  }, [story])

  const current = page >= 0 ? story.pages[page] : null
  const words = current ? splitWords(current.text) : []
  const last = page === story.pages.length - 1

  const read = async () => {
    if (!current) return
    setReading(true)
    setMood('happy')
    await say(current.text, { onWord: setWordIdx })
    setReading(false)
    setMood('idle')
  }

  const go = (delta: number) => {
    stop()
    sfx.whoosh()
    setDir(delta)
    setWordIdx(-1)
    setReading(false)
    setPage((p) => p + delta)
  }

  // Auto-read each page as it opens.
  useEffect(() => {
    if (page < 0) return
    const t = setTimeout(() => void read(), 700)
    return () => clearTimeout(t)
  }, [page])

  return (
    <GameShell title={story.title} onBack={() => onExit()} progress={Math.max(page, 0)} total={story.pages.length} mood={mood}>
      <div className="relative w-full max-w-3xl" style={{ perspective: 1600 }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={page}
            custom={dir}
            variants={{
              enter: (d: number) => ({ rotateY: d > 0 ? 90 : -90, opacity: 0 }),
              centre: { rotateY: 0, opacity: 1 },
              exit: (d: number) => ({ rotateY: d > 0 ? -90 : 90, opacity: 0 }),
            }}
            initial="enter"
            animate="centre"
            exit="exit"
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            style={{ transformOrigin: dir > 0 ? 'left center' : 'right center' }}
            className="relative flex min-h-[60vh] flex-col items-center justify-center gap-6 rounded-[2rem] border-8 border-amber-200 bg-[#fffdf5] p-6 shadow-2xl sm:p-10"
          >
            {current ? (
              <>
                <motion.div
                  className="text-8xl sm:text-9xl"
                  animate={{ y: [0, -12, 0], rotate: [0, 3, -3, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {current.scene}
                </motion.div>
                <LayoutGroup id={`page-${page}`}>
                  <p className="font-letters flex flex-wrap justify-center gap-x-3 gap-y-2 text-center text-4xl leading-snug text-slate-800 sm:text-5xl">
                    {words.map((w, i) => {
                      const tricky = TRICKY_WORDS.has(cleanWord(w))
                      return (
                        <motion.button
                          key={i}
                          onClick={() => {
                            if (reading) return
                            setBounce(i)
                            void say(cleanWord(w)).then(() => setBounce(null))
                          }}
                          className={`relative cursor-pointer touch-manipulation rounded-xl px-1.5 ${tricky ? 'text-purple-600' : ''}`}
                          animate={{ y: bounce === i || wordIdx === i ? -8 : 0, scale: wordIdx === i ? 1.08 : 1 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                        >
                          {wordIdx === i && (
                            <motion.span
                              layoutId="karaoke"
                              className="absolute inset-0 -z-10 rounded-xl bg-yellow-200"
                              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                          )}
                          {tricky && (
                            <motion.span
                              className="absolute -right-1 -top-2 text-sm"
                              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.1 }}
                            >
                              ✨
                            </motion.span>
                          )}
                          {w}
                        </motion.button>
                      )
                    })}
                  </p>
                </LayoutGroup>
                <Bouncy
                  onClick={() => void read()}
                  disabled={reading}
                  className="font-display flex items-center gap-2 rounded-full bg-pink-500 px-6 py-3 text-2xl text-white shadow-[0_6px_0_#be185d] disabled:opacity-60"
                >
                  {reading ? '🎶 Reading…' : '▶️ Read to me'}
                </Bouncy>
              </>
            ) : (
              <Cover emoji={story.cover} title={story.title} colour={stage.colour} />
            )}
          </motion.div>
        </AnimatePresence>
        <div className="mt-5 flex items-center justify-between">
          <Bouncy
            onClick={() => go(-1)}
            disabled={page < 0}
            aria-label="Previous page"
            className="grid h-16 w-16 place-items-center rounded-full bg-white text-3xl shadow-lg disabled:invisible"
          >
            ◀️
          </Bouncy>
          <p className="font-display text-sm text-sky-900/70">
            <span className="text-purple-600">✨ Purple words</span> are tricky words
          </p>
          {last ? (
            <Bouncy
              onClick={() => finish(3)}
              className="font-display rounded-full bg-green-500 px-6 py-3 text-xl text-white shadow-[0_6px_0_#15803d]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              The End 🎉
            </Bouncy>
          ) : (
            <Bouncy
              onClick={() => go(1)}
              aria-label="Next page"
              className="grid h-16 w-16 place-items-center rounded-full bg-white text-3xl shadow-lg"
              animate={page < 0 || (!reading && wordIdx === -1 && page >= 0) ? { x: [0, 8, 0] } : { x: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ▶️
            </Bouncy>
          )}
        </div>
      </div>
      {overlay}
    </GameShell>
  )
}

function Cover({ emoji, title, colour }: { emoji: string; title: string; colour: string }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <motion.div
        className="grid h-48 w-48 place-items-center rounded-full text-9xl shadow-inner"
        style={{ background: `${colour}33` }}
        animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        {emoji}
      </motion.div>
      <h2 className="font-display text-5xl" style={{ color: colour }}>
        {title}
      </h2>
      <p className="font-display text-xl text-slate-500">Tap ▶️ to open the book</p>
    </div>
  )
}
