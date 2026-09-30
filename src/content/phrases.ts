import { STAGES, soundFor, wordText, type Sound } from './stages'

// Everything Floppy says lives here, so `npm run voice:generate` can pre-record
// every line with ElevenLabs. Dynamic prompts are built by chaining short
// clips (e.g. "Can you find" + "sss"), which keeps the clip count small.

export const PRAISE = [
  'Brilliant!',
  'Woof woof! Well done!',
  'You did it!',
  'Super reading!',
  'Amazing!',
  'Great job!',
  'Pawsome!',
  'Fantastic!',
]

export const ENCOURAGE = [
  'Nearly! Try again.',
  'Ooh, not quite. Have another go!',
  "Let's listen again.",
]

export const LINES = {
  welcome: "Hello! I'm Floppy. Let's go on a phonics adventure!",
  pickStage: 'Pick an adventure!',
  locked: 'Finish the last adventure to unlock this one!',
  pickGame: 'What shall we play?',
  learnIntro: 'Tap a card to hear its sound.',
  popIntro: 'Pop the balloon with this sound.',
  findSound: 'Can you find',
  buildIntro: 'Build the word! Tap the sounds in order.',
  blendIt: "Now let's blend it!",
  matchIntro: 'Read the word. Which picture is it?',
  storyIntro: 'Tap the play button and read along with me!',
  traceIntro: 'Trace the letter with your finger.',
  traceDone: 'Beautiful writing!',
  asIn: 'as in',
  roundDone: 'You finished the game!',
  stageDone: 'Hooray! You finished the whole adventure! Here is your certificate!',
  newSticker: 'You won a new sticker!',
  stickerBook: 'Here are all your stickers!',
} as const

export const soundLine = (snd: Sound) => `${snd.say}… as in ${snd.word}`

/** Every distinct line the app can speak. Used by the audio generator. */
export function allPhrases(): string[] {
  const out = new Set<string>([...PRAISE, ...ENCOURAGE, ...Object.values(LINES)])
  for (const stage of STAGES) {
    out.add(stage.title)
    out.add(stage.story.title)
    for (const snd of stage.sounds) {
      out.add(snd.say)
      out.add(soundLine(snd))
      out.add(snd.word)
    }
    for (const word of stage.words) {
      out.add(wordText(word))
      for (const p of word.parts) {
        const snd = soundFor(p)
        if (snd) out.add(snd.say)
      }
    }
    for (const page of stage.story.pages) {
      out.add(page.text)
      for (const token of page.text.split(/\s+/)) out.add(cleanWord(token))
    }
  }
  out.delete('')
  return [...out].sort()
}

export const cleanWord = (token: string) => token.replace(/[^A-Za-z'-]/g, '').toLowerCase()
