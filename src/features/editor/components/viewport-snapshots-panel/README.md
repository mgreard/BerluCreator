# ViewportSnapshotsPanel

Panneau métier latéral permettant d’enregistrer, charger et supprimer les compositions du viewport.

Le composant utilise `v-model:open`. Il est conçu pour être placé dans un `ResizableSidebar` droit. Charger une composition replie le panneau après restauration du document, comme l’ancienne modale se fermait après cette action.

Les vues sont présentées sous forme de lignes compactes contenant une miniature, leur nom, leur date, le nombre de calques et les actions existantes.
