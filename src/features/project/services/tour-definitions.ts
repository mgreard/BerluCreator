import type { ProductTourStep } from '@/components/ui/product-tour'

export type TourKey = 'studio-overview' | 'rig-calibration' | 'saved-snapshots' | 'export'

export interface TourDefinition {
  key: TourKey
  title: string
  icon: string
  description: string
  storageKey: string
  steps: ProductTourStep[]
}

export const TOUR_DEFINITIONS: Record<TourKey, TourDefinition> = {
  'studio-overview': {
    key: 'studio-overview',
    title: 'Studio & Viewport',
    icon: 'dashboard',
    description: 'Découvrez la bibliothèque, le plateau et les outils de création.',
    storageKey: 'berlu.tour.studio.v2',
    steps: [
      {
        element: '[data-tour="asset-library"]',
        popover: {
          title: '1. Bibliothèque de sprites',
          description:
            'Parcourez les catégories et cliquez sur un sprite pour l’ajouter sur le plateau. Un corps charge automatiquement son profil de personnage.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '[data-tour="viewport-top-actions"]',
        popover: {
          title: '2. Outils du viewport',
          description:
            'Réglez la profondeur de champ, ouvrez le panneau unique Effets visuels, ajustez le cadrage caméra et utilisez l’historique Undo/Redo.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '[data-tour="stage-canvas"]',
        popover: {
          title: '3. Composition sur le plateau',
          description:
            'Cliquez sur les pixels opaques d’un élément pour le sélectionner. Déplacez, redimensionnez et effectuez des rotations centrées en toute fluidité.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '[data-tour="saved-snapshots-btn"]',
        popover: {
          title: '4. Vues & Compositions',
          description:
            'Mémorisez vos cadrages, éclairages et dispositions préférés pour basculer de l’un à l’autre en un instant.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '[data-tour="backup-menu-btn"]',
        popover: {
          title: '5. Sauvegarde & Paramètres',
          description:
            'Générez une sauvegarde complète du projet, restaurez une sauvegarde précédente ou importez un fichier de sauvegarde externe.',
          side: 'bottom',
          align: 'end'
        }
      },
      {
        element: '[data-tour="export-btn"]',
        popover: {
          title: '6. Exportation HD',
          description:
            'Exportez votre création finale en PNG haute définition avec ou sans fond, ou sauvegardez les données JSON de la scène.',
          side: 'bottom',
          align: 'end'
        }
      }
    ]
  },

  'rig-calibration': {
    key: 'rig-calibration',
    title: 'Calibrage de personnage',
    icon: 'accessibility_new',
    description: 'Ajustez la position et l’échelle des têtes et tenues sur le corps.',
    storageKey: 'berlu.tour.rig.v1',
    steps: [
      {
        element: '[data-tour="rig-workspace-canvas"]',
        popover: {
          title: '1. Repère de calibrage',
          description:
            'Visualisez le corps de référence. Toutes les pièces ajoutées sont positionnées par rapport à ce squelette.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '[data-tour="rig-accordion-categories"]',
        popover: {
          title: '2. Pièces articulées',
          description:
            'Ouvrez les sections pour configurer les têtes et autres éléments du personnage.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="rig-transform-controls"]',
        popover: {
          title: '3. Ajustement géométrique',
          description:
            'Réglez précisément la position X/Y, l’échelle, la rotation et l’ordre z de la pièce sélectionnée.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '[data-tour="rig-apply-all"]',
        popover: {
          title: '4. Appliquer à tous les sprites',
          description:
            'Copiez instantanément cette position à tous les autres sprites de la même catégorie en un seul clic.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '[data-tour="rig-save-btn"]',
        popover: {
          title: '5. Enregistrement',
          description:
            'Sauvegardez la configuration sur le profil de rig pour que les modifications soient appliquées partout.',
          side: 'left',
          align: 'end'
        }
      }
    ]
  },

  'saved-snapshots': {
    key: 'saved-snapshots',
    title: 'Vues sauvegardées',
    icon: 'collections_bookmark',
    description: 'Créez et restaurez des compositions de scènes complètes.',
    storageKey: 'berlu.tour.snapshots.v1',
    steps: [
      {
        element: '[data-tour="snapshots-create-btn"]',
        popover: {
          title: '1. Capturer la scène',
          description:
            'Enregistrez l’état complet du plateau : calques, cadrage caméra, profondeur de champ, colorimétrie et effets stylisés.',
          side: 'left',
          align: 'start'
        }
      },
      {
        element: '[data-tour="snapshots-list"]',
        popover: {
          title: '2. Restaurer une vue',
          description:
            'Cliquez sur n’importe quelle miniature pour rétablir instantanément cette disposition.',
          side: 'left',
          align: 'center'
        }
      }
    ]
  },

  export: {
    key: 'export',
    title: 'Module d’exportation',
    icon: 'file_download',
    description: 'Paramétrez le format et la résolution de vos images.',
    storageKey: 'berlu.tour.export.v1',
    steps: [
      {
        element: '[data-tour="export-resolution"]',
        popover: {
          title: '1. Résolution & Format',
          description:
            'Choisissez une résolution 1080p ou native et l’option de transparence du PNG.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '[data-tour="export-download-btn"]',
        popover: {
          title: '2. Télécharger',
          description:
            'Générez et téléchargez directement votre image rendue sans les aides d’édition.',
          side: 'top',
          align: 'end'
        }
      }
    ]
  }
}
