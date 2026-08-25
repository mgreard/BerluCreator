import { cva } from 'class-variance-authority'

export const mentionContainerVariants = cva(
  '@container relative flex flex-col w-full min-w-0 bg-bg-surface/60 border border-border-default rounded-xl transition-all duration-150 text-text-primary backdrop-blur-md focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:z-30',
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
