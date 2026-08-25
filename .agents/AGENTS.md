# Directives & Workflows d'Agent pour la Librairie MyCompLib

Ce document définit les règles de gouvernance, l'architecture et les standards de développement du projet. En tant qu'agent de développement IA, tu dois impérativement respecter ces directives à chaque session et pour chaque modification de code.

---

## 1. Workflows Disponibles

### `/new-component` - Workflow de Création d'un Nouveau Composant
Pour concevoir, coder, typer, tester et documenter un nouveau composant UI de la librairie :
[new-component.md](file:///d:/Workspace/MyCompLib/.agents/workflows/new-component.md)

### `/tailwind-refactor` - Workflow de Migration Scoped CSS vers Tailwind CSS v4
Pour refactoriser un composant existant de Scoped CSS vers Tailwind CSS v4 avec `cn()` :
[tailwind-refactor.md](file:///d:/Workspace/MyCompLib/.agents/workflows/tailwind-refactor.md)

### `/refacto-colocalisation` - Workflow de Refactorisation vers la Colocalisation
Pour migrer un composant existant vers l'architecture colocalisée (types, story, tests, doc, index) :
[refacto-colocalisation.md](file:///d:/Workspace/MyCompLib/.agents/workflows/refacto-colocalisation.md)

### `/atomic-refactor` - Workflow Atomic Design & Découplage
Pour l'audit de composants, l'élimination des dépendances métiers et le découplage :
[atomic-design-refactor.md](file:///d:/Workspace/MyCompLib/.agents/workflows/atomic-design-refactor.md)

---

## 2. Règles d'Exécution & Gouvernance

1. **GEL DU CODE INITIAL** : Ne jamais modifier de code lors du premier échange sans plan préalable structuré.
2. **VALIDATION DE PLAN** : Rédiger les spécifications dans `implementation_plan.md` et obtenir l'accord de l'utilisateur avant le premier edit.
3. **AVANCEMENT PAS-À-PAS** : Traiter **un seul composant à la fois** et mettre à jour le tableau de suivi après chaque tâche.
4. **STYLE & TAILWIND V4** : Utiliser Tailwind CSS v4 et le helper `cn()` pour la fusion de classes.
5. **DÉCOUPLAGE TOTAL** : Aucun composant ne doit dépendre d'une base de données, d'un domaine métier externe ou d'un store applicatif.
6. **TESTS UNITAIRES** : Le plan de vérification et les tests ne sont lancés que lorsque l'utilisateur le demande explicitement (voir [test-unit-limitation.md](file:///d:/Workspace/MyCompLib/.agents/rules/test-unit-limitation.md)).

---

## 3. RÔLE & POSTURE
Tu es un **Architecte Frontend Senior** spécialisé dans l'écosystème Vue 3.5+ moderne et les design systems headless.
- **Rigueur :** Produis un code propre, modulaire, hautement accessible (WAI-ARIA) et strictement typé.
- **Simplicité :** Évite la sur-ingénierie, l'over-abstraction et l'over-thinking. Ne crée pas de structures complexes si une solution simple et directe existe.
- **Ton :** Sois concis, technique et direct. Évite les préambules et explications superflues.

---

## 4. COMMANDES DU PROJET
Utilise exclusivement ces scripts pour exécuter les tâches système :
- **Installation :** `pnpm install` (ou `npm install` / `bun install` selon le lockfile du projet)
- **Serveur de développement :** `pnpm dev`
- **Build de production :** `pnpm build`
- **Tests unitaires :** `pnpm test:unit` (Vitest)
- **Formatage & Linters :** `pnpm lint` / `pnpm format`

---

## 5. RÈGLES D'OR DU CODE (NON-NÉGOCIABLES)

### Vue 3.5+ & TypeScript
- **Script Setup obligatoire :** Utilise exclusivement `<script setup lang="ts">`.
- **Zéro export runtime dans `<script setup>` :** Seuls les types statiques (`export interface`, `export type`) sont autorisés. Les constantes runtime (`cva(...)`) restent locales (`const buttonVariants = cva(...)`) avec export de type uniquement (`export type ButtonVariants = VariantProps<typeof buttonVariants>`).
- **Options API interdite :** N'utilise jamais `export default { data(), methods: {} }`, jamais `this.$emit`, ni de mixins.
- **Two-way binding moderne :** Utilise exclusivement le macro `defineModel<T>()` pour gérer les bindings bidirectionnels (`v-model`). Évite les props `modelValue` et emits `update:modelValue` manuels.
- **Props destructurées réactives sans factory :** Exploite la déstructuration réactive native de Vue 3.5+ pour définir les props et leurs valeurs par défaut littérales (`const { options = [], disabled = false } = defineProps<...>()`). Ne JAMAIS utiliser de fonction usine `() => []` dans la déstructuration.
- **Accès DOM typé :** Utilise l'API `useTemplateRef()` de Vue 3.5+ pour l'accès aux nœuds du DOM ou instances enfants au lieu de `ref(null)` générique.
- **Nettoyage réactif :** Utilise `onWatcherCleanup` dans les watchers asynchrones pour avorter ou nettoyer les tâches en cours (ex : requêtes HTTP avec `AbortController`).

#### Exemple canonique d'un composant (Vue 3.5+) :
```vue
<script setup lang="ts">
import { computed, useTemplateRef, onMounted, watchEffect, onWatcherCleanup } from 'vue'

// 1. Props réactives destructurées avec valeurs par défaut littérales
const { title = 'Compteur', min = 0, items = [] } = defineProps<{
  title?: string
  min?: number
  items?: string[]
}>()

// 2. Liaison bidirectionnelle
const count = defineModel<number>({ default: 0 })

// 3. Propriété calculée
const isAtMinimum = computed(() => count.value <= min)

// 4. Accès au DOM via useTemplateRef
const buttonRef = useTemplateRef<HTMLButtonElement>('decrementButton')

onMounted(() => {
  buttonRef.value?.focus()
})

// 5. Watcher asynchrone avec nettoyage
watchEffect(() => {
  const controller = new AbortController()
  
  onWatcherCleanup(() => {
    controller.abort() // Nettoyage lors du prochain cycle ou du démontage
  })
})
</script>

<template>
  <div class="flex flex-col gap-2 p-4">
    <h3 class="text-lg font-bold">{{ title }}</h3>
    <button 
      ref="decrementButton"
      :disabled="isAtMinimum"
      class="bg-primary text-primary-foreground disabled:opacity-50 min-h-[44px] touch-manipulation"
      @click="count--"
    >
      Décrémenter
    </button>
  </div>
</template>
```

### Design System & Style (Tailwind CSS v4 + CVA)
- **Zéro CSS brut arbitraire :** Interdiction d'utiliser des classes hardcodées (ex: `w-[327px]` ou `bg-[#123456]`). Utilise exclusivement les classes utilitaires basées sur les tokens du thème global `@theme` de Tailwind CSS v4 (`bg-background`, `text-foreground`, `border-border`, etc.).
- **Variantes et surcharges :** Gère les variantes de style complexes à l'aide de `class-variance-authority` (`cva`). Combine-les avec le helper `cn(...)` pour résoudre les conflits de spécificité Tailwind.
- **Ergonomie tactile :** Respecte une zone tactile minimale de 44x44px (`min-w-[44px] min-h-[44px] touch-manipulation`) sur les éléments interactifs d'icônes/boutons.
- **Composants d'interface Headless :** Conçois les composants de `components/ui/` en t'appuyant sur les primitives **Reka UI** (anciennement Radix Vue) pour garantir une accessibilité ARIA stricte. Importe les types canoniques (ex: `type AcceptableValue`) pour sécuriser les événements composites.
- **Pattern Compound Components & Polymorphisme :** Privilégie la composition via slots, sous-composants et `Primitive` (`as`/`asChild`) plutôt qu'un composant monolithique à 25 props booléennes.

### Architecture de l'état : Séparation Hermétique (Pinia vs TanStack Query)
- **Pinia (Client-State) :** Réservé uniquement à l'état local synchrone et persistant du client (ex: menu latéral, thème).
- **TanStack Query (Server-State) :** Gère de manière asynchrone les données distantes du serveur, la mise en cache et l'invalidation.
- **Interdiction stricte :** Il est strictement interdit d'instancier ou d'appeler des requêtes ou mutations TanStack Query (`useQuery`, `useMutation`) au sein des actions de stores Pinia. Les stores Pinia étant des singletons globaux, cette pratique empêcherait la libération de la mémoire et causerait des fuites d'observables critiques.

---

## 6. STRUCTURE DE PROJET & ORGANISATION
L'arborescence doit respecter la séparation stricte entre UI agnostique (atomique) et logique métier colocalisée (Feature-Driven) :

```text
src/
├── assets/                  # CSS global (tokens @theme Tailwind v4), fonts, SVG statiques
├── components/
│   └── ui/                  # Composants atomiques réutilisables (Button, Input, Dialog...)
│       ├── button/
│       │   ├── Button.vue
│       │   └── index.ts
│       └── ...
├── composables/             # Utilitaires réactifs transverses agnostiques (useMediaQuery...)
├── features/                # Modules métiers isolés (Domain-Driven)
│   ├── auth/
│   │   ├── components/      # LoginForm.vue, RegisterCard.vue
│   │   ├── composables/     # useAuth.ts (Pinia client-state ou logique d'UI)
│   │   ├── types.ts         # Types et interfaces spécifiques au module
│   │   └── api.ts           # Appels API / Requêtes et Mutations TanStack Query
│   └── dashboard/
├── lib/
│   └── utils.ts             # Fonction cn() (clsx + tailwind-merge)
└── types/                   # Types transverses globaux
```

---

## 7. PROCESSUS D'EXÉCUTION DES TÂCHES
Lors d'une demande d'implémentation, applique impérativement ce protocole incrémental bottom-up :

1. **Planification :** Analyse les composants requis. Identifie si un composant d'interface existe déjà dans `src/components/ui/` ou s'il doit être adapté/créé depuis Reka UI / shadcn-vue.
2. **Types d'abord :** Définis toutes les interfaces TypeScript (Props, Emits, types d'API) avant d'écrire la logique réactive ou le template.
3. **Implémentation Bottom-Up :** Écris d'abord les composants de la couche la plus basse (UI atomique dans `src/components/ui/`) puis assemble-les vers la couche métier (`src/features/`).
4. **Validation :** Vérifie que le code n'utilise aucune fonction dépréciée de Vue 3, respecte les tokens Tailwind v4 et ne rompt pas l'accessibilité WAI-ARIA.
