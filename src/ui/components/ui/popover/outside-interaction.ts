export function guardPopoverOutsideInteraction(event: Event, selector?: string): boolean {
  if (!selector) return false
  const originalTarget = (event as CustomEvent<{ originalEvent?: Event }>).detail?.originalEvent
    ?.target
  const target = originalTarget instanceof Element ? originalTarget : event.target
  if (!(target instanceof Element) || !target.closest(selector)) return false
  event.preventDefault()
  return true
}
