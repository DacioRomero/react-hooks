import { useMemo } from 'react'

export function useRandom (): number {
  return useMemo(() => Math.random(), [])
}

export function useOdds (odds: number): boolean {
  return useRandom() >= odds
}

export function useFiftyFifty (): boolean  {
  return useOdds(0.5)
}
