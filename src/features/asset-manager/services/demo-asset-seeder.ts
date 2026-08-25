import { assetRepository } from '@infrastructure/db/repositories/asset.repository'
import type { Asset } from '@core/types/asset.types'
import { generateId } from '@/lib/utils'

/**
 * Crée un ensemble de sprites de démonstration vectoriels exportés en Blobs PNG
 * pour permettre une découverte immédiate et fluide du studio dès la première ouverture.
 */
export async function seedDemoAssetsIfEmpty(): Promise<void> {
  const existing = await assetRepository.getAll()
  if (existing.length > 0) return

  // 1. Décor Plateau JT
  const backdropBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#080c1d"/>
          <stop offset="50%" stop-color="#131e3d"/>
          <stop offset="100%" stop-color="#090d1f"/>
        </linearGradient>
        <linearGradient id="studio_light" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bg)"/>
      <circle cx="960" cy="540" r="400" fill="none" stroke="#2563eb" stroke-width="4" stroke-opacity="0.2"/>
      <circle cx="960" cy="540" r="600" fill="none" stroke="#60a5fa" stroke-width="2" stroke-opacity="0.1"/>
      <polygon points="300,0 600,0 800,1080 100,1080" fill="url(#studio_light)"/>
      <polygon points="1620,0 1320,0 1120,1080 1820,1080" fill="url(#studio_light)"/>
      <rect x="0" y="860" width="1920" height="220" fill="#0d1326" stroke="#3b82f6" stroke-opacity="0.4" stroke-width="2"/>
    </svg>
  `, 1920, 1080)

  const backdropAsset: Asset = {
    id: generateId('asset_backdrop'),
    name: 'Plateau Télévisé JT',
    category: 'backdrop',
    tags: ['backdrop', 'studio', 'jt', 'tv'],
    blobId: generateId('blob'),
    width: 1920,
    height: 1080,
    anchors: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(backdropAsset, backdropBlob)

  // 2. Torse Présentateur (Costume Bleu)
  const torsoBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380">
      <defs>
        <linearGradient id="suit" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <!-- Veste -->
      <path d="M 60,90 Q 150,50 240,90 L 280,380 L 20,380 Z" fill="url(#suit)" stroke="#334155" stroke-width="4"/>
      <!-- Chemise blanche & Cravate Rouge -->
      <polygon points="120,65 180,65 160,200 140,200" fill="#f8fafc"/>
      <polygon points="145,75 155,75 160,260 150,280 140,260" fill="#ef4444"/>
      <!-- Col de veste -->
      <path d="M 60,90 L 130,220 L 110,90 Z" fill="#1e293b" stroke="#475569" stroke-width="2"/>
      <path d="M 240,90 L 170,220 L 190,90 Z" fill="#1e293b" stroke="#475569" stroke-width="2"/>
    </svg>
  `, 300, 380)

  const torsoAsset: Asset = {
    id: generateId('asset_torso'),
    name: 'Buste Costume Présentateur',
    category: 'torso',
    tags: ['torso', 'suit', 'formal', 'presenter'],
    blobId: generateId('blob'),
    width: 300,
    height: 380,
    anchors: [
      { id: generateId('anc'), name: 'neck', type: 'socket', x: 150, y: 55 },
      { id: generateId('anc'), name: 'shoulder_left', type: 'socket', x: 60, y: 90 },
      { id: generateId('anc'), name: 'shoulder_right', type: 'socket', x: 240, y: 90 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(torsoAsset, torsoBlob)

  // 3. Tête Présentateur
  const headBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="220" height="260" viewBox="0 0 220 260">
      <!-- Cou -->
      <rect x="90" y="190" width="40" height="60" fill="#fcd34d" rx="6"/>
      <!-- Visage -->
      <ellipse cx="110" cy="120" rx="85" ry="95" fill="#fde68a" stroke="#d97706" stroke-width="3"/>
      <!-- Cheveux stylisés -->
      <path d="M 25,100 C 20,20 190,10 195,95 C 170,40 50,40 25,100 Z" fill="#451a03"/>
      <!-- Oreilles -->
      <circle cx="25" cy="125" r="14" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
      <circle cx="195" cy="125" r="14" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
      <!-- Nez -->
      <path d="M 110,120 Q 118,145 106,148" fill="none" stroke="#b45309" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `, 220, 260)

  const headAsset: Asset = {
    id: generateId('asset_head'),
    name: 'Tête Présentateur Base',
    category: 'head',
    tags: ['head', 'face', 'presenter'],
    blobId: generateId('blob'),
    width: 220,
    height: 260,
    anchors: [
      { id: generateId('anc'), name: 'neck', type: 'mount', x: 110, y: 240 },
      { id: generateId('anc'), name: 'eyes', type: 'socket', x: 110, y: 105 },
      { id: generateId('anc'), name: 'mouth', type: 'socket', x: 110, y: 175 }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(headAsset, headBlob)

  // 4. Expressions de Bouche (Sourire & Phonèmes de parole)
  const mouthSmileBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewBox="0 0 80 40">
      <path d="M 10,12 Q 40,36 70,12 Q 40,24 10,12 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="2"/>
      <path d="M 20,14 Q 40,22 60,14" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `, 80, 40)

  const mouthSmileAsset: Asset = {
    id: generateId('asset_mouth_smile'),
    name: 'Bouche Sourire',
    category: 'mouth',
    tags: ['mouth', 'smile', 'happy', 'neutral'],
    blobId: generateId('blob'),
    width: 80,
    height: 40,
    anchors: [{ id: generateId('anc'), name: 'center', type: 'mount', x: 40, y: 20 }],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(mouthSmileAsset, mouthSmileBlob)

  const mouthTalkBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewBox="0 0 80 40">
      <ellipse cx="40" cy="20" rx="22" ry="15" fill="#7f1d1d" stroke="#450a0a" stroke-width="2"/>
      <rect x="26" y="10" width="28" height="6" fill="#ffffff" rx="2"/>
      <ellipse cx="40" cy="26" rx="14" ry="6" fill="#dc2626"/>
    </svg>
  `, 80, 40)

  const mouthTalkAsset: Asset = {
    id: generateId('asset_mouth_talk'),
    name: 'Bouche Parole (Ouverte)',
    category: 'mouth',
    tags: ['mouth', 'talk_a', 'talk_o', 'surprised'],
    blobId: generateId('blob'),
    width: 80,
    height: 40,
    anchors: [{ id: generateId('anc'), name: 'center', type: 'mount', x: 40, y: 20 }],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(mouthTalkAsset, mouthTalkBlob)

  // 5. Yeux (Ouverts & Clignement)
  const eyesOpenBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="120" height="50" viewBox="0 0 120 50">
      <!-- Oeil Gauche -->
      <ellipse cx="35" cy="25" rx="18" ry="12" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
      <circle cx="35" cy="25" r="7" fill="#0284c7"/>
      <circle cx="35" cy="25" r="4" fill="#0f172a"/>
      <circle cx="37" cy="22" r="2" fill="#ffffff"/>
      <!-- Oeil Droit -->
      <ellipse cx="85" cy="25" rx="18" ry="12" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
      <circle cx="85" cy="25" r="7" fill="#0284c7"/>
      <circle cx="85" cy="25" r="4" fill="#0f172a"/>
      <circle cx="87" cy="22" r="2" fill="#ffffff"/>
      <!-- Sourcils -->
      <path d="M 18,10 Q 35,4 52,10" fill="none" stroke="#451a03" stroke-width="3" stroke-linecap="round"/>
      <path d="M 68,10 Q 85,4 102,10" fill="none" stroke="#451a03" stroke-width="3" stroke-linecap="round"/>
    </svg>
  `, 120, 50)

  const eyesOpenAsset: Asset = {
    id: generateId('asset_eyes_open'),
    name: 'Regard Ouvert Expressif',
    category: 'eyes',
    tags: ['eyes', 'front', 'happy', 'neutral'],
    blobId: generateId('blob'),
    width: 120,
    height: 50,
    anchors: [{ id: generateId('anc'), name: 'center', type: 'mount', x: 60, y: 25 }],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(eyesOpenAsset, eyesOpenBlob)

  // 6. Bras Droit tenant un Micro
  const armMicBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="160" height="260" viewBox="0 0 160 260">
      <!-- Bras Costume -->
      <path d="M 30,30 Q 110,80 90,160 Q 60,180 30,160 Z" fill="#1e293b" stroke="#334155" stroke-width="3"/>
      <!-- Main tenant le micro -->
      <ellipse cx="80" cy="180" rx="16" ry="14" fill="#fde68a" stroke="#d97706" stroke-width="2"/>
      <!-- Micro -->
      <rect x="72" y="190" width="16" height="50" fill="#334155" rx="3"/>
      <ellipse cx="80" cy="180" rx="14" ry="18" fill="#1e293b" stroke="#94a3b8" stroke-width="2"/>
      <rect x="70" y="174" width="20" height="4" fill="#ef4444"/>
    </svg>
  `, 160, 260)

  const armMicAsset: Asset = {
    id: generateId('asset_arm_mic'),
    name: 'Bras Droit avec Micro',
    category: 'arms_right',
    tags: ['arms_right', 'mic', 'action', 'reporter'],
    blobId: generateId('blob'),
    width: 160,
    height: 260,
    anchors: [{ id: generateId('anc'), name: 'shoulder_right', type: 'mount', x: 30, y: 30 }],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(armMicAsset, armMicBlob)

  // 7. Bandeau Breaking News (Overlay)
  const overlayBlob = await svgToPngBlob(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="140" viewBox="0 0 1920 140">
      <rect x="0" y="0" width="1920" height="140" fill="#0f172a" fill-opacity="0.95"/>
      <rect x="0" y="0" width="1920" height="6" fill="#ef4444"/>
      <!-- Badge Rouge Flash -->
      <rect x="60" y="24" width="260" height="46" fill="#ef4444" rx="4"/>
      <text x="190" y="56" fill="#ffffff" font-family="sans-serif" font-weight="900" font-size="22" text-anchor="middle" letter-spacing="2">
        FLASH INFO
      </text>
      <text x="350" y="56" fill="#f8fafc" font-family="sans-serif" font-weight="700" font-size="26">
        BERLUCREATOR : LE STUDIO D'ANIMATION STOP-MOTION 2D EST PRÊT !
      </text>
      <!-- Ligne de défilement ticker -->
      <rect x="0" y="90" width="1920" height="40" fill="#1e293b"/>
      <text x="70" y="116" fill="#94a3b8" font-family="sans-serif" font-size="16">
        DIRECT 20:00 • NOUVELLE ÉDITION SPÉCIALE • TOUTES LES DERNIÈRES NOUVELLES EN DIRECT DU PLATEAU
      </text>
    </svg>
  `, 1920, 140)

  const overlayAsset: Asset = {
    id: generateId('asset_overlay_breaking'),
    name: 'Bandeau Flash Info Télévisé',
    category: 'overlay',
    tags: ['overlay', 'breaking', 'banner', 'news'],
    blobId: generateId('blob'),
    width: 1920,
    height: 140,
    anchors: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  await assetRepository.create(overlayAsset, overlayBlob)
}

function svgToPngBlob(svgString: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob((pngBlob) => {
          URL.revokeObjectURL(url)
          resolve(pngBlob || blob)
        }, 'image/png')
      } else {
        URL.revokeObjectURL(url)
        resolve(blob)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(blob)
    }
    img.src = url
  })
}
