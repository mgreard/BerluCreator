import { cva } from 'class-variance-authority'

export const paginationButtonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-40 cursor-pointer touch-manipulation',
  {
    variants: {
      size: {
        sm: 'min-w-[36px] h-9 px-2 text-xs',
        md: 'min-w-[44px] h-11 px-3 text-xs font-semibold',
        lg: 'min-w-[48px] h-12 px-4 text-sm font-semibold'
      },
      variant: {
        default:
          'bg-bg-surface/50 border border-border-default hover:bg-bg-surface-hover hover:border-border-default/80 text-text-primary shadow-glass-xs',
        outline:
          'border border-border-default hover:bg-bg-surface-hover/70 hover:border-primary/50 text-text-primary',
        ghost: 'hover:bg-bg-surface-hover text-text-primary',
        glass: 'glass-interactive shadow-glass-xs text-text-primary'
      },
      active: {
        true: 'bg-primary text-text-inverse font-bold shadow-glass-sm border-primary hover:bg-primary-hover hover:border-primary',
        false: ''
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      active: false
    }
  }
)
