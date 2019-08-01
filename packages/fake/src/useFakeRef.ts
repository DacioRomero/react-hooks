import { useRef, useState } from 'react'

type UseRef = typeof useRef

// > useRef() is basically useState({current: initialValue })[0]
// https://twitter.com/dan_abramov/status/1099842565631819776
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useFakeRef: UseRef = (initialValue?: unknown): ReturnType<UseRef> => {
  return useState({ current: initialValue })[0]
}

export default useFakeRef
