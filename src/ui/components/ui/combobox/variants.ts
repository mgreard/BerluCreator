import { cva } from 'class-variance-authority'

export const comboboxTriggerVariants = cva(
  'relative inline-flex items-center justify-between w-full bg-bg-surface border border-border-default rounded-xl transition-all duration-150 text-text-primary outline-none select-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-bg-base',
  {
    variants: {
      size: {
        sm: 'min-h-[36px] py-1.5 px-3 text-xs',
        md: 'min-h-[44px] py-2 px-3.5 text-sm touch-manipulation',
        lg: 'min-h-[48px] py-3 px-4 text-base touch-manipulation'
      },
      error: {
        true: 'border-danger focus-within:ring-danger/40',
        false: 'hover:border-border-default/80 focus-within:border-primary'
      },
      disabled: {
        true: 'opacity-50 cursor-not-allowed bg-bg-surface/30 pointer-events-none',
        false: ''
      }
    },
    defaultVariants: {
      size: 'md',
      error: false,
      disabled: false
    }
  }
)
