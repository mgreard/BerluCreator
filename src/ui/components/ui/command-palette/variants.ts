import { cva } from 'class-variance-authority'

export const commandPaletteContentVariants = cva(
  'fixed left-1/2 top-[20%] -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl p-0 overflow-hidden rounded-3xl bg-bg-surface/95 backdrop-blur-2xl border border-border-default shadow-glass-2xl transition-all duration-200 ease-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none select-none',
  {
    variants: {
      size: {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-2xl'
      }
    },
    defaultVariants: {
      size: 'md'
    }
  }
)
