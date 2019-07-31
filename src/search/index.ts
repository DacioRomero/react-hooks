import { useContext, useMemo, useState } from "react";
import { __RouterContext } from "react-router";
import { filter } from 'wu'

const fromEntries = Object.fromEntries as <T extends PropertyKey, K>(entries: Iterable<readonly [T, K]>) => { [P in T]: K }

type Keys = string[]
type Search<T extends Keys> = { [P in T[number]]?: string }
type SetSearch = (search: string) => void

function useSearch<T extends Keys>(search: string, setSearch: SetSearch, ...keys: T): Search<T> {
  const params = useMemo(() => new URLSearchParams(search), [search])
  const dict = fromEntries(filter(([key]) => keys.includes(key), params)) as Search<T>

  return new Proxy(dict, {
    set(_, prop: string, value: string) {
      params.set(prop, value)
      setSearch(params.toString())
      return true
    }
  })
}

type UseSearch = <T extends Keys>(...keys: T) => Search<T>

export const useRouterSearch: UseSearch = (...keys) => {
  const {
    location: { search },
    history: { push }
  } = useContext(__RouterContext)

  const setSearch: SetSearch = (search) => {
    push({ search })
  }

  return useSearch(search, setSearch, ...keys)
}

export const useWindowSearch: UseSearch = (...keys) => {
  const {
    location: { search }
  } = window

  const [, forceUpdate] = useState()

  const setSearch: SetSearch = (search) =>  {
    window.location.search = search
    forceUpdate(undefined)
  }

  return useSearch(search, setSearch, ...keys)
}
