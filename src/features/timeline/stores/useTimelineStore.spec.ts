import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useTimelineStore } from './useTimelineStore'
import type { Keyframe, Sequence } from '@core/types/timeline.types'
import { sequenceRepository } from '@infrastructure/db/repositories/sequence.repository'

vi.mock('@infrastructure/db/repositories/sequence.repository', () => ({
  sequenceRepository: {
    getById: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined)
  }
}))

describe('état initial après reset usine', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('conserve une seule étape vide avec les groupes et pistes de base', () => {
    const store = useTimelineStore()

    expect(store.currentSequence.steps).toHaveLength(1)
    expect(store.currentSequence.groups?.length).toBeGreaterThan(0)
    expect(store.currentSequence.tracks.every((track) => Boolean(track.groupId))).toBe(true)
    expect(
      store.currentSequence.tracks.flatMap((track) => track.keyframes)
        .flatMap((keyframe) => keyframe.sprites)
    ).toEqual([])
  })
})

describe('sélection du périmètre d’édition du studio', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('sélectionne un groupe avec une piste enfant cohérente', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups?.find((candidate) =>
      store.currentSequence.tracks.some((track) => track.groupId === candidate.id)
    )
    expect(group).toBeDefined()

    store.selectGroupForEditing(group!.id)

    expect(store.selectedGroupId).toBe(group!.id)
    expect(store.editScope).toBe('group')
    expect(
      store.currentSequence.tracks.find((track) => track.id === store.selectedTrackId)?.groupId
    ).toBe(group!.id)
  })

  it('synchronise le groupe parent lors de la sélection d’une piste', () => {
    const store = useTimelineStore()
    const track = store.currentSequence.tracks.find((candidate) => candidate.groupId)
    expect(track).toBeDefined()

    store.selectTrackForEditing(track!.id)

    expect(store.selectedTrackId).toBe(track!.id)
    expect(store.selectedGroupId).toBe(track!.groupId)
    expect(store.editScope).toBe('layer')
  })

  it('déplie automatiquement le groupe ciblé par une sélection', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups![0]
    group.collapsed = true

    store.selectGroupForEditing(group.id)

    expect(group.collapsed).toBe(false)
  })

  it('réinitialise ensemble la piste, le groupe et le mode', () => {
    const store = useTimelineStore()
    const track = store.currentSequence.tracks[0]
    store.selectTrackForEditing(track.id)

    store.clearStudioSelection()

    expect(store.selectedTrackId).toBeNull()
    expect(store.selectedGroupId).toBeNull()
    expect(store.selectedKeyframeId).toBeNull()
    expect(store.editScope).toBe('layer')
  })
})

describe('routage des assets vers les groupes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('route automatiquement une catégorie technique uniquement vers son groupe par défaut', () => {
    const store = useTimelineStore()
    const guest = store.addGroup('Invité', undefined, 'emerald', ['head'])
    store.clearStudioSelection(false)

    store.assignAssetToGroup('asset-head-default', 'head', null, 'Tête par défaut')

    const targetTrack = store.currentSequence.tracks.find((track) =>
      track.keyframes.some((keyframe) =>
        keyframe.sprites.some((sprite) => sprite.assetId === 'asset-head-default')
      )
    )
    expect(targetTrack?.groupId).toBe('grp_berlu')
    expect(targetTrack?.groupId).not.toBe(guest.id)
  })

  it('injecte plusieurs catégories techniques dans le groupe explicitement ciblé', () => {
    const store = useTimelineStore()
    const guest = store.addGroup('Invité')

    store.assignAssetToGroup('asset-guest-head', 'head', guest.id, 'Tête invité')
    store.assignAssetToGroup('asset-guest-torso', 'torso', guest.id, 'Torse invité')

    const guestTracks = store.currentSequence.tracks.filter((track) => track.groupId === guest.id)
    expect(guestTracks.map((track) => track.category)).toEqual(expect.arrayContaining(['head', 'torso']))
    expect(guest.allowedCategories).toEqual(expect.arrayContaining(['head', 'torso']))
  })

  it('privilégie le groupe actuellement sélectionné en l’absence de cible explicite', () => {
    const store = useTimelineStore()
    const guest = store.addGroup('Invité')
    store.selectGroupForEditing(guest.id)

    store.assignAssetToGroup('asset-selected-group', 'props_host')

    const targetTrack = store.currentSequence.tracks.find((track) =>
      track.keyframes.some((keyframe) =>
        keyframe.sprites.some((sprite) => sprite.assetId === 'asset-selected-group')
      )
    )
    expect(targetTrack?.groupId).toBe(guest.id)
  })

  it('crée une catégorie personnalisée à la demande puis réutilise son groupe sans doublon', () => {
    const store = useTimelineStore()
    store.clearStudioSelection(false)

    store.assignAssetToGroup('asset-guest-head', 'head', null, 'Tête invité', 'Invité')
    store.clearStudioSelection(false)
    store.assignAssetToGroup('asset-guest-arm', 'arms_left', null, 'Bras invité', ' invite ')

    const guestGroups = store.currentSequence.groups!.filter((group) =>
      group.customCategory?.toLocaleLowerCase('fr').startsWith('invit')
    )
    expect(guestGroups).toHaveLength(1)
    expect(guestGroups[0].allowedCategories).toEqual(expect.arrayContaining(['head', 'arms_left']))
    expect(store.currentSequence.tracks.filter((track) => track.groupId === guestGroups[0].id)).toHaveLength(2)
  })
})

describe('migration des catégories de timeline', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('migre les anciennes catégories et complète les nouvelles pistes', async () => {
    const legacySequence = {
      id: 'seq_legacy',
      projectId: 'proj_default',
      name: 'Ancienne séquence',
      durationMs: 15000,
      fps: 24,
      groups: [
        { id: 'grp_backdrop', name: 'Décor', zIndex: 0 },
        { id: 'grp_character_1', name: 'Personnage', zIndex: 20 },
        { id: 'grp_props', name: 'Props', zIndex: 30 },
        { id: 'grp_overlay', name: 'Overlay', zIndex: 50 }
      ],
      tracks: [
        {
          id: 'backdrop',
          name: 'Décor',
          category: 'backdrop',
          targetSlot: 'backdrop',
          groupId: 'grp_backdrop',
          zIndex: 0,
          muted: false,
          locked: false,
          keyframes: []
        },
        {
          id: 'props_set',
          name: 'Props',
          category: 'props_set',
          targetSlot: 'props_set',
          groupId: 'grp_props',
          zIndex: 30,
          muted: false,
          locked: false,
          keyframes: []
        },
        {
          id: 'overlay',
          name: 'Overlay',
          category: 'overlay',
          targetSlot: 'overlay',
          groupId: 'grp_overlay',
          zIndex: 50,
          muted: false,
          locked: false,
          keyframes: []
        }
      ],
      createdAt: 1,
      updatedAt: 1
    } as unknown as Sequence

    vi.mocked(sequenceRepository.getById).mockResolvedValue(legacySequence)
    const store = useTimelineStore()

    await store.loadSequence('seq_legacy', 'proj_default')

    expect(store.currentSequence.groups?.map((group) => group.id)).toEqual(
      expect.arrayContaining(['grp_background', 'grp_berlu', 'grp_set_props', 'grp_desk', 'grp_desk_items'])
    )
    expect(store.currentSequence.tracks.map((track) => track.category)).toEqual(
      expect.arrayContaining([
        'background',
        'props_host',
        'props_set',
        'desk',
        'props_desk',
        'foreground'
      ])
    )
    expect(sequenceRepository.save).toHaveBeenCalledWith(legacySequence)
  })

  it('convertit les anciens champs de keyframe vers une entrée sprite', async () => {
    const legacySequence = {
      id: 'seq_keyframe_legacy',
      projectId: 'proj_default',
      name: 'Anciennes keyframes',
      durationMs: 15000,
      fps: 24,
      groups: [],
      tracks: [
        {
          id: 'head',
          name: 'Tête',
          category: 'head',
          targetSlot: 'head',
          zIndex: 20,
          muted: false,
          locked: false,
          keyframes: [
            {
              id: 'legacy-kf',
              timeMs: 500,
              assetId: 'asset-head',
              label: 'Sourire',
              transform: { x: 12, scaleX: 1.2 }
            }
          ]
        }
      ],
      createdAt: 1,
      updatedAt: 1
    } as unknown as Sequence

    vi.mocked(sequenceRepository.getById).mockResolvedValue(legacySequence)
    const store = useTimelineStore()
    await store.loadSequence(legacySequence.id, legacySequence.projectId)

    const migratedKeyframe = store.currentSequence.tracks
      .find((track) => track.id === 'head')!
      .keyframes[0]
    expect(migratedKeyframe.sprites).toEqual([
      expect.objectContaining({
        assetId: 'asset-head',
        label: 'Sourire',
        transform: { x: 12, scaleX: 1.2 },
        order: 0
      })
    ])
    expect(migratedKeyframe).not.toHaveProperty('assetId')
    expect(migratedKeyframe.stepId).toBe(store.currentSequence.steps[0]?.id)
    expect(store.currentSequence).not.toHaveProperty('durationMs')
    expect(store.currentSequence).not.toHaveProperty('fps')
    expect(store.currentSequence.steps[0]?.camera).toEqual({
      enabled: false,
      x: 0,
      y: 0,
      width: 1792,
      height: 1024,
      aspectRatio: 'custom'
    })
  })
})

describe('contenu multi-sprites des keyframes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('ajoute plusieurs props au même instant sans remplacer les précédents', () => {
    const store = useTimelineStore()

    const stepId = store.activeStep!.id
    store.addKeyframe('props_host', stepId, 'asset-hat', 'Chapeau')
    store.addKeyframe('props_host', stepId, 'asset-nose', 'Nez')

    const keyframe = store.currentSequence.tracks
      .find((track) => track.id === 'props_host')!
      .keyframes[0]
    expect(keyframe.sprites.map((sprite) => sprite.assetId)).toEqual([
      'asset-hat',
      'asset-nose'
    ])
    expect(keyframe.sprites.map((sprite) => sprite.order)).toEqual([0, 1])
  })

  it('remplace le contenu des catégories singleton au même instant', () => {
    const store = useTimelineStore()

    const stepId = store.activeStep!.id
    store.addKeyframe('head', stepId, 'asset-head-1')
    store.addKeyframe('head', stepId, 'asset-head-2')

    const keyframe = store.currentSequence.tracks.find((track) => track.id === 'head')!
      .keyframes[0]
    expect(keyframe.sprites).toHaveLength(1)
    expect(keyframe.sprites[0].assetId).toBe('asset-head-2')
  })
})

describe('historique des transformations du canvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('annule puis rétablit la transformation complète d’un groupe', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups![0]
    const before = { ...group.transform }
    group.transform = { ...group.transform, x: 120, y: -35, scaleX: 1.5, scaleY: 1.5 }
    const after = { ...group.transform }

    store.recordTransformAction({ kind: 'group', groupId: group.id }, before, after)
    expect(store.canUndoTransform).toBe(true)

    store.undoLastTransform()
    expect(group.transform).toEqual(before)
    expect(store.canRedoTransform).toBe(true)

    store.redoLastTransform()
    expect(group.transform).toEqual(after)
    expect(store.canUndoTransform).toBe(true)
  })

  it('restaure aussi l’absence initiale de transform sur une keyframe', () => {
    const store = useTimelineStore()
    const track = store.currentSequence.tracks[0]
    const keyframe: Keyframe = {
      id: 'kf_history',
      stepId: store.activeStep!.id,
      zIndex: track.zIndex,
      muted: false,
      locked: false,
      sprites: [
        {
          id: 'sprite-history',
          assetId: 'asset-history',
          transform: undefined,
          order: 0
        }
      ]
    }
    track.keyframes.push(keyframe)
    const sprite = keyframe.sprites[0]
    sprite.transform = { x: 24, y: 18, scaleX: 0.8, scaleY: 0.8 }

    store.recordTransformAction(
      {
        kind: 'keyframe-sprite',
        trackId: track.id,
        keyframeId: keyframe.id,
        spriteId: sprite.id
      },
      undefined,
      sprite.transform
    )
    store.undoLastTransform()
    expect(sprite.transform).toBeUndefined()

    store.redoLastTransform()
    expect(sprite.transform).toEqual({ x: 24, y: 18, scaleX: 0.8, scaleY: 0.8 })
  })

  it('invalide le redo dès qu’une nouvelle transformation est enregistrée', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups![0]
    const initial = { ...group.transform }
    group.transform = { ...group.transform, x: 10 }
    store.recordTransformAction(
      { kind: 'group', groupId: group.id },
      initial,
      group.transform
    )
    store.undoLastTransform()
    expect(store.canRedoTransform).toBe(true)

    const beforeSecondAction = { ...group.transform }
    group.transform = { ...group.transform, y: 25 }
    store.recordTransformAction(
      { kind: 'group', groupId: group.id },
      beforeSecondAction,
      group.transform
    )

    expect(store.canRedoTransform).toBe(false)
  })

  it('ignore une interaction sans changement réel', () => {
    const store = useTimelineStore()
    const group = store.currentSequence.groups![0]
    const snapshot = { ...group.transform }

    store.recordTransformAction(
      { kind: 'group', groupId: group.id },
      snapshot,
      { ...snapshot }
    )

    expect(store.canUndoTransform).toBe(false)
  })

  it('annule un geste avant OK puis regroupe la session validée', () => {
    const store = useTimelineStore()
    const sprite = store.addKeyframe('props_set', store.activeStep!.id, 'asset-stop')!
    const track = store.currentSequence.tracks.find((candidate) => candidate.id === 'props_set')!
    const keyframe = track.keyframes[0]

    store.selectSpriteForEditing(track.id, keyframe.id, sprite.id)
    store.beginTransformGesture()
    store.updateKeyframeSpriteTransform(track.id, keyframe.id, sprite.id, { x: 20, y: 30 })
    store.commitTransformGesture()
    expect(store.canUndoTransform).toBe(true)
    store.undoLastTransform()
    expect(sprite.transform).toBeUndefined()
    store.redoLastTransform()
    expect(sprite.transform).toEqual({ x: 20, y: 30 })

    store.beginTransformGesture()
    store.updateKeyframeSpriteTransform(track.id, keyframe.id, sprite.id, {
      scaleX: 1.4,
      scaleY: 1.4
    })
    store.commitTransformGesture()

    store.commitTransformSession()
    expect(store.canUndoTransform).toBe(true)
    expect(store.selectedSpriteId).toBeNull()

    store.undoLastTransform()
    expect(sprite.transform).toBeUndefined()
    store.redoLastTransform()
    expect(sprite.transform).toEqual({ x: 20, y: 30, scaleX: 1.4, scaleY: 1.4 })
  })
})

describe('séquence discrète et suppression locale', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('ajoute, duplique, déplace et supprime des étapes ordonnées', () => {
    const store = useTimelineStore()
    const first = store.activeStep!
    const sprite = store.addKeyframe('head', first.id, 'head-a')!
    const second = store.addStepAfter(first.id)

    expect(store.getEffectiveKeyframeAtStep('head', second.id)?.sprites[0]?.assetId).toBe('head-a')
    expect(store.selectedSpriteId).not.toBe(sprite.id)
    expect(store.getKeyframeAtStep('head', second.id)?.sprites[0]?.id).toBe(store.selectedSpriteId)
    store.updateKeyframeSpriteTransform(
      'head',
      store.getKeyframeAtStep('head', second.id)!.id,
      store.selectedSpriteId!,
      { x: 120 }
    )
    expect(store.getKeyframeAtStep('head', first.id)?.sprites[0]?.transform).toBeUndefined()
    const duplicate = store.duplicateStep(second.id)!
    expect(store.getKeyframeAtStep('head', duplicate.id)?.sprites[0]?.assetId).toBe('head-a')

    store.moveStep(duplicate.id, 0)
    expect(store.orderedSteps[0]?.id).toBe(duplicate.id)
    store.removeStep(second.id)
    expect(store.currentSequence.steps.some((step) => step.id === second.id)).toBe(false)
    expect(sprite.assetId).toBe('head-a')
  })

  it('retire un sprite uniquement de l’étape active avec undo avant et après OK', () => {
    const store = useTimelineStore()
    const track = store.currentSequence.tracks.find((candidate) => candidate.id === 'head')!
    const first = store.activeStep!
    store.addKeyframe(track.id, first.id, 'head-a')
    const second = store.addStepAfter(first.id)
    const third = store.addStepAfter(second.id)
    store.selectStep(second.id)

    const secondSnapshot = store.getEffectiveKeyframeAtStep(track.id, second.id)!
    const secondSprite = secondSnapshot.sprites[0]!
    store.selectSpriteForEditing(track.id, secondSnapshot.id, secondSprite.id)
    const editableSpriteId = store.selectedSpriteId!

    expect(store.removeSpriteFromActiveStep(track.id, editableSpriteId)).toBe(true)
    expect(store.getEffectiveKeyframeAtStep(track.id, second.id)?.sprites).toEqual([])
    expect(store.getEffectiveKeyframeAtStep(track.id, third.id)?.sprites[0]?.assetId).toBe('head-a')

    store.undoLastTransform()
    expect(store.getEffectiveKeyframeAtStep(track.id, second.id)?.sprites[0]?.assetId).toBe('head-a')
    store.redoLastTransform()
    expect(store.getEffectiveKeyframeAtStep(track.id, second.id)?.sprites).toEqual([])

    store.commitTransformSession()
    store.undoLastTransform()
    expect(store.getEffectiveKeyframeAtStep(track.id, second.id)?.sprites[0]?.assetId).toBe('head-a')
  })

  it('conserve le z-index et la transformation de groupe propres à chaque étape', () => {
    const store = useTimelineStore()
    const first = store.activeStep!
    const group = store.currentSequence.groups!.find((candidate) => candidate.id === 'grp_berlu')!
    const initialZ = store.currentSequence.tracks.find((track) => track.id === 'head')!.zIndex
    const second = store.addStepAfter(first.id)

    store.updateTrackZIndex('head', 91)
    store.updateGroupTransform(group.id, { x: 240 })
    store.selectStep(first.id)
    expect(store.currentSequence.tracks.find((track) => track.id === 'head')?.zIndex).toBe(initialZ)
    expect(group.transform?.x).toBe(0)

    store.selectStep(second.id)
    expect(store.currentSequence.tracks.find((track) => track.id === 'head')?.zIndex).toBe(91)
    expect(group.transform?.x).toBe(240)
  })

  it('clone le cadrage puis garde les modifications autonomes par étape', () => {
    const store = useTimelineStore()
    const first = store.activeStep!
    store.updateActiveStepCamera({
      enabled: true,
      x: 100,
      y: 50,
      width: 896,
      height: 504,
      aspectRatio: '16:9'
    })

    const second = store.addStepAfter(first.id)
    expect(second.camera).toEqual(first.camera)

    store.updateActiveStepCamera({ ...second.camera, x: 240 })
    expect(second.camera.x).toBe(240)
    expect(first.camera.x).toBe(100)
  })
})
