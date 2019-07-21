import {
  useRef,
  SyntheticEvent
} from 'react'

interface BasicElement { innerText: string }

interface Config<T extends BasicElement> extends Record<PropertyKey, any> {
  value: string;
  onChange(e: SyntheticEvent<T> & { target: { value: string } }): void;
}

// WIP
export function useContentEditable<T extends BasicElement = any> ({ value, onChange, ...props }: Config<T>) {
  const ref = useRef<T>()

  if (ref.current !== undefined && value !== undefined) {
    ref.current.innerText = value
  }

  function onInput (e: SyntheticEvent<T>) {
    if (ref.current === undefined || onChange === undefined) {
      return
    }

    onChange ({
      ...e,
      target: {
        ...e.target,
        value: ref.current.innerText
      }
    })
  }

  return {
    ref,
    onInput,
    ...props
  }
}
