# 🐕 Floppy's Phonics Adventure – V2

A playful phonics app for early readers (roughly ages 3–6). Floppy the dog guides your child through six adventures that follow the usual UK synthetic-phonics order (the same progression as the Oxford Reading Tree phonics stages and Letters and Sounds), with a natural ElevenLabs voice and lots of animation.

## What's inside

**Six stages** on an animated adventure map. Finishing a stage unlocks the next.

| # | Stage | Sounds |
|---|-------|--------|
| 1 | First Sounds | s a t p i n m d |
| 2 | Sound Safari | g o c k ck e u r h b f l |
| 3 | Special Friends | sh ch th ng qu x v w y z j |
| 4 | Vowel Teams | ai ee igh oa oo ar or ur ow oi ear air |
| 5 | Blend Bonanza | fr cr dr fl pl sn sp st tr nd |
| 6 | Magic E & More | a‑e i‑e o‑e u‑e ay ou ie ea oy ir aw wh |

**Six games per stage**

- 🃏 **Sound Cards** – flip 3D cards to meet each sound ("sss… as in sun").
- ✏️ **Magic Trace** – trace a big letter with a rainbow sparkle brush. It checks the letter was actually covered.
- 🎈 **Balloon Pop** – hear a sound, pop the balloon that shows it.
- 🚂 **Word Train** – tap sounds in order to fill the carriages. Floppy then blends the word sound by sound and the train chugs off. Magic-e words get a sparkly arc joining the split vowel.
- 🖼️ **Picture Match** – read a word with UK-style sound buttons (dots and dashes), then pick the picture.
- 📖 **Story Time** – original decodable stories. Words light up karaoke-style as Floppy reads, you can tap any word to hear it, and tricky words glow purple.

**Rewards**: 1–3 stars per game, 36 collectable stickers, confetti, and a printable certificate for every stage.

**Grown-ups area** (behind a times-table question):

- Reading time for today and the last 7 days
- Progress for each stage
- "Worth practising": the sounds and words your child most often gets wrong first time
- Voice settings, sound effects, unlock all stages, reset

Everything is stored on the device (localStorage). There's no account and no tracking.

## Floppy's voice (ElevenLabs)

Each line Floppy says is resolved in this order:

1. **Pre-recorded clips** made with ElevenLabs at build time (`public/audio`). These are instant, work offline and cost nothing at runtime. They include word timings for the story highlighting.
2. **Live ElevenLabs**, if a parent pastes an API key in the Grown-ups area. Clips are cached on the device, so each line is only paid for once.
3. **The device's built-in voice** as a fallback.

The default voice is **Juliet**, a warm British storyteller (`QJksobp1edMNvmwcG5lm`). You can change it with `ELEVENLABS_VOICE_ID` or in the Grown-ups area.

### Recording the voice

```bash
ELEVENLABS_API_KEY=sk_... npm run voice:generate            # records only new or changed lines
ELEVENLABS_API_KEY=sk_... npm run voice:generate -- --force # re-record everything
npm run voice:generate -- --dry-run                         # list what would be recorded
```

The full script is about 330 short lines (~4,600 characters), well inside the ElevenLabs free tier. You can commit `public/audio/`, or let the deploy workflow record it (see below).

### Tweaking pronunciation

Text-to-speech can't make "pure" phonics sounds, so each sound has a `say` spelling in `src/content/stages.ts`. Stretchy sounds are stretched (`sss`, `mmm`) and bouncy ones get the lightest vowel (`tuh`). If one sounds off, change its `say` and re-run `voice:generate`. Only that clip is re-recorded.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # content + timing tests
npm run build      # production build in dist/
```

Stack: React 18, TypeScript, Vite, Tailwind CSS 4, Framer Motion (all animation, including the SVG Floppy), zustand (progress), canvas-confetti, and Web Audio (synthesised sound effects, so there are no audio assets to ship).

```
src/
  content/   stages, words, stories, and every spoken phrase
  games/     the six games
  screens/   splash, map, stage hub, certificate, stickers, grown-ups
  components/ Floppy mascot + shared animated UI
  lib/       voice (ElevenLabs + fallbacks), audio/sfx, progress store
scripts/generate-audio.ts   ElevenLabs pre-recording
```

## Deploying (GitHub Pages)

`.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.

1. **Settings → Pages → Source: GitHub Actions** (V1 served `index.html` straight from the branch; V2 needs a build step).
2. Optional: add an `ELEVENLABS_API_KEY` repository secret (and optionally an `ELEVENLABS_VOICE_ID` variable) so the workflow pre-records the voice. Clips are cached between runs, so only changed lines are re-recorded.

Live site: https://mr-niab.github.io/floppys-phonics-adventure

## Notes

- Floppy here is an original illustration, and all words and stories are original. The app follows the ORT/Letters and Sounds *order* but reproduces no book content.
- Animations respect the device's "reduce motion" setting.
