import { cva } from 'class-variance-authority'

export const inputContainerVariants = cva(
  'relative inline-flex items-center w-full min-w-0 bg-bg-surface/90 hover:bg-bg-surface border border-border-default hover:border-border-hover rounded-xl transition-all duration-150 overflow-hidden box-border text-text-primary shadow-glass-xs backdrop-blur-md focus-within:border-border-focus focus-within:bg-bg-surface focus-within:ring-2 focus-within:ring-primary/15',
  {
    variants: {
      size: {
        sm: 'min-h-[32px] text-xs',
        md: 'min-h-[40px] text-sm',
        lg: 'min-h-[48px] text-base'
      },
      hasError: {
        true: 'border-danger focus-within:border-danger focus-within:ring-danger/20',
        false: ''
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed bg-bg-surface/30 pointer-events-none',
        false: ''
      }
    },
    defaultVariants: {
      size: 'md',
      hasError: false,
      disabled: false
    }
  }
)
