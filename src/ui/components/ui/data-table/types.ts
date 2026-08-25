import type { PaginationVariant, PaginationSize } from '@/components/ui/pagination'
import type { DropdownMenuItemDef } from '@/components/ui/dropdown-menu'

export type DataTableVariant = 'default' | 'striped' | 'bordered' | 'glass'
export type DataTableSize = 'sm' | 'md' | 'lg'
export type SortOrder = 'asc' | 'desc' | null
export type ColumnPinned = 'left' | 'right' | false
export type CellEditType = 'text' | 'number' | 'select' | 'tags' | 'relation' | 'boolean' | 'custom'
export type ColumnFilterType =
  'text' | 'select' | 'multi-select' | 'boolean' | 'number-range' | 'custom'
export type ColumnResizeMode = 'onChange' | 'onEnd'
export type SelectionMode = 'multiple' | 'single'
export type ColumnAggregationType =
  'sum' | 'avg' | 'min' | 'max' | 'count' | ((values: unknown[], rows: unknown[]) => unknown)

export interface DataTableSelectOption {
  value: string | number | boolean
  label: string
  disabled?: boolean
  description?: string
}

export interface DataTableExpose {
  exportData: (format: 'csv' | 'json', options?: { filename?: string }) => void
  setColumnSize: (columnId: string, size: number) => void
  resetColumnSizing: () => void
  getColumnSize: (columnId: string) => number | undefined
  selectRow: (rowKey: string | number) => void
  deselectAll: () => void
  setGrouping: (columns: string[]) => void
  toggleGrouping: (columnId: string) => void
  clearGrouping: () => void
}

export interface DataTableToolbarProps<T = unknown> {
  variant: DataTableVariant
  searchable: boolean
  searchPlaceholder: string
  enableColumnVisibility: boolean
  columnVisibilityLabel: string
  columns: DataTableColumn<T>[]
  columnVisibility: Record<string, boolean>
  grouping: string[]
  activeFiltersCount: number
  exportable: boolean
  exportMenuItems: DropdownMenuItemDef[]
  refreshable: boolean
  loading: boolean
  isFetching: boolean
  selectedCount: number
  totalCount: number
  visibleColumns: DataTableColumn<T>[]
}

export interface DataTableColumn<T = unknown> {
  /** Clé de la propriété dans l'objet de données */
  key: string
  /** Libellé affiché dans l'en-tête */
  label: string
  /** Rend la colonne triable */
  sortable?: boolean
  /** Active ou désactive le redimensionnement pour cette colonne spécifique */
  resizable?: boolean
  /** Alignement horizontal du texte */
  align?: 'left' | 'center' | 'right'
  /** Largeur personnalisée (ex: "120px", "25%") */
  width?: string
  /** Largeur minimale */
  minWidth?: string
  /** Largeur maximale */
  maxWidth?: string
  /** Figeage sticky de la colonne */
  pinned?: ColumnPinned
  /** Active l'édition inline pour cette colonne */
  editable?: boolean
  /** Type d'éditeur pour cette colonne */
  editType?: CellEditType
  /** Options disponibles si editType est 'select' ou 'relation' */
  editOptions?: DataTableSelectOption[]
  /** Active le filtre sur cette colonne */
  filterable?: boolean
  /** Type d'interface de filtre interactif */
  filterType?: ColumnFilterType
  /** Options de filtre (pour select / multi-select) */
  filterOptions?: DataTableSelectOption[]
  /** Placeholder du champ de saisie de filtre */
  filterPlaceholder?: string
  /** Rend cette colonne éligible au groupement de lignes */
  groupable?: boolean
  /** Type d'agrégation calculé pour cette colonne dans les lignes de groupe */
  aggregation?: ColumnAggregationType
  /** Libellé personnalisé pour l'agrégation affichée */
  aggregationLabel?: string
  /** Classes CSS supplémentaires pour les cellules */
  class?: string
  /** Classes CSS supplémentaires pour l'en-tête */
  headerClass?: string
  /** Fonction de formatage personnalisée (syntaxe méthode pour bivariance) */
  formatter?(value: unknown, item: T): unknown
}

export interface ActiveEditingCell {
  rowKey: string | number
  columnKey: string
}

export interface DataTableProps<T = unknown> {
  /** Définition des colonnes du tableau */
  columns: DataTableColumn<T>[]
  /** Données (utilisées si le v-model data/modelValue n'est pas fourni) */
  data?: T[]
  /** Clé unique identifiant chaque ligne (défaut 'id') */
  keyField?: string
  /** Variante visuelle du tableau */
  variant?: DataTableVariant
  /** Densité d'affichage */
  size?: DataTableSize
  /** Fixe l'en-tête du tableau lors du défilement */
  stickyHeader?: boolean
  /** Active les cases à cocher ou boutons radio de sélection de ligne */
  selectable?: boolean
  /** Mode de sélection de lignes ('multiple' avec checkboxes ou 'single' avec boutons radio) */
  selectionMode?: SelectionMode
  /** Active la sélection automatique au clic direct sur la ligne */
  selectOnClickRow?: boolean
  /** Active le mode de lignes extensibles (Master-Detail) */
  expandable?: boolean
  /** Fonction prédisant si une ligne spécifique peut être étendue */
  canExpand?: (item: T, index: number) => boolean
  /** Déclenche l'expansion au clic direct sur la ligne */
  expandOnClickRow?: boolean
  /** État de chargement avec affichage des skeletons */
  loading?: boolean
  /** Nombre de lignes skeleton à afficher lors du chargement */
  loadingRows?: number
  /** Effet de survol sur les lignes */
  hoverable?: boolean
  /** Texte affiché lorsque le tableau est vide */
  emptyText?: string
  /** Active le mode de virtualisation pour grands volumes */
  virtual?: boolean
  /** Hauteur d'une ligne en mode virtuel (en px) */
  rowHeight?: number
  /** Hauteur du conteneur en mode virtuel (ex: "420px") */
  virtualHeight?: string
  /** Active la barre de recherche globale */
  searchable?: boolean
  /** Placeholder du champ de recherche */
  searchPlaceholder?: string
  /** Active le menu de visibilité / masquage des colonnes */
  enableColumnVisibility?: boolean
  /** Libellé du bouton de visibilité des colonnes */
  columnVisibilityLabel?: string
  /** Active le mode de pagination interne TanStack */
  pagination?: boolean
  /** Active le mode de pagination manuelle (géré côté serveur) */
  manualPagination?: boolean
  /** Active le mode de tri manuel (géré côté serveur) */
  manualSorting?: boolean
  /** Active le mode de filtrage manuel (géré côté serveur) */
  manualFiltering?: boolean
  /** Nombre total de lignes (utilisé en mode serveur pour la pagination) */
  totalRows?: number
  /** Nombre total de pages (utilisé en mode serveur) */
  pageCount?: number
  /** État de rafraîchissement d'arrière-plan discret */
  isFetching?: boolean
  /** État d'erreur du tableau */
  isError?: boolean
  /** Message d'erreur textuel par défaut */
  errorText?: string
  /** Affiche un bouton de rafraîchissement des données dans la barre d'outils */
  refreshable?: boolean
  /** Nombre d'éléments par page si pagination activée */
  pageSize?: number
  /** Choix possibles pour le sélecteur de nombre d'éléments par page */
  pageSizeOptions?: number[]
  /** Affiche le résumé textuel de pagination ("Affichage de 1 à 10 sur 250") */
  showPaginationSummary?: boolean
  /** Affiche le sélecteur de taille de page dans la pagination */
  showPageSizeSelect?: boolean
  /** Variante visuelle de la pagination */
  paginationVariant?: PaginationVariant
  /** Taille de la pagination */
  paginationSize?: PaginationSize
  /** Active le support de l'exportation de données (CSV / JSON) */
  exportable?: boolean
  /** Nom du fichier exporté (sans extension) */
  exportFilename?: string
  /** Formats d'export autorisés */
  exportFormats?: ('csv' | 'json')[]
  /** Active le redimensionnement manuel des colonnes du tableau */
  resizable?: boolean
  /** Mode de validation du redimensionnement ('onChange' continu ou 'onEnd' au relâchement) */
  columnResizeMode?: ColumnResizeMode
  /** Active le mode de groupement de lignes */
  enableGrouping?: boolean
  /** Colonnes de groupement initiales */
  groupBy?: string | string[]
  /** Classes CSS supplémentaires pour le conteneur */
  class?: string
}

export interface DataTableCellProps<T = unknown> {
  /** Valeur brute de la cellule */
  value: unknown
  /** Objet de données de la ligne */
  item: T
  /** Clé de la colonne */
  columnKey: string
  /** Libellé ou configuration de la colonne */
  columnLabel?: string
  /** La cellule est-elle éditable */
  editable?: boolean
  /** Type d'éditeur de la cellule */
  editType?: CellEditType
  /** Options pour les types 'select' et 'relation' */
  options?: DataTableSelectOption[]
  /** Fonction de formatage personnalisée (syntaxe méthode pour bivariance) */
  formatter?(value: unknown, item: T): unknown
  /** Alignement du texte */
  align?: 'left' | 'center' | 'right'
  /** Densité de la cellule */
  size?: 'sm' | 'md' | 'lg'
  /** Largeur maximale de troncature du texte */
  maxTextWidth?: string
  /** Classes CSS supplémentaires */
  class?: string
}
