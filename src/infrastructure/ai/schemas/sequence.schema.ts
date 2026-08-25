import { z } from 'zod'

export const AssetCategoryEnum = z.enum([
  'backdrop',
  'torso',
  'head',
  'mouth',
  'eyes',
  'arms_left',
  'arms_right',
  'props',
  'overlay'
])

export const AIScriptBeatSchema = z.object({
  timeMs: z.number().nonnegative(),
  targetSlot: AssetCategoryEnum,
  action: z.string().min(1),
  suggestedTag: z.string().optional(),
  reasoning: z.string().optional()
})

export const AIGenerationResponseSchema = z.object({
  summary: z.string(),
  beats: z.array(AIScriptBeatSchema)
})

export type AIScriptBeatValidated = z.infer<typeof AIScriptBeatSchema>
export type AIGenerationResponseValidated = z.infer<typeof AIGenerationResponseSchema>
