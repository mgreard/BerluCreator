import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 font-semibold no-underline select-none whitespace-nowrap cursor-pointer transition-all duration-300 ease-out outline-none border border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.98] touch-manipulation',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-text-inverse font-bold hover:bg-primary-hover active:bg-primary-active shadow-glass-sm',
        secondary:
          'bg-bg-surface text-text-primary border-border-default hover:bg-bg-surface-hover hover:border-border-hover active:bg-bg-surface-active shadow-glass-sm backdrop-blur-md',
        ghost:
          'bg-transparent text-text-secondary hover:bg-bg-surface-hover hover:text-text-primary active:bg-bg-surface-active',
        destructive:
          'bg-danger-bg text-danger border-danger/30 hover:bg-danger/25 active:bg-danger-bg font-semibold',
        accent:
          'bg-accent text-violet-950 font-bold hover:brightness-110 active:brightness-95 shadow-glass-sm'
      },
      size: {
        sm: 'min-h-[32px] px-3.5 py-1 text-xs',
        md: 'min-h-[40px] px-5 py-2 text-sm',
        lg: 'min-h-[48px] px-6 py-3 text-base'
      },
      shape: {
        pill: 'rounded-full',
        rounded: 'rounded-xl'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      shape: 'rounded'
    }
  }
)
