import type { CaretCoordinates } from './types'

const PROPERTIES_TO_COPY = [
  'boxSizing',
  'direction',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'height',
  'letterSpacing',
  'lineHeight',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'tabSize',
  'textAlign',
  'textDecoration',
  'textIndent',
  'textTransform',
  'width',
  'wordBreak',
  'wordSpacing',
  'wordWrap',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle'
] as const

/**
 * Calcule avec précision les coordonnées physiques du curseur (caret)
 * dans un input ou textarea à l'aide d'un clone Mirror DOM éphémère.
 */
export function getCaretCoordinates(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  position: number
): CaretCoordinates {
  if (!element || typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 0, left: 0, height: 20 }
  }

  const isInput = element.tagName.toLowerCase() === 'input'
  const computed = window.getComputedStyle(element)

  const mirror = document.createElement('div')
  mirror.style.position = 'absolute'
  mirror.style.visibility = 'hidden'
  mirror.style.pointerEvents = 'none'
  mirror.style.top = '-9999px'
  mirror.style.left = '-9999px'
  mirror.style.overflow = 'hidden'

  // Copie intégrale des propriétés typographiques et de boîte
  for (const prop of PROPERTIES_TO_COPY) {
    mirror.style[prop] = computed[prop]
  }

  if (isInput) {
    mirror.style.whiteSpace = 'pre'
  } else {
    mirror.style.whiteSpace = 'pre-wrap'
    mirror.style.wordWrap = 'break-word'
    mirror.style.overflowWrap = 'break-word'
  }

  const value = element.value || ''
  const textBefore = value.substring(0, position)
  const textAfter = value.substring(position)

  mirror.textContent = textBefore

  const marker = document.createElement('span')
  marker.textContent = '|'
  mirror.appendChild(marker)

  const restText = document.createTextNode(textAfter)
  mirror.appendChild(restText)

  document.body.appendChild(mirror)

  const offsetLeft = marker.offsetLeft
  const offsetTop = marker.offsetTop
  const markerHeight = marker.offsetHeight || parseInt(computed.lineHeight) || 20

  const top = offsetTop - element.scrollTop
  const left = offsetLeft - element.scrollLeft

  document.body.removeChild(mirror)

  return {
    top: Math.max(0, top),
    left: Math.max(0, left),
    height: markerHeight
  }
}
