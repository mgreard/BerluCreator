import { ref, isRef, type Ref, watch, nextTick } from 'vue'
import type { MentionTrigger, CaretCoordinates } from './types'
import { getCaretCoordinates } from './caret'

export interface UseMentionInputOptions<T = unknown> {
  triggers: Ref<MentionTrigger<T>[]> | MentionTrigger<T>[]
  editorRef: Ref<HTMLTextAreaElement | HTMLInputElement | null>
  onSelect?: (item: T, trigger: MentionTrigger<T>) => void
}

export function useMentionInput<T = unknown>(options: UseMentionInputOptions<T>) {
  const { editorRef, onSelect } = options

  const getTriggers = (): MentionTrigger<T>[] => {
    return isRef(options.triggers) ? options.triggers.value : options.triggers
  }

  const isOpen = ref(false)
  const isLoading = ref(false)
  const items = ref<T[]>([]) as Ref<T[]>
  const activeIndex = ref(0)
  const activeTrigger = ref<MentionTrigger<T> | null>(null)
  const query = ref('')
  const caretPosition = ref<CaretCoordinates>({ top: 0, left: 0, height: 20 })
  const mentionStartIndex = ref(-1)

  let searchRequestId = 0

  function close() {
    isOpen.value = false
    isLoading.value = false
    activeTrigger.value = null
    items.value = []
    activeIndex.value = 0
    mentionStartIndex.value = -1
    query.value = ''
  }

  async function executeSearch(trigger: MentionTrigger<T>, q: string) {
    const currentReqId = ++searchRequestId
    isLoading.value = true
    isOpen.value = true

    try {
      const result = trigger.search(q)
      if (result instanceof Promise) {
        const data = await result
        if (currentReqId === searchRequestId) {
          items.value = Array.isArray(data) ? data : []
        }
      } else {
        if (currentReqId === searchRequestId) {
          items.value = Array.isArray(result) ? result : []
        }
      }
    } catch {
      if (currentReqId === searchRequestId) {
        items.value = []
      }
    } finally {
      if (currentReqId === searchRequestId) {
        isLoading.value = false
        activeIndex.value = 0
      }
    }
  }

  function checkTrigger() {
    const el = editorRef.value
    if (!el) {
      close()
      return
    }

    const cursorPos = el.selectionStart ?? 0
    const text = el.value || ''
    const textBefore = text.substring(0, cursorPos)
    const currentTriggers = getTriggers()

    if (!currentTriggers || currentTriggers.length === 0) {
      close()
      return
    }

    let bestTrigger: MentionTrigger<T> | null = null
    let bestStartIndex = -1
    let bestQuery = ''

    for (const trigger of currentTriggers) {
      const char = trigger.char
      const lastIndex = textBefore.lastIndexOf(char)

      if (lastIndex !== -1 && lastIndex >= bestStartIndex) {
        // Le trigger doit être en début de ligne ou précédé d'un espace/saut de ligne
        const isStart = lastIndex === 0 || /\s/.test(textBefore[lastIndex - 1])
        const queryCandidate = textBefore.substring(lastIndex + char.length)

        const containsInvalidWhitespace = trigger.allowSpaces
          ? /[\r\n]/.test(queryCandidate)
          : /\s/.test(queryCandidate)

        if (isStart && !containsInvalidWhitespace) {
          bestTrigger = trigger
          bestStartIndex = lastIndex
          bestQuery = queryCandidate
        }
      }
    }

    if (bestTrigger && bestStartIndex !== -1) {
      activeTrigger.value = bestTrigger
      mentionStartIndex.value = bestStartIndex
      query.value = bestQuery
      caretPosition.value = getCaretCoordinates(el, cursorPos)
      executeSearch(bestTrigger, bestQuery)
    } else {
      close()
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen.value) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (items.value.length > 0) {
        activeIndex.value = (activeIndex.value + 1) % items.value.length
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (items.value.length > 0) {
        activeIndex.value = (activeIndex.value - 1 + items.value.length) % items.value.length
      }
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      if (
        items.value.length > 0 &&
        activeIndex.value >= 0 &&
        activeIndex.value < items.value.length
      ) {
        event.preventDefault()
        selectItem(items.value[activeIndex.value])
      }
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  function selectItem(item: T) {
    const el = editorRef.value
    const trigger = activeTrigger.value

    if (!el || !trigger || mentionStartIndex.value < 0) {
      close()
      return
    }

    const formatted = trigger.format(item)
    const currentCursor = el.selectionStart ?? el.value.length

    el.focus()
    // Utilisation de l'API native physique setRangeText pour préserver l'historique Undo / Redo
    el.setRangeText(formatted, mentionStartIndex.value, currentCursor, 'select')
    const newPos = mentionStartIndex.value + formatted.length
    el.setSelectionRange(newPos, newPos)
    el.dispatchEvent(new Event('input', { bubbles: true }))

    onSelect?.(item, trigger)
    close()
  }

  function openWithTrigger(trigger: MentionTrigger<T>) {
    const el = editorRef.value
    if (!el) return

    el.focus()
    const cursorPos = el.selectionStart ?? el.value.length
    const text = el.value || ''
    const needsLeadingSpace = cursorPos > 0 && !/\s/.test(text[cursorPos - 1])
    const insertText = (needsLeadingSpace ? ' ' : '') + trigger.char

    el.setRangeText(insertText, cursorPos, cursorPos, 'select')
    const newPos = cursorPos + insertText.length
    el.setSelectionRange(newPos, newPos)
    el.dispatchEvent(new Event('input', { bubbles: true }))

    nextTick(() => {
      checkTrigger()
    })
  }

  // Nettoyage asynchrone lors du démontage ou changement de configuration
  watch(
    () => (isRef(options.triggers) ? options.triggers.value : options.triggers),
    () => {
      if (isOpen.value) {
        checkTrigger()
      }
    }
  )

  return {
    isOpen,
    isLoading,
    items,
    activeIndex,
    activeTrigger,
    query,
    caretPosition,
    mentionStartIndex,
    checkTrigger,
    handleKeyDown,
    selectItem,
    openWithTrigger,
    close
  }
}
