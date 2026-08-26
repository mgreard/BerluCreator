import type { AIGenerationRequest, AIGenerationResponse } from '@core/types/ai.types'
import { AIGenerationResponseSchema } from './schemas/sequence.schema'

export interface AIClientOptions {
  endpoint?: string
  apiKey?: string
  model?: string
}

export class AIClientService {
  private endpoint = '/api/ai/director'

  configure(options: AIClientOptions) {
    if (options.endpoint) this.endpoint = options.endpoint
  }

  /**
   * Analyse le script textuel brut et renvoie une liste validée de beats d'animation pour la timeline.
   */
  async generateSequenceBeats(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      })

      if (response.ok) {
        const rawJson = await response.json()
        return AIGenerationResponseSchema.parse(rawJson)
      }
    } catch {
      // Si le serveur relais local n'est pas actif, on utilise un générateur heuristique intelligent
      // pour garantir une démonstration fonctionnelle immédiate hors-ligne.
    }

    return this.generateHeuristicBeats(request)
  }

  /**
   * Générateur heuristique de beats stop-motion hors-ligne basé sur l'analyse lexicale du script.
   */
  private generateHeuristicBeats(request: AIGenerationRequest): AIGenerationResponse {
    const text = request.scriptText.toLowerCase()
    const duration = request.durationMs || 10000
    const beats: AIGenerationResponse['beats'] = []

    // 1. Initialisation de la posture de départ (t = 0ms)
    beats.push({
      timeMs: 0,
      targetSlot: 'torso',
      action: 'posture_neutre',
      suggestedTag: 'neutral',
      reasoning: 'Départ présentateur face caméra'
    })
    beats.push({
      timeMs: 0,
      targetSlot: 'head',
      action: 'regard_droit',
      suggestedTag: 'front',
      reasoning: 'Tête droite face au téléspectateur'
    })
    beats.push({
      timeMs: 0,
      targetSlot: 'mouth',
      action: 'bouche_fermee',
      suggestedTag: 'closed',
      reasoning: 'Silence avant de démarrer le texte'
    })

    // 2. Détection d'émotions clés et d'actions dans le texte
    if (text.includes('sourire') || text.includes('bonjour') || text.includes('bienvenue')) {
      beats.push({
        timeMs: Math.min(500, duration * 0.1),
        targetSlot: 'mouth',
        action: 'sourire_accueillant',
        suggestedTag: 'smile',
        reasoning: 'Accueil chaleureux du public'
      })
      beats.push({
        timeMs: Math.min(600, duration * 0.12),
        targetSlot: 'eyes',
        action: 'yeux_souriants',
        suggestedTag: 'happy',
        reasoning: 'Expression faciale bienveillante'
      })
    }

    if (text.includes('micro') || text.includes('annonce')) {
      beats.push({
        timeMs: Math.min(1500, duration * 0.2),
        targetSlot: 'arms_right',
        action: 'prise_micro',
        suggestedTag: 'mic',
        reasoning: 'Geste présentateur tenant le micro'
      })
    }

    if (text.includes('urgent') || text.includes('breaking') || text.includes('exclusif') || text.includes('choc')) {
      beats.push({
        timeMs: Math.min(2500, duration * 0.3),
        targetSlot: 'foreground',
        action: 'ambiance_premier_plan',
        suggestedTag: 'ambiance',
        reasoning: 'Renforcement visuel de l’information urgente au premier plan'
      })
      beats.push({
        timeMs: Math.min(2600, duration * 0.32),
        targetSlot: 'mouth',
        action: 'bouche_surprise_ouverte',
        suggestedTag: 'surprised',
        reasoning: 'Étonnement face à la nouvelle'
      })
    }

    // 3. Simulation de phonèmes stop-motion durant la lecture
    const step = 800
    for (let t = 1000; t < duration - 1000; t += step) {
      const phonemes = ['talk_a', 'talk_o', 'talk_e', 'closed']
      const chosen = phonemes[Math.floor((t / step) % phonemes.length)]
      beats.push({
        timeMs: t,
        targetSlot: 'mouth',
        action: `phoneme_${chosen}`,
        suggestedTag: chosen,
        reasoning: `Animation labiale stop-motion à ${t}ms`
      })
    }

    // 4. Clôture de la séquence
    beats.push({
      timeMs: Math.max(0, duration - 500),
      targetSlot: 'mouth',
      action: 'bouche_repos',
      suggestedTag: 'closed',
      reasoning: 'Fin de réplique'
    })

    const validated = AIGenerationResponseSchema.parse({
      summary: `Découpage automatique généré pour un script de ${duration}ms (${beats.length} beats).`,
      beats: beats.sort((a, b) => a.timeMs - b.timeMs)
    })

    return validated
  }
}

export const aiClientService = new AIClientService()
