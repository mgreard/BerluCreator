import type { App, Plugin } from 'vue'

// Import de la feuille de style Tailwind CSS v4 & theme
import './styles/index.css'

// ==========================================
// 1. Composables, Services & Utilitaires
// ==========================================
export { useVirtualGrid } from './shared/composables/useVirtualGrid'
export type { VirtualGridOptions, VirtualGridItem } from './shared/composables/useVirtualGrid'

export { useTheme } from './shared/composables/useTheme'
export type { Theme, UseThemeReturn } from './shared/composables/useTheme'

export {
  toastService,
  activeToasts,
  showToast,
  removeToast,
  toast,
  useToast
} from './shared/services/toast.service'
export type { ToastMessage, UseToastReturn } from './shared/services/toast.service'

export { cn } from './shared/utils/cn'

// ==========================================
// 2. Exports de tous les Composants & Types UI
// ==========================================
export * from './components/ui'

// ==========================================
// 3. Plugin d'installation globale Vue
// ==========================================
import {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  CategoryBadge,
  Checkbox,
  Chip,
  Combobox,
  CommandPalette,
  DataTable,
  DataTableCell,
  Drawer,
  DropdownMenu,
  EmptyState,
  FieldError,
  Fieldset,
  FormGroup,
  GridCascade,
  Heading,
  Icon,
  IconButton,
  Input,
  Kbd,
  LightboxModal,
  LoadingState,
  MentionChip,
  MentionInput,
  MentionText,
  Modal,
  OtpInput,
  PageHeader,
  PageLayout,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  SearchInput,
  SectionBlock,
  SelectableSurface,
  SegmentedControl,
  Select,
  Separator,
  Shell,
  Skeleton,
  Slider,
  Spinner,
  SplitButton,
  StarRating,
  SubtypeBadge,
  Switch,
  Tabs,
  Text,
  Textarea,
  ToastContainer,
  Tooltip,
  TopHeaderBar,
  DashboardLayout,
  AuthLayout,
  LayoutProvider
} from './components/ui'

const components = {
  Accordion,
  Alert,
  AlertDialog,
  Avatar,
  AvatarGroup,
  Badge,
  Breadcrumb,
  Button,
  ButtonGroup,
  Card,
  CategoryBadge,
  Checkbox,
  Chip,
  Combobox,
  CommandPalette,
  DataTable,
  DataTableCell,
  Drawer,
  DropdownMenu,
  EmptyState,
  FieldError,
  Fieldset,
  FormGroup,
  GridCascade,
  Heading,
  Icon,
  IconButton,
  Input,
  Kbd,
  LightboxModal,
  LoadingState,
  MentionChip,
  MentionInput,
  MentionText,
  Modal,
  OtpInput,
  PageHeader,
  PageLayout,
  Pagination,
  Popover,
  Progress,
  RadioGroup,
  SearchInput,
  SectionBlock,
  SelectableSurface,
  SegmentedControl,
  Select,
  Separator,
  Shell,
  Skeleton,
  Slider,
  Spinner,
  SplitButton,
  StarRating,
  SubtypeBadge,
  Switch,
  Tabs,
  Text,
  Textarea,
  ToastContainer,
  Tooltip,
  TopHeaderBar,
  DashboardLayout,
  AuthLayout,
  LayoutProvider
}

export const createMyCompLib = (): Plugin => {
  return {
    install(app: App) {
      for (const [name, component] of Object.entries(components)) {
        app.component(name, component)
      }
    }
  }
}

const MyCompLib = /* @__PURE__ */ createMyCompLib()

export default MyCompLib
