import { useMemo } from 'react'

type Params = Record<string, string | undefined>

const fromEntries = Object.fromEntries as <T extends PropertyKey, K>(entries: Iterable<readonly [T, K]>) => { [P in T]: K }

export function useSearch<T extends Params = Params>(search: string): Params & T {
  return useMemo(() => fromEntries(new URLSearchParams(search)) as Params & T, [search])
}
