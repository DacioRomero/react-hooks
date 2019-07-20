import { useMemo, useState, useRef, useCallback, useEffect } from "react";

// export const useFakeRef: typeof useRef = (initialValue) => {
//   return useState({ current: initialValue })[0]
// }

export const useFakeMemo: typeof useMemo = (factory, deps) => {
  const [value, setValue] = useState(factory)

  useFakeEffect(() => {
    setValue(factory())
  }, deps)

  return value
}

export const useFakeCallback: typeof useCallback = (callback, deps) => {
  return useFakeMemo(() => callback, deps)
}

export const useFakeEffect: typeof useEffect = (effect, deps) => {
  const depsRef = useRef(deps)

  const { current: prevDeps } = depsRef

  if (prevDeps === undefined) {
    if (deps instanceof Array) {
      throw new Error('Cannot add deps after init')
    } else {
      return effect()
    }
  } else if (!(deps instanceof Array)) {
    throw new Error('Cannot remove deps after init')
  }

  if (deps !== prevDeps) {
    if (deps.length !== prevDeps.length) {
      throw new Error('Cannot change number of deps after init')
    }

    const depsChanged = prevDeps.some((value, index) => value !== deps[index])

    if (depsChanged) {
      depsRef.current = prevDeps

      return effect()
    }
  }
}
