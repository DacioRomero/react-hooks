import { useCallback } from 'react'

import useFakeMemo from './useFakeMemo'

type UseCallback = typeof useCallback

// > useCallback(fn, deps) is equivalent to useMemo(() => fn, deps).
// - https://reactjs.org/docs/hooks-reference.html#usecallback
const useFakeCallback: UseCallback = (callback, deps): typeof callback =>
  useFakeMemo((): typeof callback => callback, deps)

export default useFakeCallback
