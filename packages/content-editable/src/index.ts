import { useRef, SyntheticEvent, Ref } from 'react'

interface BasicElement {
  innerText: string
}

interface Config<T extends BasicElement> {
  value: string
  onChange(e: SyntheticEvent<T> & { target: { value: string } }): void
}

type SyntheticEventHandler<T> = (e: SyntheticEvent<T>) => void

interface ContentEditable<T> {
  ref: Ref<T | undefined>
  onInput: SyntheticEventHandler<T>
}

// WIP
export function useContentEditable<T extends BasicElement>({
  value,
  onChange
}: Config<T>): ContentEditable<T> {
  const ref = useRef<T>(null)

  const { current: elem } = ref

  if (elem && value) {
    elem.innerText = value
  }

  const onInput: SyntheticEventHandler<T> = (e): void => {
    const { current: elem } = ref

    if (!elem || !onChange) {
      return
    }

    onChange({
      ...e,
      target: {
        ...e.target,
        value: elem.innerText
      }
    })
  }

  return {
    ref,
    onInput
  }
}
