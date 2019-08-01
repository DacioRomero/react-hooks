import { useRef, useCallback } from 'react'

export function useDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number = 0
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<number>()

  return useCallback(
    (...args: Parameters<T>): void => {
      clearTimeout(timeoutRef.current)

      // TODO: Figure out how to use normal setTimeout with window
      timeoutRef.current = setTimeout(() => {
        func(...args)
      }, wait)
    },
    [func, wait]
  )
}
