'use client'

import { useEffect, useRef, useState } from 'react'

// Debounced localStorage state — auto-saves after `delay` ms of inactivity.
export function usePersistentState<T>(key: string, initial: T, delay = 500): [T, (v: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) as T : initial
    } catch {
      return initial
    }
  })

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify(state))
      } catch {}
    }, delay)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [key, state, delay])

  return [state, setState]
}

export function clearPersistentState(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {}
}
