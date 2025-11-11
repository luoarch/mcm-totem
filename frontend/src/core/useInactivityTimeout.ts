import { useCallback, useEffect, useRef } from 'react'

type UseInactivityTimeoutOptions = {
  timeoutMs: number
  onTimeout: () => void
  events?: string[]
}

const DEFAULT_EVENTS = ['pointerdown', 'keydown', 'touchstart']

export function useInactivityTimeout({
  timeoutMs,
  onTimeout,
  events = DEFAULT_EVENTS,
}: UseInactivityTimeoutOptions) {
  const callbackRef = useRef(onTimeout)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    callbackRef.current = onTimeout
  }, [onTimeout])

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const scheduleTimer = useCallback(() => {
    clearTimer()
    timerRef.current = window.setTimeout(() => {
      callbackRef.current()
      scheduleTimer()
    }, timeoutMs)
  }, [clearTimer, timeoutMs])

  const resetTimer = useCallback(() => {
    scheduleTimer()
  }, [scheduleTimer])

  useEffect(() => {
    resetTimer()

    const handleEvent = () => {
      resetTimer()
    }

    events.forEach((event) => {
      window.addEventListener(event, handleEvent, { passive: true, capture: true })
    })

    return () => {
      clearTimer()
      events.forEach((event) => {
        window.removeEventListener(event, handleEvent, true)
      })
    }
  }, [events, resetTimer, clearTimer])

  return { resetTimer }
}

