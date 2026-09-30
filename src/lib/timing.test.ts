import { describe, expect, it } from 'vitest'
import { clipId, evenTimings, wordTimings, type Alignment } from './timing'

function align(text: string, perChar = 0.1): Alignment {
  const characters = [...text]
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => i * perChar),
    character_end_times_seconds: characters.map((_, i) => (i + 1) * perChar),
  }
}

describe('wordTimings', () => {
  it('turns character alignment into one span per word', () => {
    expect(wordTimings('Pip is an ant.', align('Pip is an ant.'))).toEqual([
      [0, 0.3],
      [0.4, 0.6],
      [0.7, 0.9],
      [1, 1.4],
    ])
  })

  it('falls back to even spacing if the alignment does not match', () => {
    const t = wordTimings('one two three', align('onetwothree'), 3)
    expect(t).toHaveLength(3)
    expect(t[2][1]).toBeCloseTo(3)
  })
})

describe('evenTimings', () => {
  it('covers the whole clip in order', () => {
    const t = evenTimings('a bb ccc', 2)
    expect(t[0][0]).toBe(0)
    expect(t.at(-1)![1]).toBeCloseTo(2)
    for (let i = 1; i < t.length; i++) expect(t[i][0]).toBeGreaterThanOrEqual(t[i - 1][1] - 0.001)
  })
})

describe('clipId', () => {
  it('is stable and distinct', () => {
    expect(clipId('sss')).toBe(clipId('sss'))
    expect(clipId('sss')).not.toBe(clipId('ssss'))
    expect(clipId('hello')).toMatch(/^[0-9a-f]{8}$/)
  })
})
