// Phonics content for Floppy's Phonics Adventure.
//
// Stages follow the usual UK synthetic-phonics progression (the same order the
// Oxford Reading Tree phonics books and Letters and Sounds use). All words and
// stories here are original.
//
// `say` is what the voice speaks for a sound on its own. Text-to-speech can't
// produce "pure" phonemes, so these are the closest clean spellings: stretchy
// sounds are stretched (sss, mmm) and bouncy sounds get the lightest possible
// vowel (tuh). Tweak them here and re-run `npm run voice:generate`.

export interface Sound {
  /** Grapheme as shown to the child, e.g. "sh" or "a-e" */
  g: string
  /** Text spoken for the sound on its own */
  say: string
  /** Example word, spoken after the sound ("sss… as in sun") */
  word: string
  emoji: string
}

export interface Word {
  /** Graphemes that join to spell the word, e.g. ["sh","i","p"] */
  parts: string[]
  emoji: string
  /** Indices of a split digraph (magic e), e.g. cake → [1, 3] */
  split?: [number, number]
}

export interface StoryPage {
  text: string
  scene: string
}

export interface Story {
  title: string
  cover: string
  pages: StoryPage[]
}

export interface Stage {
  id: number
  title: string
  subtitle: string
  colour: string
  icon: string
  sounds: Sound[]
  words: Word[]
  story: Story
}

const s = (g: string, say: string, word: string, emoji: string): Sound => ({ g, say, word, emoji })
const w = (parts: string, emoji: string, split?: [number, number]): Word => ({
  parts: parts.split('.'),
  emoji,
  split,
})

export const STAGES: Stage[] = [
  {
    id: 1,
    title: 'First Sounds',
    subtitle: 's a t p i n m d',
    colour: '#f97316',
    icon: '🌱',
    sounds: [
      s('s', 'sss', 'sun', '☀️'),
      s('a', 'ah', 'apple', '🍎'),
      s('t', 'tuh', 'tiger', '🐯'),
      s('p', 'puh', 'pig', '🐷'),
      s('i', 'ih', 'insect', '🐞'),
      s('n', 'nnn', 'nest', '🪺'),
      s('m', 'mmm', 'moon', '🌙'),
      s('d', 'duh', 'duck', '🦆'),
    ],
    words: [
      w('a.n.t', '🐜'),
      w('m.a.p', '🗺️'),
      w('p.i.n', '📌'),
      w('t.i.n', '🥫'),
      w('p.a.n', '🍳'),
      w('m.a.n', '👨'),
      w('d.a.d', '👨‍👧'),
      w('t.a.p', '🚰'),
      w('n.a.p', '😴'),
      w('s.a.d', '😢'),
    ],
    story: {
      title: 'Pip the Ant',
      cover: '🐜',
      pages: [
        { text: 'Pip is an ant.', scene: '🐜' },
        { text: 'Pip sat on a map.', scene: '🗺️' },
        { text: 'Tap, tap, tap! It is Dad.', scene: '👨' },
        { text: 'Dad and Pip nap.', scene: '😴' },
      ],
    },
  },
  {
    id: 2,
    title: 'Sound Safari',
    subtitle: 'g o c k e u r h b f l',
    colour: '#eab308',
    icon: '🦁',
    sounds: [
      s('g', 'guh', 'goat', '🐐'),
      s('o', 'o, as in on', 'octopus', '🐙'),
      s('c', 'kuh', 'cat', '🐱'),
      s('k', 'kuh', 'kite', '🪁'),
      s('ck', 'kuh', 'duck', '🦆'),
      s('e', 'eh', 'egg', '🥚'),
      s('u', 'uh', 'umbrella', '☂️'),
      s('r', 'rrr', 'rabbit', '🐰'),
      s('h', 'huh', 'hat', '🎩'),
      s('b', 'buh', 'ball', '⚽'),
      s('f', 'fff', 'fish', '🐟'),
      s('l', 'lll', 'lion', '🦁'),
    ],
    words: [
      w('d.o.g', '🐶'),
      w('c.a.t', '🐱'),
      w('h.a.t', '🎩'),
      w('b.e.d', '🛏️'),
      w('b.u.s', '🚌'),
      w('s.u.n', '☀️'),
      w('c.u.p', '☕'),
      w('h.e.n', '🐔'),
      w('p.i.g', '🐷'),
      w('l.o.g', '🪵'),
      w('d.u.ck', '🦆'),
      w('s.o.ck', '🧦'),
      w('b.e.ll', '🔔'),
      w('l.e.g', '🦵'),
    ],
    story: {
      title: 'The Red Cup',
      cover: '☕',
      pages: [
        { text: 'Floppy is a big dog.', scene: '🐶' },
        { text: 'Floppy got a red cup.', scene: '☕' },
        { text: 'The cup fell in the mud!', scene: '💦' },
        { text: 'Mum got the cup back. Good dog!', scene: '🥰' },
      ],
    },
  },
  {
    id: 3,
    title: 'Special Friends',
    subtitle: 'sh ch th ng qu x v w y z',
    colour: '#22c55e',
    icon: '🤝',
    sounds: [
      s('sh', 'shh', 'ship', '🚢'),
      s('ch', 'ch', 'chick', '🐤'),
      s('th', 'th', 'thumb', '👍'),
      s('ng', 'ng', 'ring', '💍'),
      s('qu', 'kw', 'queen', '👸'),
      s('x', 'ks', 'fox', '🦊'),
      s('v', 'vvv', 'van', '🚐'),
      s('w', 'wuh', 'web', '🕸️'),
      s('y', 'yuh', 'yo-yo', '🪀'),
      s('z', 'zzz', 'zebra', '🦓'),
      s('j', 'juh', 'jam', '🍯'),
    ],
    words: [
      w('f.o.x', '🦊'),
      w('b.o.x', '📦'),
      w('w.e.b', '🕸️'),
      w('v.a.n', '🚐'),
      w('j.a.m', '🍯'),
      w('z.i.p', '🤐'),
      w('sh.i.p', '🚢'),
      w('f.i.sh', '🐟'),
      w('ch.i.ck', '🐤'),
      w('ch.i.p', '🍟'),
      w('b.a.th', '🛁'),
      w('r.i.ng', '💍'),
      w('k.i.ng', '🤴'),
      w('sh.e.ll', '🐚'),
    ],
    story: {
      title: 'The Fish in the Box',
      cover: '📦',
      pages: [
        { text: 'Floppy has a big box.', scene: '📦' },
        { text: 'In the box is a fish!', scene: '🐟' },
        { text: 'The fish can swish and splash.', scene: '💦' },
        { text: 'Floppy gets a wet chin!', scene: '🐶' },
      ],
    },
  },
  {
    id: 4,
    title: 'Vowel Teams',
    subtitle: 'ai ee igh oa oo ar or ow oi',
    colour: '#06b6d4',
    icon: '🚀',
    sounds: [
      s('ai', 'ay', 'rain', '🌧️'),
      s('ee', 'ee', 'bee', '🐝'),
      s('igh', 'eye', 'night', '🌙'),
      s('oa', 'oh', 'boat', '⛵'),
      s('oo', 'oo', 'moon', '🌕'),
      s('ar', 'ar', 'star', '⭐'),
      s('or', 'or', 'fork', '🍴'),
      s('ur', 'ur', 'surf', '🏄'),
      s('ow', 'ow', 'cow', '🐄'),
      s('oi', 'oy', 'coin', '🪙'),
      s('ear', 'ear', 'ear', '👂'),
      s('air', 'air', 'chair', '🪑'),
    ],
    words: [
      w('r.ai.n', '🌧️'),
      w('t.ai.l', '🐒'),
      w('b.ee', '🐝'),
      w('f.ee.t', '🦶'),
      w('n.igh.t', '🌃'),
      w('l.igh.t', '💡'),
      w('b.oa.t', '⛵'),
      w('g.oa.t', '🐐'),
      w('m.oo.n', '🌕'),
      w('c.ar', '🚗'),
      w('f.or.k', '🍴'),
      w('c.or.n', '🌽'),
      w('c.ow', '🐄'),
      w('c.oi.n', '🪙'),
      w('ch.air', '🪑'),
    ],
    story: {
      title: 'Moon Night',
      cover: '🌙',
      pages: [
        { text: 'It is night. The moon is up.', scene: '🌕' },
        { text: 'Floppy sees a star.', scene: '⭐' },
        { text: 'An owl hoots in the tree.', scene: '🦉' },
        { text: 'Floppy curls up to sleep.', scene: '😴' },
      ],
    },
  },
  {
    id: 5,
    title: 'Blend Bonanza',
    subtitle: 'fr cr dr fl pl sn sp st',
    colour: '#6366f1',
    icon: '🌈',
    sounds: [
      s('fr', 'frr', 'frog', '🐸'),
      s('cr', 'kr', 'crab', '🦀'),
      s('dr', 'dr', 'drum', '🥁'),
      s('fl', 'fl', 'flag', '🚩'),
      s('pl', 'pl', 'plug', '🔌'),
      s('sn', 'sn', 'snail', '🐌'),
      s('sp', 'sp', 'spoon', '🥄'),
      s('st', 'st', 'star', '⭐'),
      s('tr', 'tr', 'train', '🚂'),
      s('nd', 'nd', 'hand', '✋'),
    ],
    words: [
      w('f.r.o.g', '🐸'),
      w('c.r.a.b', '🦀'),
      w('d.r.u.m', '🥁'),
      w('f.l.a.g', '🚩'),
      w('p.l.u.g', '🔌'),
      w('s.n.ai.l', '🐌'),
      w('s.p.oo.n', '🥄'),
      w('t.e.n.t', '⛺'),
      w('m.i.l.k', '🥛'),
      w('h.a.n.d', '✋'),
      w('t.r.ai.n', '🚂'),
      w('c.l.o.ck', '🕰️'),
      w('s.t.ar', '⭐'),
    ],
    story: {
      title: 'The Frog Pond',
      cover: '🐸',
      pages: [
        { text: 'A green frog sat on a log.', scene: '🐸' },
        { text: 'It went hop, hop, jump!', scene: '🪵' },
        { text: 'Floppy stomps in the pond.', scene: '💦' },
        { text: 'Splash! The frog swims past.', scene: '🏊' },
      ],
    },
  },
  {
    id: 6,
    title: 'Magic E & More',
    subtitle: 'a-e i-e o-e u-e ay ou ir aw',
    colour: '#ec4899',
    icon: '✨',
    sounds: [
      s('a-e', 'ay', 'cake', '🎂'),
      s('i-e', 'eye', 'kite', '🪁'),
      s('o-e', 'oh', 'bone', '🦴'),
      s('u-e', 'you', 'cube', '🧊'),
      s('ay', 'ay', 'play', '🛝'),
      s('ou', 'ow', 'cloud', '☁️'),
      s('ie', 'eye', 'pie', '🥧'),
      s('ea', 'ee', 'leaf', '🍃'),
      s('oy', 'oy', 'boy', '👦'),
      s('ir', 'ur', 'bird', '🐦'),
      s('aw', 'or', 'paw', '🐾'),
      s('wh', 'wuh', 'whale', '🐋'),
    ],
    words: [
      w('c.a.k.e', '🎂', [1, 3]),
      w('s.n.a.k.e', '🐍', [2, 4]),
      w('k.i.t.e', '🪁', [1, 3]),
      w('b.i.k.e', '🚲', [1, 3]),
      w('b.o.n.e', '🦴', [1, 3]),
      w('r.o.s.e', '🌹', [1, 3]),
      w('c.u.b.e', '🧊', [1, 3]),
      w('p.l.ay', '🛝'),
      w('c.l.ou.d', '☁️'),
      w('p.ie', '🥧'),
      w('l.ea.f', '🍃'),
      w('b.oy', '👦'),
      w('b.ir.d', '🐦'),
      w('p.aw', '🐾'),
    ],
    story: {
      title: 'Kite Day',
      cover: '🪁',
      pages: [
        { text: 'It is a fine day to play.', scene: '☀️' },
        { text: 'Floppy and the boy fly a kite.', scene: '🪁' },
        { text: 'The wind takes it up high in the sky.', scene: '💨' },
        { text: 'The kite glides like a bird.', scene: '🐦' },
      ],
    },
  },
]

/** Common "tricky" words that can't be sounded out. Glow purple in stories. */
export const TRICKY_WORDS = new Set([
  'the', 'a', 'to', 'i', 'no', 'go', 'into', 'he', 'she', 'we', 'me', 'be',
  'was', 'you', 'they', 'my', 'by', 'all', 'are', 'said', 'have', 'like',
  'so', 'do', 'some', 'come', 'were', 'there', 'one', 'when', 'out', 'what',
  'is', 'his', 'has', 'of', 'her', 'good',
])

export const wordText = (word: Word) => word.parts.join('')

export const stageById = (id: number) => STAGES.find((st) => st.id === id)!

/** The sound a word part makes, honouring magic-e split digraphs. */
export function partSound(word: Word, index: number): string | undefined {
  if (word.split) {
    const [a, e] = word.split
    if (index === e) return undefined // the magic e itself is silent
    if (index === a) return STAGES.flatMap((st) => st.sounds).find((x) => x.g === `${word.parts[a]}-e`)?.say
  }
  return soundFor(word.parts[index])?.say
}

const ALL_SOUNDS = STAGES.flatMap((st) => st.sounds)

/** Letters that aren't taught as their own card but appear inside words. */
const EXTRA_SOUNDS: Sound[] = [
  s('ll', 'lll', 'bell', '🔔'),
  s('ss', 'sss', 'dress', '👗'),
  s('ff', 'fff', 'cliff', '🏔️'),
]

export function soundFor(g: string): Sound | undefined {
  return ALL_SOUNDS.find((x) => x.g === g) ?? EXTRA_SOUNDS.find((x) => x.g === g)
}
