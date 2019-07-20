import { useMemo, useState, useRef, useCallback, useEffect } from "react";

// export const useFakeRef: typeof useRef = (initialValue) => {
//   return useState({ current: initialValue })[0]
// }

export const useFakeMemo: typeof useMemo = (factory, deps) => {
  const [value, setValue] = useState(factory)

  // Might not be called first run
  useFakeEffect(() => {
    setValue(factory())
  }, deps)

  return value
}

export const useFakeCallback: typeof useCallback = (callback, deps) => {
  return useFakeMemo(() => callback, deps)
}

type UseEffect = typeof useEffect
type UseEffectParameters = Parameters<UseEffect>

interface EffectRef {
  prevDeps: UseEffectParameters[1];
  cleanup: ReturnType<UseEffectParameters[0]>;
}

// TODO: Call cleanup on unmount
export const useFakeEffect: UseEffect = (effect, deps) => {
  // Using a ref to prevent rerenders
  const ref = useRef<EffectRef>({
    prevDeps: deps,
    cleanup: undefined
  })

  const {
    current: {
      prevDeps,
      cleanup
    }
  } = ref

  function update () {
    if (cleanup) {
      cleanup()
    }

    ref.current = {
      prevDeps: deps,
      cleanup: effect()
    }
  }

  if (!prevDeps) {
    if (deps) {
      throw new Error('Cannot add deps after init')
    } else {
      // Update every time with no deps
      return update()
    }
  } else if (!deps) {
    throw new Error('Cannot remove deps after init')
  }

  // Run update on first call, potentially hacky
  if (deps === prevDeps) {
    return update()
  }

  if (deps.length !== prevDeps.length) {
    throw new Error('Cannot change number of deps after init')
  }

  // Empty array with return false
  const depsChanged = prevDeps.some((value, index) => value !== deps[index])

  if (depsChanged) {
    return update()
  }
}
