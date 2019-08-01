import { useEffect } from 'react'
import useDoUpdate from './useDoUpdate'
import useFakeRef from './useFakeRef'

type UseEffect = typeof useEffect

type Cleanup = () => void

const useFakeEffect: UseEffect = (effect, deps): void => {
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

export default useFakeEffect
