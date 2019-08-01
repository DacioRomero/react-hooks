import {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  DependencyList
} from 'react'

type UseRef = typeof useRef

// > useRef() is basically useState({current: initialValue })[0]
// https://twitter.com/dan_abramov/status/1099842565631819776
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useFakeRef: UseRef = (
  initialValue?: unknown
): ReturnType<UseRef> => {
  return useState({ current: initialValue })[0]
}

type UseEffect = typeof useEffect

function useDoUpdate(deps?: DependencyList): boolean {
  // Using a ref to prevent rerenders
  const ref = useFakeRef(deps)

  const { current: prevDeps } = ref

  if (!prevDeps) {
    if (deps) {
      throw new Error('Cannot add deps after init')
    } else {
      // Update every time with no deps
      return true
    }
  } else if (!deps) {
    throw new Error('Cannot remove deps after init')
  }

  if (deps.length !== prevDeps.length) {
    throw new Error('Cannot change number of deps after init')
  }

  // Empty array will return false
  return prevDeps.some((value, index): boolean => value !== deps[index])
}

type Cleanup = () => void

export const useFakeEffect: UseEffect = (effect, deps): void => {
  const doUpdate = useDoUpdate(deps)
  const cleanupRef = useFakeRef<Cleanup>()
  const firstCallRef = useFakeRef(true)

  function update(): void {
    // Run effect after update
    setTimeout((): void => {
      const { current: cleanup } = cleanupRef

      if (cleanup) {
        cleanup()
      }

      cleanupRef.current = effect() || undefined
    }, 0)
  }

  // Update on first call
  if (firstCallRef.current) {
    firstCallRef.current = false
    return update()
  }

  if (doUpdate) {
    return update()
  }
}

type UseMemo = typeof useMemo

export const useFakeMemo: UseMemo = (
  factory,
  deps
): ReturnType<typeof factory> => {
  const [state, setState] = useState(factory)
  const doUpdate = useDoUpdate(deps)

  if (doUpdate) {
    const newState = factory()
    setState(newState)

    return newState
  }

  return state
}

type UseCallback = typeof useCallback

// > useCallback(fn, deps) is equivalent to useMemo(() => fn, deps).
// - https://reactjs.org/docs/hooks-reference.html#usecallback
export const useFakeCallback: UseCallback = (callback, deps): typeof callback =>
  useFakeMemo((): typeof callback => callback, deps)
