export interface BreadcrumbItem {
  label: string
  to?: string | object
  href?: string
  icon?: string
  onClick?: () => void
  active?: boolean
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: string
  compact?: boolean
  class?: string
}
