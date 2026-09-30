import { motion, type TargetAndTransition } from 'framer-motion'
import { useVoiceState } from '../lib/voice'

export type Mood = 'idle' | 'happy' | 'thinking' | 'oops' | 'celebrate'

const BODY = '#f6e0b5'
const BODY_DARK = '#e8c890'
const EAR = '#9a5b2e'
const PATCH = '#b8743c'
const INK = '#3b2314'

const origin = (x: string, y: string) => ({ transformBox: 'fill-box' as const, transformOrigin: `${x} ${y}` })

const bodyMotion: Record<Mood, TargetAndTransition> = {
  idle: { y: [0, -4, 0], rotate: 0, transition: { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } },
  happy: { y: [0, -14, 0], rotate: 0, transition: { duration: 0.5, repeat: 2, ease: 'easeOut' } },
  thinking: { y: 0, rotate: -6, transition: { type: 'spring', stiffness: 120, damping: 8 } },
  oops: { y: 0, rotate: [0, -5, 5, -3, 0], transition: { duration: 0.6 } },
  celebrate: {
    y: [0, -46, 0, -30, 0],
    rotate: [0, -8, 8, -4, 0],
    transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.4 },
  },
}

/**
 * Floppy the dog – the app's guide. Mood drives the pose; the mouth moves
 * automatically whenever the voice is speaking.
 */
export function Floppy({ mood = 'idle', size = 160, className = '' }: { mood?: Mood; size?: number; className?: string }) {
  const speaking = useVoiceState((s) => s.speaking)
  const wagFast = mood === 'happy' || mood === 'celebrate'
  const earDroop = mood === 'oops' ? 18 : mood === 'thinking' ? 8 : 0
  const earPerk = mood === 'happy' || mood === 'celebrate' ? -14 : 0

  return (
    <motion.div
      className={`relative select-none ${className}`}
      style={{ width: size, height: size * 1.1 }}
      animate={bodyMotion[mood]}
      aria-hidden
    >
      <svg viewBox="0 0 200 220" width="100%" height="100%" style={{ overflow: 'visible' }}>
        {/* shadow */}
        <motion.ellipse
          cx="100"
          cy="214"
          rx="62"
          ry="7"
          fill="rgba(0,0,0,0.15)"
          style={origin('50%', '50%')}
          animate={{ scaleX: mood === 'celebrate' ? [1, 0.65, 1] : 1 }}
          transition={{ duration: 1.1, repeat: mood === 'celebrate' ? Infinity : 0, repeatDelay: 0.4 }}
        />

        {/* tail */}
        <motion.path
          d="M150 168 C 175 160, 182 140, 176 124"
          stroke={BODY_DARK}
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          style={origin('0%', '100%')}
          animate={{ rotate: wagFast ? [-25, 30] : [-10, 15] }}
          transition={{ duration: wagFast ? 0.18 : 0.5, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />

        {/* body */}
        <ellipse cx="100" cy="172" rx="56" ry="42" fill={BODY} />
        <ellipse cx="100" cy="182" rx="32" ry="26" fill="#fff6e4" />
        <ellipse cx="128" cy="160" rx="16" ry="12" fill={PATCH} opacity="0.85" />

        {/* paws */}
        <motion.g animate={mood === 'happy' ? { y: [0, -6, 0] } : { y: 0 }} transition={{ duration: 0.25, repeat: 3 }}>
          <ellipse cx="74" cy="208" rx="17" ry="10" fill={BODY} stroke={BODY_DARK} strokeWidth="2" />
          <ellipse cx="126" cy="208" rx="17" ry="10" fill={BODY} stroke={BODY_DARK} strokeWidth="2" />
          <path d="M68 206 v5 M74 205 v6 M80 206 v5 M120 206 v5 M126 205 v6 M132 206 v5" stroke={BODY_DARK} strokeWidth="2" strokeLinecap="round" />
        </motion.g>

        {/* collar */}
        <path d="M58 128 Q100 150 142 128" stroke="#ef4444" strokeWidth="10" fill="none" strokeLinecap="round" />
        <motion.g
          style={origin('50%', '0%')}
          animate={{ rotate: [-12, 12] }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        >
          <circle cx="100" cy="148" r="8" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <text x="100" y="151.5" textAnchor="middle" fontSize="9" fontWeight="700" fill="#92400e">F</text>
        </motion.g>

        {/* head group tilts when thinking */}
        <motion.g
          style={origin('50%', '80%')}
          animate={{ rotate: mood === 'thinking' ? 12 : 0 }}
          transition={{ type: 'spring', stiffness: 150, damping: 10 }}
        >
          {/* left ear */}
          <motion.path
            d="M52 50 C 22 52, 14 100, 30 126 C 40 138, 58 124, 60 100 Z"
            fill={EAR}
            style={origin('80%', '0%')}
            animate={{ rotate: [earDroop + earPerk, earDroop + earPerk + 6, earDroop + earPerk] }}
            transition={{ duration: wagFast ? 0.35 : 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* right ear */}
          <motion.path
            d="M148 50 C 178 52, 186 100, 170 126 C 160 138, 142 124, 140 100 Z"
            fill={EAR}
            style={origin('20%', '0%')}
            animate={{ rotate: [-(earDroop + earPerk), -(earDroop + earPerk) - 6, -(earDroop + earPerk)] }}
            transition={{ duration: wagFast ? 0.35 : 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />

          {/* head */}
          <ellipse cx="100" cy="86" rx="56" ry="52" fill={BODY} />
          <path d="M112 40 C 140 38, 152 64, 146 86 C 134 80, 118 70, 112 40 Z" fill={PATCH} opacity="0.9" />
          <ellipse cx="100" cy="112" rx="30" ry="22" fill="#fff6e4" />

          {/* cheeks */}
          <motion.circle cx="62" cy="104" r="8" fill="#fda4af" animate={{ opacity: mood === 'happy' || mood === 'celebrate' ? 0.9 : 0.45 }} />
          <motion.circle cx="138" cy="104" r="8" fill="#fda4af" animate={{ opacity: mood === 'happy' || mood === 'celebrate' ? 0.9 : 0.45 }} />

          {/* eyes */}
          <Eye cx={78} cy={82} mood={mood} />
          <Eye cx={122} cy={82} mood={mood} />

          {/* brows */}
          <motion.path
            d="M66 64 Q78 58 88 64"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            animate={{ y: mood === 'thinking' ? -4 : mood === 'oops' ? 2 : 0, rotate: mood === 'oops' ? -10 : 0 }}
          />
          <motion.path
            d="M112 64 Q122 58 134 64"
            stroke={INK}
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            animate={{ y: mood === 'thinking' ? -8 : mood === 'oops' ? 2 : 0, rotate: mood === 'oops' ? 10 : 0 }}
          />

          {/* nose */}
          <ellipse cx="100" cy="102" rx="11" ry="8" fill={INK} />
          <ellipse cx="96" cy="99" rx="3.5" ry="2" fill="#fff" opacity="0.6" />

          {/* mouth */}
          <Mouth speaking={speaking} mood={mood} />
        </motion.g>
      </svg>
    </motion.div>
  )
}

function Eye({ cx, cy, mood }: { cx: number; cy: number; mood: Mood }) {
  if (mood === 'celebrate') {
    // happy closed eyes ^ ^
    return <path d={`M${cx - 9} ${cy + 3} Q${cx} ${cy - 9} ${cx + 9} ${cy + 3}`} stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />
  }
  return (
    <motion.g
      style={origin('50%', '50%')}
      animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
      transition={{ duration: 4, times: [0, 0.9, 0.93, 0.96, 1], repeat: Infinity, delay: cx / 100 }}
    >
      <ellipse cx={cx} cy={cy} rx="11" ry="13" fill="#fff" />
      <motion.g animate={{ x: mood === 'thinking' ? 3 : 0, y: mood === 'thinking' ? -4 : 0 }}>
        <circle cx={cx} cy={cy + 2} r="7.5" fill={INK} />
        <circle cx={cx + 2.5} cy={cy - 1} r="2.6" fill="#fff" />
      </motion.g>
    </motion.g>
  )
}

function Mouth({ speaking, mood }: { speaking: boolean; mood: Mood }) {
  if (speaking) {
    return (
      <motion.ellipse
        cx="100"
        cy="120"
        rx="9"
        ry="8"
        fill="#7f1d1d"
        style={origin('50%', '0%')}
        animate={{ scaleY: [0.35, 1, 0.5, 0.9, 0.35] }}
        transition={{ duration: 0.45, repeat: Infinity }}
      />
    )
  }
  if (mood === 'oops') {
    return <path d="M88 124 Q100 116 112 124" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
  }
  const grin = mood === 'happy' || mood === 'celebrate'
  return (
    <g>
      <path d="M100 110 v6 M100 116 Q90 126 82 118 M100 116 Q110 126 118 118" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      {grin && (
        <motion.path
          d="M92 121 Q100 142 108 121 Z"
          fill="#fb7185"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: [1, 1.15, 1] }}
          style={origin('50%', '0%')}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </g>
  )
}
