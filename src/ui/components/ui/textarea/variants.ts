import { cva } from 'class-variance-authority'

export const textareaContainerVariants = cva(
  'relative flex w-full min-w-0 bg-bg-surface hover:bg-bg-surface-hover border border-border-default hover:border-border-hover rounded-xl transition-all duration-150 overflow-hidden box-border text-text-primary shadow-xs focus-within:border-border-focus focus-within:bg-bg-surface focus-within:ring-2 focus-within:ring-primary/15',
  {
    variants: {
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
      hasError: false,
      disabled: false
    }
  }
)
