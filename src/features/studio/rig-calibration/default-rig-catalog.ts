import type { Asset } from '@core/types/asset.types'
import type { DefaultRigAssetCalibration, DefaultRigConfigurationBundle } from './rig-default-configuration.types'
import type { RigCatalogFile, RigDefinition } from './rig-catalog.types'

/** Généré depuis le calibreur de rigs. Remplace le fichier homonyme dans rig-calibration. */
export const DEFAULT_RIG_CONFIGURATION_BUNDLE: DefaultRigConfigurationBundle = {
  "schema": "berlu-creator/default-rig-configuration",
  "version": 1,
  "exportedAt": "1970-01-01T00:00:00.000Z",
  "catalog": {
    "schema": "berlu-creator/rig-catalog",
    "version": 7,
    "exportedAt": "1970-01-01T00:00:00.000Z",
    "defaultRigByCharacter": {
      "berlu": "rig-berlu-body1-334x576"
    },
    "headSeries": [
      {
        "id": "berlu",
        "label": "Berlu",
        "width": 1205,
        "height": 1305,
        "neckPivot": {
          "x": 0.5,
          "y": 0.5
        },
        "mouthAnchor": {
          "x": 0.5,
          "y": 0.66
        },
        "propAnchors": {
          "sunglass": {
            "x": 0.5,
            "y": 0.43
          },
          "hat": {
            "x": 0.5,
            "y": 0.08
          }
        },
        "updatedAt": 1788469790373
      }
    ],
    "rigs": [
      {
        "id": "rig-berlu-body1-334x576",
        "name": "Body1",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "Body1",
          "category": "body",
          "width": 334,
          "height": 576
        },
        "neckAnchor": {
          "x": 165,
          "y": -47
        },
        "headMotionRadius": 34,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.243,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472471857
      },
      {
        "id": "rig-berlu-body2-474x578",
        "name": "Body2",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "Body2",
          "category": "body",
          "width": 474,
          "height": 578
        },
        "neckAnchor": {
          "x": 161,
          "y": -35
        },
        "headMotionRadius": 34,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.2225,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472940474
      },
      {
        "id": "rig-berlu-body1-tv-1024x1536",
        "name": "body1 tv",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body1 tv",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 496,
          "y": -100
        },
        "headMotionRadius": 89,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5306,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472949642
      },
      {
        "id": "rig-berlu-body2-tv-1024x1536",
        "name": "body2 tv",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body2 tv",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 398,
          "y": -70
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5431,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472946848
      },
      {
        "id": "rig-berlu-body3-1024x1535",
        "name": "body3",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body3",
          "category": "body",
          "width": 1024,
          "height": 1535
        },
        "neckAnchor": {
          "x": 509,
          "y": -77
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.524,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472770653
      },
      {
        "id": "rig-berlu-body4-1239x1270",
        "name": "body4",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body4",
          "category": "body",
          "width": 1239,
          "height": 1270
        },
        "neckAnchor": {
          "x": 750,
          "y": -91
        },
        "headMotionRadius": 73,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.4426,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472775344
      },
      {
        "id": "rig-berlu-body5-1093x1438",
        "name": "body5",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body5",
          "category": "body",
          "width": 1093,
          "height": 1438
        },
        "neckAnchor": {
          "x": 521,
          "y": -101
        },
        "headMotionRadius": 83,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5141,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472779428
      },
      {
        "id": "rig-berlu-body5-tv-1180x1333",
        "name": "body5 tv",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body5 tv",
          "category": "body",
          "width": 1180,
          "height": 1333
        },
        "neckAnchor": {
          "x": 565,
          "y": -90
        },
        "headMotionRadius": 79,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.46,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472803496
      },
      {
        "id": "rig-berlu-body6-1024x1536",
        "name": "body6",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body6",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 494,
          "y": 50
        },
        "headMotionRadius": 86,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5235,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472810941
      },
      {
        "id": "rig-berlu-body7-1024x1536",
        "name": "body7",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body7",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 505,
          "y": -113
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5444,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472833404
      },
      {
        "id": "rig-berlu-body8-1024x1536",
        "name": "body8",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body8",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 500,
          "y": -124
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5152,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472831558
      },
      {
        "id": "rig-berlu-body9-1024x1536",
        "name": "body9",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body9",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 514,
          "y": -100
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5392,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472828178
      },
      {
        "id": "rig-berlu-body9-tv-1024x1536",
        "name": "body9 tv",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "body9 tv",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 502,
          "y": -120
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5239,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472838693
      },
      {
        "id": "rig-berlu-estival-body1-1024x1536",
        "name": "estival body1",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "estival body1",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 502,
          "y": -80
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5018,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472843598
      },
      {
        "id": "rig-berlu-estival-body10-1122x1402",
        "name": "estival body10",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "estival body10",
          "category": "body",
          "width": 1122,
          "height": 1402
        },
        "neckAnchor": {
          "x": 567,
          "y": -110
        },
        "headMotionRadius": 83,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5101,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472847621
      },
      {
        "id": "rig-berlu-estival-body2-1086x1448",
        "name": "estival body2",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "estival body2",
          "category": "body",
          "width": 1086,
          "height": 1448
        },
        "neckAnchor": {
          "x": 416,
          "y": -102
        },
        "headMotionRadius": 84,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.4957,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472855556
      },
      {
        "id": "rig-berlu-estival-body5-1122x1402",
        "name": "estival body5",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "estival body5",
          "category": "body",
          "width": 1122,
          "height": 1402
        },
        "neckAnchor": {
          "x": 548,
          "y": -137
        },
        "headMotionRadius": 81,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.4967,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472859208
      },
      {
        "id": "rig-berlu-estival-body9-1024x1536",
        "name": "estival body9",
        "characterKey": "berlu",
        "characterName": "Berlu",
        "body": {
          "name": "estival body9",
          "category": "body",
          "width": 1024,
          "height": 1536
        },
        "neckAnchor": {
          "x": 524,
          "y": -104
        },
        "headMotionRadius": 91,
        "headSeries": [
          {
            "seriesId": "berlu",
            "enabled": true,
            "defaultScale": 0.5006,
            "defaultRotation": 0,
            "defaultHeadAssetKey": "head:neutre head:1205x1305"
          }
        ],
        "calibrated": true,
        "updatedAt": 1788472866701
      }
    ]
  },
  "assetCalibrations": [
    {
      "assetKey": "mouth:doute mouth:1205x1305",
      "sourcePath": "mouth/Doute_mouth.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 0,
          "offsetY": -197,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "mouth:enerve mouth:1205x1305",
      "sourcePath": "mouth/Enerve_mouth.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 13,
          "offsetY": -195,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "mouth:grrr mouth:1205x1305",
      "sourcePath": "mouth/Grrr_mouth.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 13,
          "offsetY": -195,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "mouth:rire mouth:1205x1305",
      "sourcePath": "mouth/Rire_mouth.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 6,
          "offsetY": -214,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "mouth:sourire mouth:1205x1305",
      "sourcePath": "mouth/Sourire_mouth.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 6,
          "offsetY": -195,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "mouth:trav mouth:1205x1305",
      "sourcePath": "mouth/Trav_mouth.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 6,
          "offsetY": -214,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "props_character:lunette funky:1205x1440",
      "sourcePath": "props_perso/glasse/Lunette_funky.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 0,
          "offsetY": 14,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "props_character:enquete:1086x1448",
      "sourcePath": "props_perso/glasse/enquete.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 7,
          "offsetY": -114,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "props_character:party:1086x1448",
      "sourcePath": "props_perso/glasse/party.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 21,
          "offsetY": -293,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "props_character:casque chantier:1205x1440",
      "sourcePath": "props_perso/hat/Casque_chantier.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 0,
          "offsetY": 415,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "props_character:casquette asptt chaumond:1205x1440",
      "sourcePath": "props_perso/hat/Casquette_asptt_chaumond.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": 1,
          "offsetY": 481,
          "scale": 1,
          "rotation": 0
        }
      }
    },
    {
      "assetKey": "props_character:casquette om:1205x1440",
      "sourcePath": "props_perso/hat/Casquette_om.png",
      "calibrations": {
        "berlu": {
          "pivot": {
            "x": 0.5,
            "y": 0.5
          },
          "offsetX": -6,
          "offsetY": 493,
          "scale": 1,
          "rotation": 0
        }
      }
    }
  ]
}

export const DEFAULT_RIG_CATALOG_FILE: RigCatalogFile =
  DEFAULT_RIG_CONFIGURATION_BUNDLE.catalog

export const DEFAULT_RIG_ASSET_CALIBRATIONS: DefaultRigAssetCalibration[] =
  DEFAULT_RIG_CONFIGURATION_BUNDLE.assetCalibrations

export function getDefaultRigCatalogFile(): RigCatalogFile {
  return structuredClone(DEFAULT_RIG_CATALOG_FILE)
}

export function findDefaultRigDefinition(
  characterKey: string,
  body: Pick<Asset, 'name' | 'category' | 'width' | 'height'>
): RigDefinition | undefined {
  return DEFAULT_RIG_CATALOG_FILE.rigs.find(
    (rig) =>
      rig.characterKey === characterKey &&
      rig.body.name === body.name &&
      rig.body.category === body.category &&
      rig.body.width === body.width &&
      rig.body.height === body.height
  )
}
