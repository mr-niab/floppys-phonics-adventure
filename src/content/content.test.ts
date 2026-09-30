import { describe, expect, it } from 'vitest'
import { allPhrases } from './phrases'
import { STAGES, partSound, soundFor, wordText } from './stages'

describe('phonics content', () => {
  it('has six stages in order', () => {
    expect(STAGES.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it.each(STAGES.map((s) => [s.title, s] as const))('%s: every word part has a known sound', (_, stage) => {
    for (const word of stage.words) {
      word.parts.forEach((p, i) => {
        if (word.split && i === word.split[1]) return // silent magic e
        expect(soundFor(p), `${wordText(word)} → "${p}"`).toBeDefined()
        expect(partSound(word, i), `${wordText(word)} → "${p}"`).toBeTruthy()
      })
    }
  })

  it.each(STAGES.map((s) => [s.title, s] as const))('%s: has enough material for every game', (_, stage) => {
    expect(stage.sounds.length).toBeGreaterThanOrEqual(8)
    expect(stage.words.length).toBeGreaterThanOrEqual(6) // Picture Match uses 6 rounds
    expect(stage.story.pages.length).toBeGreaterThanOrEqual(3)
    expect(stage.sounds.filter((s) => !s.g.includes('-')).length).toBeGreaterThanOrEqual(4) // Magic Trace
    expect(new Set(stage.words.map((w) => w.emoji)).size).toBe(stage.words.length) // pictures must be distinguishable
  })

  it('magic-e words mark an a/i/o/u + e split', () => {
    for (const w of STAGES.flatMap((s) => s.words).filter((w) => w.split)) {
      const [a, e] = w.split!
      expect(w.parts[e]).toBe('e')
      expect('aiou').toContain(w.parts[a])
      expect(partSound(w, e)).toBeUndefined()
    }
  })

  it('never speaks a bare letter name for a sound', () => {
    // A single consonant letter would be read as its name ("tee"), not its sound.
    for (const snd of STAGES.flatMap((s) => s.sounds)) {
      expect(snd.say.length, `${snd.g} says "${snd.say}"`).toBeGreaterThan(1)
    }
  })

  it('collects every spoken phrase without blanks or duplicates', () => {
    const phrases = allPhrases()
    expect(phrases.length).toBeGreaterThan(100)
    expect(new Set(phrases).size).toBe(phrases.length)
    expect(phrases.every((p) => p.trim().length > 0)).toBe(true)
  })
})
