import { useRef, useCallback, useEffect } from 'react'

function throwInvalidCall(): never {
  throw new Error('Cannot call debounced function during first mount')
}

export interface Options {
  leading?: boolean
  trailing?: boolean
  maxWait?: number
}

export function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 0,
  { leading = false, trailing = true, maxWait }: Options = {}
): (...args: Parameters<T>) => void {
  const funcRef = useRef<T | typeof throwInvalidCall>(throwInvalidCall)
  const timeoutRef = useRef<number>()
  const delayStart = useRef<number | null>(null)

  useEffect(() => {
    funcRef.current = func
  })

  return useCallback(
    (...args: Parameters<T>): void => {
      clearTimeout(timeoutRef.current)

      const isDelayed = !!delayStart.current
      const now = Date.now()

      if (isDelayed) {
        if (
          maxWait &&
          delayStart.current &&
          now - delayStart.current > maxWait
        ) {
          funcRef.current(...args)

          delayStart.current = now
        }
      } else {
        delayStart.current = now
      }

      if (leading && !isDelayed) {
        funcRef.current(...args)
      }

      timeoutRef.current = setTimeout((): void => {
        if (trailing) {
          funcRef.current(...args)
        }

        delayStart.current = null
      }, wait)
    },
    [wait, leading, trailing, maxWait]
  )
}
