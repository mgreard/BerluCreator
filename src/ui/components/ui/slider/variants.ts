import { cva } from 'class-variance-authority'

export const sliderTrackVariants = cva(
  'relative grow rounded-full bg-bg-surface-hover/80 overflow-hidden transition-colors',
  {
    variants: {
      size: {
        sm: 'data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1 data-[orientation=vertical]:h-full',
        md: 'data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-2 data-[orientation=vertical]:h-full',
        lg: 'data-[orientation=horizontal]:h-3 data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-3 data-[orientation=vertical]:h-full'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
)

export const sliderRangeVariants = cva('absolute rounded-full', {
  variants: {
    variant: {
      primary: 'bg-primary',
      success: 'bg-success',
      warning: 'bg-warning',
      danger: 'bg-danger',
      accent: 'bg-primary-subtle text-primary border-primary/30',
      gradient: 'bg-gradient-to-r from-primary via-primary-hover to-info'
    },
    size: {
      sm: 'data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
      md: 'data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full',
      lg: 'data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full'
    }
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md'
  }
})

export const sliderThumbVariants = cva(
  "relative block rounded-full border border-border-default bg-bg-surface backdrop-blur-md shadow-glass-md transition-[background-color,border-color,box-shadow] duration-150 ease-out hover:scale-110 active:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base cursor-grab active:cursor-grabbing touch-manipulation disabled:pointer-events-none disabled:opacity-50 after:content-[''] after:absolute after:-inset-3 after:min-w-[44px] after:min-h-[44px] after:pointer-events-auto",
  {
    variants: {
      size: {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
      },
      variant: {
        primary: 'border-primary/40 hover:border-primary',
        success: 'border-success/40 hover:border-success',
        warning: 'border-warning/40 hover:border-warning',
        danger: 'border-danger/40 hover:border-danger',
        accent: 'border-primary/40 hover:border-primary',
        gradient: 'border-primary/40 hover:border-primary'
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'primary'
    }
  }
)
