# AuthLayout

Composant d'agencement pour écrans d'authentification (Connexion, Inscription, Réinitialisation de mot de passe, 2FA) avec fond lumineux d'ambiance GPU, marque et carte centrale `glass-premium`.

---

## Fonctionnalités

- **Esthétique Moderne :** Effets de halo lumineux d'ambiance et carte d'élévation translucide.
- **En-tête de Marque Personnalisable :** Titre, slogan et icône paramétrables.
- **Pied de Page Dédié :** Slot `#footer` pour mentions légales et liens d'assistance.

---

## Props

| Prop         | Type     | Défaut                                | Description                         |
| :----------- | :------- | :------------------------------------ | :---------------------------------- |
| `brandTitle` | `string` | `'MyCompLib'`                         | Nom du produit ou de l'organisation |
| `brandIcon`  | `string` | `'diamond'`                           | Nom de l'icône de marque            |
| `tagline`    | `string` | `'Connexion à votre espace sécurisé'` | Accroche sous le titre              |
| `cardWidth`  | `string` | `'max-w-md'`                          | Largeur maximale de la carte        |
| `class`      | `string` | `undefined`                           | Classes CSS complémentaires         |

---

## Exemple d'utilisation

```vue
<script setup lang="ts">
import { AuthLayout } from '@/components/ui/auth-layout'
</script>

<template>
  <AuthLayout brand-title="Acme Corp" tagline="Accédez à votre espace membre">
    <form>
      <!-- Formulaire de connexion -->
    </form>
  </AuthLayout>
</template>
```
