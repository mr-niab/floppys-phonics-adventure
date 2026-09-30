import { motion, useAnimationControls } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bouncy, Burst, GameShell, celebrate, shuffle } from '../components/ui'
import { LINES, soundLine } from '../content/phrases'
import { sfx } from '../lib/audio'
import { say } from '../lib/voice'
import { useFinish, useMood, useStopOnUnmount, wait, type GameProps } from './common'

const ROUNDS = 4
const SIZE = 480 // canvas backing size (CSS scales it)
const FONT = '"Andika", "Comic Sans MS", system-ui, sans-serif'

/** Trace over a big dotted letter. Checks how much of the letter was covered. */
export function TraceLetter({ stage, onExit, onAgain }: GameProps) {
  const sounds = useMemo(() => shuffle(stage.sounds.filter((s) => !s.g.includes('-'))).slice(0, ROUNDS), [stage.sounds])
  const [round, setRound] = useState(0)
  const [done, setDone] = useState(false)
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([])
  const canvas = useRef<HTMLCanvasElement>(null)
  const mask = useRef<HTMLCanvasElement | null>(null)
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)
  const hue = useRef(0)
  const board = useAnimationControls()
  const { mood, react } = useMood()
  const { finish, overlay } = useFinish(stage.id, 'trace', { onExit, onAgain })
  useStopOnUnmount()

  const snd = sounds[round]
  const fontSize = snd.g.length >= 3 ? 170 : snd.g.length === 2 ? 230 : 330

  const drawGuide = useCallback(() => {
    const c = canvas.current!
    const ctx = c.getContext('2d')!
    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.font = `${fontSize}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(snd.g, SIZE / 2, SIZE / 2)
    ctx.setLineDash([6, 10])
    ctx.lineWidth = 3
    ctx.strokeStyle = '#94a3b8'
    ctx.strokeText(snd.g, SIZE / 2, SIZE / 2)
    ctx.setLineDash([])
    // Hidden mask used for scoring.
    const m = document.createElement('canvas')
    m.width = m.height = SIZE
    const mctx = m.getContext('2d')!
    mctx.font = ctx.font
    mctx.textAlign = 'center'
    mctx.textBaseline = 'middle'
    mctx.fillText(snd.g, SIZE / 2, SIZE / 2)
    mask.current = m
  }, [snd, fontSize])

  useEffect(() => {
    setDone(false)
    void board.start({ scale: [0.5, 1], rotate: [-8, 0], opacity: [0, 1], transition: { type: 'spring', stiffness: 180, damping: 14 } })
    // Wait for the web font so the guide uses Andika's child-friendly shapes.
    void document.fonts.load(`${fontSize}px Andika`).finally(drawGuide)
    void say(round === 0 ? [LINES.traceIntro, soundLine(snd)] : soundLine(snd))
  }, [round, snd, drawGuide, fontSize, board])

  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * SIZE, y: ((e.clientY - r.top) / r.height) * SIZE, cx: e.clientX - r.left, cy: e.clientY - r.top }
  }

  const stroke = (e: React.PointerEvent) => {
    if (!drawing.current || done) return
    const p = point(e)
    const ctx = canvas.current!.getContext('2d')!
    hue.current = (hue.current + 4) % 360
    ctx.strokeStyle = `hsl(${hue.current} 90% 55%)`
    ctx.lineWidth = fontSize * 0.13
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const from = last.current ?? p
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    if (Math.random() < 0.25) {
      const id = Math.random()
      setSparkles((s) => [...s.slice(-14), { id, x: p.cx, y: p.cy }])
    }
  }

  const check = async () => {
    drawing.current = false
    last.current = null
    if (done || !mask.current) return
    const ink = canvas.current!.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data
    const m = mask.current.getContext('2d')!.getImageData(0, 0, SIZE, SIZE).data
    let letter = 0
    let covered = 0
    let outside = 0
    for (let i = 0; i < m.length; i += 16) {
      // Guide pixels are grey (r≈g≈b); rainbow ink is saturated.
      const inked = Math.max(ink[i], ink[i + 1], ink[i + 2]) - Math.min(ink[i], ink[i + 1], ink[i + 2]) > 60
      if (m[i + 3] > 128) {
        letter++
        if (inked) covered++
      } else if (inked) outside++
    }
    // Mostly covered, and not just scribbled over the whole board.
    if (letter && covered / letter > 0.55 && outside < covered * 4) {
      setDone(true)
      sfx.correct()
      react('happy', 2000)
      celebrate('small')
      await say([LINES.traceDone, soundLine(snd)])
      await wait(400)
      if (round + 1 >= ROUNDS) finish(3)
      else setRound(round + 1)
    }
  }

  return (
    <GameShell title="Magic Trace" onBack={() => onExit()} progress={round} total={ROUNDS} mood={mood}>
      <div className="flex items-center gap-3">
        <span className="text-5xl">{snd.emoji}</span>
        <Bouncy onClick={() => void say(soundLine(snd))} className="font-display rounded-full bg-amber-400 px-4 py-2 text-xl text-amber-900 shadow-[0_5px_0_#b45309]">
          🔊 {snd.word}
        </Bouncy>
      </div>
      {/* One canvas for every round (re-keying it would draw the guide on the old one). */}
      <motion.div className="relative mt-4 aspect-square w-[min(88vw,60vh)]" animate={board}>
        <motion.div
          className="relative h-full w-full rounded-[2rem] border-8 border-white bg-white shadow-2xl"
          animate={{ scale: done ? [1, 1.06, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          <canvas
            ref={canvas}
            width={SIZE}
            height={SIZE}
            className="h-full w-full touch-none rounded-3xl"
            onPointerDown={(e) => {
              ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
              drawing.current = true
              last.current = null
              stroke(e)
            }}
            onPointerMove={stroke}
            onPointerUp={() => void check()}
            onPointerCancel={() => void check()}
          />
          {sparkles.map((s) => (
            <motion.span
              key={s.id}
              className="pointer-events-none absolute text-xl"
              style={{ left: s.x - 10, top: s.y - 10 }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0, opacity: 0, y: -30, rotate: 90 }}
              transition={{ duration: 0.8 }}
            >
              ✨
            </motion.span>
          ))}
          <Burst show={done} emoji="⭐" />
        </motion.div>
      </motion.div>
      <Bouncy
        onClick={() => {
          sfx.whoosh()
          drawGuide()
        }}
        className="font-display mt-4 rounded-full bg-white/85 px-5 py-2 text-lg text-sky-800 shadow"
      >
        🧽 Wipe
      </Bouncy>
      {overlay}
    </GameShell>
  )
}
