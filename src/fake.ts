import { useMemo, useState, useRef, useCallback } from "react";

// export const useFakeRef: typeof useRef = (initialValue) => {
//   return useState({ current: initialValue })[0]
// }

export const useFakeMemo: typeof useMemo = (factory, deps) => {
  const [value, setValue] = useState(factory)
  const depsRef = useRef(deps)

  const { current: prevDeps } = depsRef

  if (prevDeps === undefined) {
    if (deps instanceof Array) {
      throw new Error('Cannot add deps after init')
    } else {
      return value
    }
  } else if (!(deps instanceof Array)) {
    throw new Error('Cannot remove deps after init')
  }

  if (deps !== prevDeps) {
    if (deps.length !== prevDeps.length) {
      throw new Error('Cannot change number of deps after init')
    }

    for (let i = 0; i < deps.length; i++) {
      if (deps[i] !== prevDeps[i]) {
        depsRef.current = prevDeps
        const newValue = factory()

        setValue(newValue)

        return newValue
      }
    }
  }

  return value
}

export const useFakeCallback: typeof useCallback = (callback, deps) => {
  return useFakeMemo(() => callback, deps)
}
