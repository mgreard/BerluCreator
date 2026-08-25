import { cva } from 'class-variance-authority'

export const otpSlotVariants = cva(
  'flex items-center justify-center font-mono font-bold text-center rounded-2xl transition-all duration-150 select-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base disabled:pointer-events-none disabled:opacity-40 touch-manipulation cursor-text',
  {
    variants: {
      size: {
        sm: 'w-10 h-11 text-base',
        md: 'w-12 h-14 text-lg',
        lg: 'w-14 h-16 text-xl'
      },
      variant: {
        default:
          'bg-bg-surface/50 border border-border-default hover:border-border-default/80 text-text-primary shadow-glass-xs focus:border-primary focus:bg-bg-surface',
        filled:
          'bg-bg-surface-hover/80 border border-transparent hover:border-border-default text-text-primary focus:border-primary focus:bg-bg-surface',
        bordered:
          'bg-transparent border-2 border-border-default hover:border-border-default/80 text-text-primary focus:border-primary focus:bg-bg-surface/30',
        glass: 'glass-interactive text-text-primary shadow-glass-sm focus:border-primary'
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'default'
    }
  }
)
