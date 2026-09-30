import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BackButton, Bouncy } from '../components/ui'
import { STAGES } from '../content/stages'
import { DEFAULT_MODEL_ID, DEFAULT_VOICE_ID } from '../lib/elevenlabs'
import { GAMES, GAME_INFO, today, useProgress } from '../lib/store'
import { recordedInfo, testVoice, useVoiceState, type VoiceSource } from '../lib/voice'

/** Grown-ups area: a simple gate, then progress and settings. */
export function ParentZone({ onBack }: { onBack: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-3">
        <BackButton onClick={onBack} />
        <h1 className="font-display text-3xl text-sky-900 drop-shadow-[0_2px_0_white]">Grown-ups</h1>
      </header>
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Dashboard />
          </motion.div>
        ) : (
          <motion.div key="gate" exit={{ opacity: 0, scale: 0.9 }}>
            <Gate onPass={() => setOpen(true)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Gate({ onPass }: { onPass: () => void }) {
  const [a] = useState(() => 3 + Math.floor(Math.random() * 7))
  const [b] = useState(() => 3 + Math.floor(Math.random() * 7))
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  return (
    <form
      className="mx-auto mt-16 flex max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-8 text-center shadow-xl"
      onSubmit={(e) => {
        e.preventDefault()
        if (Number(value) === a * b) onPass()
        else {
          setWrong(true)
          setValue('')
        }
      }}
    >
      <p className="text-lg text-slate-600">To continue, please answer:</p>
      <p className="font-display text-4xl text-slate-800">
        {a} × {b} = ?
      </p>
      <motion.input
        inputMode="numeric"
        autoFocus
        value={value}
        onChange={(e) => {
          setValue(e.target.value.replace(/\D/g, ''))
          setWrong(false)
        }}
        animate={wrong ? { x: [0, -8, 8, -4, 4, 0] } : {}}
        className="w-32 rounded-xl border-2 border-slate-300 px-3 py-2 text-center text-2xl outline-none focus:border-sky-500"
        aria-label="Answer"
      />
      <button className="rounded-full bg-sky-600 px-6 py-2 font-semibold text-white">Enter</button>
    </form>
  )
}

function Dashboard() {
  const p = useProgress()
  return (
    <div className="mt-6 flex flex-col gap-5">
      <Card title="Reader">
        <label className="flex flex-col gap-1 text-sm text-slate-600">
          Child's name (shown on the map and certificates)
          <input
            value={p.settings.childName}
            onChange={(e) => p.setSettings({ childName: e.target.value.slice(0, 24) })}
            className="rounded-xl border-2 border-slate-200 px-3 py-2 text-lg text-slate-800 outline-none focus:border-sky-500"
            placeholder="e.g. Alfie"
          />
        </label>
      </Card>
      <ReadingTime daily={p.daily} />
      <StageProgress />
      <SoundsToPractise />
      <VoiceSettings />
      <Card title="Options">
        <Toggle label="Sound effects" checked={p.settings.sfx} onChange={(v) => p.setSettings({ sfx: v })} />
        <Toggle label="Unlock all stages" checked={p.settings.unlockAll} onChange={(v) => p.setSettings({ unlockAll: v })} />
        <button
          className="mt-3 self-start rounded-full border-2 border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
          onClick={() => {
            if (confirm('Reset all stars, stickers and reading time on this device?')) p.reset()
          }}
        >
          Reset progress
        </button>
      </Card>
      <p className="text-center text-xs text-slate-500">All progress is stored on this device only. No account, no tracking.</p>
    </div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-white/95 p-5 shadow-lg">
      <h2 className="font-display text-xl text-slate-800">{title}</h2>
      {children}
    </section>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-slate-700">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-8 w-14 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-slate-300'}`}
      >
        <motion.span layout className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow ${checked ? 'right-1' : 'left-1'}`} />
      </button>
    </label>
  )
}

const fmtMins = (sec: number) => (sec < 60 ? `${Math.round(sec)}s` : `${Math.round(sec / 60)} min`)

function ReadingTime({ daily }: { daily: Record<string, number> }) {
  const days = useMemo(() => {
    const out: { key: string; label: string; sec: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('en-CA')
      out.push({ key, label: i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' }), sec: daily[key] ?? 0 })
    }
    return out
  }, [daily])
  const week = days.reduce((n, d) => n + d.sec, 0)
  const max = Math.max(...days.map((d) => d.sec), 300)
  const [hover, setHover] = useState<string | null>(null)

  return (
    <Card title="Reading time">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Today" value={fmtMins(daily[today()] ?? 0)} />
        <Stat label="Last 7 days" value={fmtMins(week)} />
      </div>
      <div className="relative mt-2 flex h-36 items-end gap-2 border-b border-slate-200" role="img" aria-label="Minutes read per day, last 7 days">
        {days.map((d, i) => (
          <div
            key={d.key}
            className="relative flex h-full flex-1 cursor-default flex-col items-center justify-end"
            onPointerEnter={() => setHover(d.key)}
            onPointerLeave={() => setHover(null)}
          >
            <AnimatePresence>
              {hover === d.key && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -top-7 z-10 whitespace-nowrap rounded-md bg-slate-800 px-2 py-0.5 text-xs text-white"
                >
                  {fmtMins(d.sec)}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              className="w-full max-w-8 rounded-t bg-sky-500"
              style={{ opacity: hover && hover !== d.key ? 0.5 : 1 }}
              initial={{ height: 0 }}
              animate={{ height: `${(d.sec / max) * 100}%` }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {days.map((d) => (
          <span key={d.key} className="flex-1 text-center text-xs text-slate-500">
            {d.label}
          </span>
        ))}
      </div>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="font-display text-3xl text-slate-800">{value}</div>
    </div>
  )
}

function StageProgress() {
  const { stars, completed } = useProgress()
  return (
    <Card title="Stages">
      <ul className="flex flex-col gap-2">
        {STAGES.map((st) => (
          <li key={st.id} className="flex items-center gap-3">
            <span className="text-2xl">{st.icon}</span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-700">
                {st.id}. {st.title}
                {completed[st.id] && <span className="ml-2 text-xs text-green-600">✓ finished {new Date(completed[st.id]).toLocaleDateString('en-GB')}</span>}
              </div>
              <div className="flex gap-1 text-xs text-slate-500">
                {GAMES.map((g) => (
                  <span key={g} title={GAME_INFO[g].name} className={(stars[st.id]?.[g] ?? 0) > 0 ? '' : 'opacity-30 grayscale'}>
                    {GAME_INFO[g].icon}
                    {'★'.repeat(stars[st.id]?.[g] ?? 0)}
                  </span>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function SoundsToPractise() {
  const { soundStats, wordStats } = useProgress()
  const rank = (stats: Record<string, { right: number; wrong: number }>) =>
    Object.entries(stats)
      .filter(([, s]) => s.wrong > 0)
      .map(([k, s]) => ({ k, ...s, rate: s.wrong / (s.right + s.wrong) }))
      .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong)
      .slice(0, 8)
  const sounds = rank(soundStats)
  const words = rank(wordStats)
  return (
    <Card title="Worth practising">
      {sounds.length + words.length === 0 ? (
        <p className="text-slate-500">Nothing yet. Tricky sounds and words will show up here as your child plays.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {[...sounds, ...words].map((x) => (
            <span key={x.k} className="font-letters rounded-full bg-amber-100 px-3 py-1 text-lg text-amber-900">
              {x.k}
              <span className="ml-1.5 font-sans text-xs text-amber-700">
                {x.right}/{x.right + x.wrong} first try
              </span>
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

function VoiceSettings() {
  const { settings, setSettings } = useProgress()
  const [recorded, setRecorded] = useState<{ count: number; voiceId?: string } | null>(null)
  const [result, setResult] = useState<VoiceSource | null>(null)
  const [testing, setTesting] = useState(false)
  const error = useVoiceState((s) => s.error)
  useEffect(() => {
    void recordedInfo().then(setRecorded)
  }, [])

  const label: Record<VoiceSource, string> = {
    recorded: '✅ Pre-recorded ElevenLabs voice',
    elevenlabs: '✅ Live ElevenLabs voice',
    browser: "ℹ️ Device's built-in voice",
  }

  return (
    <Card title="Floppy's voice (ElevenLabs)">
      <p className="text-sm text-slate-600">
        {recorded && recorded.count > 0
          ? `${recorded.count} ${recorded.count === 1 ? 'line was' : 'lines were'} pre-recorded with ElevenLabs when this app was built, so they play instantly and work offline.`
          : 'No pre-recorded voice in this build yet. Add an ElevenLabs API key below for a natural voice, or the device voice is used.'}
      </p>
      <Toggle
        label="Use ElevenLabs voice (off = device voice only)"
        checked={settings.voiceMode === 'auto'}
        onChange={(v) => setSettings({ voiceMode: v ? 'auto' : 'browser' })}
      />
      <label className="flex flex-col gap-1 text-sm text-slate-600">
        ElevenLabs API key (optional, for lines that aren't pre-recorded)
        <input
          type="password"
          autoComplete="off"
          value={settings.apiKey}
          onChange={(e) => setSettings({ apiKey: e.target.value.trim() })}
          className="rounded-xl border-2 border-slate-200 px-3 py-2 font-mono text-slate-800 outline-none focus:border-sky-500"
          placeholder="sk_…"
        />
        <span className="text-xs text-slate-500">
          Stored only in this browser. Use a key restricted to text-to-speech with a low character limit. Generated audio is cached on the device, so each line is only paid for once.
        </span>
      </label>
      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer">Advanced</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            Voice ID
            <input
              value={settings.voiceId}
              onChange={(e) => setSettings({ voiceId: e.target.value.trim() || DEFAULT_VOICE_ID })}
              className="rounded-xl border-2 border-slate-200 px-3 py-2 font-mono text-slate-800"
            />
          </label>
          <label className="flex flex-col gap-1">
            Model
            <input
              value={settings.modelId}
              onChange={(e) => setSettings({ modelId: e.target.value.trim() || DEFAULT_MODEL_ID })}
              className="rounded-xl border-2 border-slate-200 px-3 py-2 font-mono text-slate-800"
            />
          </label>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-3">
        <Bouncy
          disabled={testing}
          onClick={async () => {
            setTesting(true)
            useVoiceState.setState({ error: null })
            setResult(await testVoice(`Hello${settings.childName ? ` ${settings.childName}` : ''}! Let's read together.`))
            setTesting(false)
          }}
          className="rounded-full bg-sky-600 px-5 py-2 font-semibold text-white disabled:opacity-60"
        >
          {testing ? 'Speaking…' : '🔊 Test voice'}
        </Bouncy>
        {result && <span className="text-sm text-slate-700">{label[result]}</span>}
      </div>
      {error && <p className="rounded-xl bg-red-50 p-2 text-sm text-red-700">ElevenLabs error: {error}</p>}
    </Card>
  )
}
