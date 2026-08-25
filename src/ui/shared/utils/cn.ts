import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge<'mcl-typography'>({
  extend: {
    classGroups: {
      'mcl-typography': [
        {
          text: [
            'display-hero',
            'title-page',
            'title-section',
            'title-card',
            'title-sm',
            'body-lead',
            'body',
            'body-sm',
            'caption',
            'overline',
            'code'
          ]
        }
      ]
    }
  }
})

/**
 * Combine et fusionne conditionnellement les classes Tailwind CSS
 * en résolvant proprement les conflits de spécificité.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
