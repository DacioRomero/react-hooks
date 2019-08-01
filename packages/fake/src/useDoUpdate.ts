import { DependencyList } from 'react'

import useFakeRef from './useFakeRef'

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

export default useDoUpdate
