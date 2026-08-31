import type { Asset } from '@core/types/asset.types'
import {
  RIG_CATALOG_SCHEMA,
  RIG_CATALOG_VERSION,
  type RigCatalogFile,
  type RigDefinition
} from './rig-catalog.types'
import { assetsShareRigIdentity } from './rig-catalog.service'

export const DEFAULT_RIG_CATALOG_FILE: RigCatalogFile = {
  schema: RIG_CATALOG_SCHEMA,
  version: RIG_CATALOG_VERSION,
  exportedAt: '2026-08-31T22:20:16.060Z',
  defaultRigByCharacter: {
    berlu: 'rig-berlu-micro-1-torse-758x555'
  },
  rigs: [
    {
      id: 'rig-berlu-micro-1-torse-758x555',
      name: 'Micro 1 torse',
      characterKey: 'berlu',
      characterName: 'Berlu',
      canvasWidth: 840,
      canvasHeight: 908,
      body: {
        name: 'Micro 1 torse',
        category: 'body',
        width: 758,
        height: 555
      },
      bodyCalibration: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      bodyOrigin: {
        x: 379,
        y: 277.5
      },
      categories: [
        {
          category: 'head',
          enabled: true,
          template: {
            x: -379,
            y: -277,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          },
          defaultPartKey: 'head:head amuse:260x309'
        }
      ],
      parts: [
        {
          asset: {
            name: 'Head amuse',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head choque',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head complice',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -129,
            y: -423,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head complice2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head confus1',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -131,
            y: -421,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head confus dubitatif',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head enthousiaste',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head gené',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head impressionne',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head inquiet',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head interloce',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head rire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head satisfait',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head sourire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -133,
            y: -423,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 6,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head surpris',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head surpris2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head suspect',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -415,
            scaleX: 1.19,
            scaleY: 1.19,
            rotation: 0,
            zIndex: 0
          }
        }
      ],
      excludedPartKeys: [],
      updatedAt: 1788050998966
    },
    {
      id: 'rig-berlu-torse-casual-droit-424x838',
      name: 'Torse casual droit',
      characterKey: 'berlu',
      characterName: 'Berlu',
      canvasWidth: 840,
      canvasHeight: 908,
      body: {
        name: 'Torse casual droit',
        category: 'body',
        width: 424,
        height: 838
      },
      bodyCalibration: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      bodyOrigin: {
        x: 212,
        y: 419
      },
      categories: [
        {
          category: 'head',
          enabled: true,
          template: {
            x: -212,
            y: -419,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          },
          defaultPartKey: 'head:head amuse:260x309'
        }
      ],
      parts: [
        {
          asset: {
            name: 'Head amuse',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head choque',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus1',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus dubitatif',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head enthousiaste',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head gené',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head impressionne',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head inquiet',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head interloce',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head rire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head satisfait',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head sourire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head suspect',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -125,
            y: -423,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            zIndex: 20
          }
        }
      ],
      excludedPartKeys: [],
      updatedAt: 1788020101045
    },
    {
      id: 'rig-berlu-torse-feuille-1031x812',
      name: 'Torse feuille',
      characterKey: 'berlu',
      characterName: 'Berlu',
      canvasWidth: 840,
      canvasHeight: 908,
      body: {
        name: 'Torse feuille',
        category: 'body',
        width: 1031,
        height: 812
      },
      bodyCalibration: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      bodyOrigin: {
        x: 515.5,
        y: 406
      },
      categories: [
        {
          category: 'head',
          enabled: true,
          template: {
            x: -515,
            y: -406,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          },
          defaultPartKey: 'head:head amuse:260x309'
        }
      ],
      parts: [
        {
          asset: {
            name: 'Head amuse',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head choque',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus1',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus dubitatif',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head enthousiaste',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head gené',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head impressionne',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head inquiet',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head interloce',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head rire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head satisfait',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head sourire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head suspect',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -117,
            y: -252,
            scaleX: 1.34,
            scaleY: 1.34,
            rotation: 0,
            zIndex: 20
          }
        }
      ],
      excludedPartKeys: [],
      updatedAt: 1788214728324
    },
    {
      id: 'rig-berlu-torse-micro-1031x812',
      name: 'Torse micro',
      characterKey: 'berlu',
      characterName: 'Berlu',
      canvasWidth: 840,
      canvasHeight: 908,
      body: {
        name: 'Torse micro',
        category: 'body',
        width: 1031,
        height: 812
      },
      bodyCalibration: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      bodyOrigin: {
        x: 515.5,
        y: 406
      },
      categories: [
        {
          category: 'head',
          enabled: true,
          template: {
            x: -515,
            y: -406,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          },
          defaultPartKey: 'head:head amuse:260x309'
        }
      ],
      parts: [
        {
          asset: {
            name: 'Head amuse',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head choque',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -128,
            y: -267,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head complice2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus1',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -130,
            y: -279,
            scaleX: 1.36,
            scaleY: 1.36,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus dubitatif',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -271,
            scaleX: 1.39,
            scaleY: 1.39,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head enthousiaste',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -126,
            y: -266,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 0
          }
        },
        {
          asset: {
            name: 'Head gené',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -132,
            y: -272,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 2
          }
        },
        {
          asset: {
            name: 'Head impressionne',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head inquiet',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head interloce',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head rire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head satisfait',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head sourire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -124,
            y: -254,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head suspect',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -137,
            y: -275,
            scaleX: 1.31,
            scaleY: 1.31,
            rotation: 0,
            zIndex: 0
          }
        }
      ],
      excludedPartKeys: [],
      updatedAt: 1788038932720
    },
    {
      id: 'rig-berlu-torse-tropi-fingerup-424x838',
      name: 'Torse tropi fingerup',
      characterKey: 'berlu',
      characterName: 'Berlu',
      canvasWidth: 840,
      canvasHeight: 908,
      body: {
        name: 'Torse tropi fingerup',
        category: 'body',
        width: 424,
        height: 838
      },
      bodyCalibration: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      bodyOrigin: {
        x: 212,
        y: 419
      },
      categories: [
        {
          category: 'head',
          enabled: true,
          template: {
            x: -212,
            y: -419,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          },
          defaultPartKey: 'head:head amuse:260x309'
        }
      ],
      parts: [
        {
          asset: {
            name: 'Head amuse',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head choque',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -128,
            y: -407,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: -2,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus1',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus dubitatif',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head enthousiaste',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head gené',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head impressionne',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head inquiet',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head interloce',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head rire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -136,
            y: -436,
            scaleX: 0.84,
            scaleY: 0.84,
            rotation: -5,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head satisfait',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head sourire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head suspect',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -135,
            y: -433,
            scaleX: 0.79,
            scaleY: 0.79,
            rotation: 0,
            zIndex: 20
          }
        }
      ],
      excludedPartKeys: [],
      updatedAt: 1788041263434
    },
    {
      id: 'rig-berlu-torse-tropi-handopen-424x838',
      name: 'Torse tropi handopen',
      characterKey: 'berlu',
      characterName: 'Berlu',
      canvasWidth: 840,
      canvasHeight: 908,
      body: {
        name: 'Torse tropi handopen',
        category: 'body',
        width: 424,
        height: 838
      },
      bodyCalibration: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      bodyOrigin: {
        x: 212,
        y: 419
      },
      categories: [
        {
          category: 'head',
          enabled: true,
          template: {
            x: -212,
            y: -419,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          },
          defaultPartKey: 'head:head amuse:260x309'
        }
      ],
      parts: [
        {
          asset: {
            name: 'Head amuse',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head choque',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus1',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus dubitatif',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head enthousiaste',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head gené',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head impressionne',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head inquiet',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head interloce',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head rire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head satisfait',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head sourire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head suspect',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -134,
            y: -429,
            scaleX: 0.86,
            scaleY: 0.86,
            rotation: 0,
            zIndex: 20
          }
        }
      ],
      excludedPartKeys: [],
      updatedAt: 1788214792153
    },
    {
      id: 'rig-berlu-torse-tropi-thumbup-424x838',
      name: 'Torse tropi thumbup',
      characterKey: 'berlu',
      characterName: 'Berlu',
      canvasWidth: 840,
      canvasHeight: 908,
      body: {
        name: 'Torse tropi thumbup',
        category: 'body',
        width: 424,
        height: 838
      },
      bodyCalibration: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0
      },
      bodyOrigin: {
        x: 217,
        y: 278
      },
      categories: [
        {
          category: 'head',
          enabled: true,
          template: {
            x: -217,
            y: -278,
            scaleX: 1,
            scaleY: 1,
            rotation: 0
          },
          defaultPartKey: 'head:head amuse:260x309'
        }
      ],
      parts: [
        {
          asset: {
            name: 'Head amuse',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head choque',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -146,
            y: -291,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -284,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head complice2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus1',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head confus dubitatif',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head enthousiaste',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head gené',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head impressionne',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head inquiet',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head interloce',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head rire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head satisfait',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head sourire',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head surpris2',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        },
        {
          asset: {
            name: 'Head suspect',
            category: 'head',
            width: 260,
            height: 309
          },
          calibrationOverride: {
            x: -140,
            y: -283,
            scaleX: 0.72,
            scaleY: 0.72,
            rotation: 0,
            zIndex: 20
          }
        }
      ],
      excludedPartKeys: [],
      updatedAt: 1788213166217
    }
  ]
}

export function getDefaultRigCatalogFile(): RigCatalogFile {
  return JSON.parse(JSON.stringify(DEFAULT_RIG_CATALOG_FILE)) as RigCatalogFile
}

export function findDefaultRigDefinition(
  characterKey: string,
  body: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): RigDefinition | undefined {
  const match = DEFAULT_RIG_CATALOG_FILE.rigs.find(
    (rig) => rig.characterKey === characterKey && assetsShareRigIdentity(rig.body, body)
  )
  return match ? (JSON.parse(JSON.stringify(match)) as RigDefinition) : undefined
}
