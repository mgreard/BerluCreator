import { describe, it, expect } from 'vitest'
import { AIGenerationResponseSchema } from './sequence.schema'

describe('AIGenerationResponseSchema', () => {
  it('should successfully validate a properly formed LLM response', () => {
    const validData = {
      summary: 'Découpage du présentateur JT',
      beats: [
        {
          timeMs: 0,
          targetSlot: 'torso',
          action: 'pose_neutre',
          suggestedTag: 'neutral'
        },
        {
          timeMs: 1500,
          targetSlot: 'mouth',
          action: 'parole_a',
          suggestedTag: 'talk_a',
          reasoning: 'Début du discours'
        }
      ]
    }

    const parsed = AIGenerationResponseSchema.parse(validData)
    expect(parsed.beats).toHaveLength(2)
    expect(parsed.beats[0].targetSlot).toBe('torso')
  })

  it('should reject invalid categories or negative timestamps', () => {
    const invalidData = {
      summary: 'Test',
      beats: [
        {
          timeMs: -100,
          targetSlot: 'invalid_category_xyz',
          action: 'pose'
        }
      ]
    }

    expect(() => AIGenerationResponseSchema.parse(invalidData)).toThrow()
  })
})
