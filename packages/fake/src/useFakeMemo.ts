import { useMemo, useState } from 'react'

import useDoUpdate from './useDoUpdate'

type UseMemo = typeof useMemo

const useFakeMemo: UseMemo = (factory, deps): ReturnType<typeof factory> => {
  const [state, setState] = useState(factory)
  const doUpdate = useDoUpdate(deps)

  if (doUpdate) {
    const newState = factory()
    setState(newState)

    return newState
  }

  return state
}

export default useFakeMemo
