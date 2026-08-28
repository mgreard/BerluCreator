import { describe, expect, it } from 'vitest'
import { parseSpriteMetadata } from './demo-asset-seeder'

describe('default sprite metadata', () => {
  it.each([
    ['background/background1.png', 'background'],
    ['torso/Torse.png', 'body'],
    ['head/smile_head.png', 'head'],
    ['mouth/mouth_smile1.png', 'mouth'],
    ['eyes/hearts_eyes.png', 'eyes'],
    ['props-host/party_hat.png', 'props_host'],
    ['props-set/Item_stop.png', 'props_set'],
    ['desk/desk1.png', 'desk'],
    ['props-desk/Item_vote.png', 'props_desk'],
    ['foreground/pollution_foreground.png', 'foreground']
  ] as const)('maps %s to %s', (path, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/${path}`).category).toBe(expectedCategory)
  })

  it.each([
    ['default_left_arm.png', 'arms_left'],
    ['open_right_arm.png', 'arms_right'],
    ['cross_both_arms.png', 'arms_right']
  ] as const)('maps the renamed arm %s to %s', (fileName, expectedCategory) => {
    expect(parseSpriteMetadata(`/src/assets/sprites/arms/${fileName}`).category).toBe(
      expectedCategory
    )
  })

  it('rejects a folder that is not part of the default sprite structure', () => {
    expect(() =>
      parseSpriteMetadata('/src/assets/sprites/legacy/item.png')
    ).toThrow('Dossier de sprites non reconnu')
  })
})
