# SplashScreen

Le composant `SplashScreen` fournit un écran de chargement plein écran, élégant et fluide pour l'application **Incroyaux News Studio**.

---

## Fonctionnalités

- **Logo SVG Haute Définition** : Rendu vectoriel dynamique avec dégradés personnalisés (Jaune solaire pour *Incroyaux*, Violet électrique pour *News*, Blanc épuré pour *STUDIO*).
- **Animations Subtiles** : Dégradé de brillance traversant le texte (*shimmer*), halos lumineux d'ambiance pulsants et transition de sortie en fondu avec léger flou.
- **Support Déterminé & Indéterminé** : Barre de progression animée avec ou sans pourcentage.
- **Prévention du Scintillement** : Prop `minDurationMs` garantissant un affichage agréable même sur les réseaux ou machines très rapides.
- **Accessibilité WAI-ARIA** : Rôles sémantiques `status` et `progressbar` avec état `aria-busy`.

---

## Props

| Nom | Type | Défaut | Description |
|---|---|---|---|
| `isLoading` | `boolean` | `true` | Contrôle la visibilité et déclenche la transition de sortie |
| `statusMessage` | `string` | `'Chargement du studio...'` | Texte d'état affiché sous le logo |
| `progress` | `number` | `undefined` | Pourcentage d'avancement (0 à 100). Indéterminé si omis |
| `showProgress` | `boolean` | `true` | Affiche ou masque la barre de progression |
| `minDurationMs` | `number` | `1000` | Durée minimale d'affichage en millisecondes |
| `class` | `string` | `undefined` | Classes CSS utilitaires additionnelles |

---

## Emits

| Événement | Payload | Description |
|---|---|---|
| `completed` | `void` | Émis après la fin complète de la transition de sortie du DOM |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SplashScreen } from '@/components/ui/splash-screen'

const isAppLoading = ref(true)
const loadingStatus = ref('Initialisation du studio...')

onMounted(async () => {
  loadingStatus.value = 'Chargement des assets...'
  await loadAssets()
  loadingStatus.value = 'Prêt !'
  isAppLoading.value = false
})
</script>

<template>
  <div>
    <SplashScreen
      :is-loading="isAppLoading"
      :status-message="loadingStatus"
      :min-duration-ms="1200"
    />
    <main v-show="!isAppLoading">
      <!-- Contenu principal -->
    </main>
  </div>
</template>
```
