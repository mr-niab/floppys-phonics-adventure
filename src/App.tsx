import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { useEffect, useState, type ComponentType } from 'react'
import { Sky } from './components/ui'
import { LINES } from './content/phrases'
import { stageById } from './content/stages'
import type { GameProps } from './games/common'
import { LearnSounds } from './games/LearnSounds'
import { PictureMatch } from './games/PictureMatch'
import { SoundPop } from './games/SoundPop'
import { StoryTime } from './games/StoryTime'
import { TraceLetter } from './games/TraceLetter'
import { WordBuilder } from './games/WordBuilder'
import { setSfxEnabled } from './lib/audio'
import { useProgress, type GameId } from './lib/store'
import { configureVoice, say, stop } from './lib/voice'
import { Certificate } from './screens/Certificate'
import { Home } from './screens/Home'
import { ParentZone } from './screens/ParentZone'
import { Splash } from './screens/Splash'
import { StageHub } from './screens/StageHub'
import { StickerBook } from './screens/StickerBook'

type Screen =
  | { name: 'splash' }
  | { name: 'home' }
  | { name: 'stage'; stageId: number }
  | { name: 'game'; stageId: number; game: GameId; round: number }
  | { name: 'certificate'; stageId: number }
  | { name: 'stickers' }
  | { name: 'parent' }

const GAME_COMPONENTS: Record<GameId, ComponentType<GameProps>> = {
  learn: LearnSounds,
  trace: TraceLetter,
  pop: SoundPop,
  build: WordBuilder,
  match: PictureMatch,
  story: StoryTime,
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'splash' })
  const settings = useProgress((s) => s.settings)

  useEffect(() => {
    configureVoice({ mode: settings.voiceMode, apiKey: settings.apiKey, voiceId: settings.voiceId, modelId: settings.modelId })
    setSfxEnabled(settings.sfx)
  }, [settings])

  useReadingTimer(screen.name !== 'splash' && screen.name !== 'parent')

  const go = (s: Screen) => {
    stop()
    setScreen(s)
  }

  const stage = 'stageId' in screen ? stageById(screen.stageId) : null
  const key = screen.name === 'game' ? `game-${screen.game}-${screen.round}` : `${screen.name}-${'stageId' in screen ? screen.stageId : ''}`

  let content
  switch (screen.name) {
    case 'splash':
      content = (
        <Splash
          onStart={() => {
            const first = !useProgress.getState().seenWelcome
            useProgress.getState().markWelcome()
            go({ name: 'home' })
            void say(first ? [LINES.welcome, LINES.pickStage] : LINES.pickStage)
          }}
        />
      )
      break
    case 'home':
      content = (
        <Home
          onStage={(stageId) => go({ name: 'stage', stageId })}
          onStickers={() => go({ name: 'stickers' })}
          onParent={() => go({ name: 'parent' })}
        />
      )
      break
    case 'stage':
      content = (
        <StageHub
          stage={stage!}
          onBack={() => go({ name: 'home' })}
          onGame={(game) => go({ name: 'game', stageId: screen.stageId, game, round: 0 })}
          onCertificate={() => go({ name: 'certificate', stageId: screen.stageId })}
        />
      )
      break
    case 'game': {
      const Game = GAME_COMPONENTS[screen.game]
      content = (
        <Game
          stage={stage!}
          onExit={(stageDone) => go(stageDone ? { name: 'certificate', stageId: screen.stageId } : { name: 'stage', stageId: screen.stageId })}
          onAgain={() => go({ ...screen, round: screen.round + 1 })}
        />
      )
      break
    }
    case 'certificate':
      content = <Certificate stage={stage!} onDone={() => go({ name: 'home' })} />
      break
    case 'stickers':
      content = <StickerBook onBack={() => go({ name: 'home' })} />
      break
    case 'parent':
      content = <ParentZone onBack={() => go({ name: 'home' })} />
      break
  }

  return (
    <MotionConfig reducedMotion="user">
      <Sky tint={stage ? `${stage.colour}66` : '#7dd3fc'} />
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.94, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.04, y: -20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}

/** Count active reading time (only while the tab is visible). */
function useReadingTimer(active: boolean) {
  useEffect(() => {
    if (!active) return
    const STEP = 15
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') useProgress.getState().addTime(STEP)
    }, STEP * 1000)
    return () => clearInterval(id)
  }, [active])
}
