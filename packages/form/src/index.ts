import {
  useState,
  ChangeEventHandler,
  SyntheticEvent,
  InputHTMLAttributes
} from 'react'

// Used to ensure types
type Key<T> = Extract<keyof T, string>
type Value<T> = T[Key<T>]
type Entry<T> = [Key<T>, Value<T>]

type PropertyValue = any // eslint-disable-line @typescript-eslint/no-explicit-any
type State = Record<PropertyKey, PropertyValue>
type PotentialPromise<T> = T | Promise<T>

export type Verifier<S extends State, K extends PropertyKey> = (
  value: S[K],
  otherValues: Omit<S, K>
) => PotentialPromise<string | void>

export type Verifiers<S extends State> = {
  readonly [F in Key<S>]: Verifier<S, F>
}

type FieldErrors<S extends State> = {
  readonly [F in Key<S>]?: string
}

export type VerifyCallback<S extends State> = (
  state: S
) => PotentialPromise<void>
export type ErrorParser<S extends State> = (
  e: unknown
) => PotentialPromise<void | FieldErrors<S>>

export interface Config<S extends State> {
  readonly initialState: S
  readonly verifiers?: Verifiers<S>
  readonly verifyCallback?: VerifyCallback<S>
  readonly handleErrors?: ErrorParser<S>
}

type SetFieldCallback<V extends PropertyValue> = (value: V) => V
type SetField<V extends PropertyValue> = (
  valueOrCB: SetFieldCallback<V> | V
) => void

export interface Field<V extends PropertyValue> {
  readonly set: SetField<V>
  readonly handleChange: ChangeEventHandler<{ value: V }>
  readonly value: V
  readonly verifyError?: string
  readonly postError?: string
}

export type Fields<S extends State> = {
  readonly [P in Key<S>]: Field<S[P]>
}

export type SyntheticEventHandler = (e: SyntheticEvent) => void | boolean

export interface Form<S extends State> {
  readonly fields: Fields<S>
  readonly submit: () => Promise<void>
  readonly handleSubmit: SyntheticEventHandler
  readonly isSubmitting: boolean
  readonly clearErrors: () => void
}

const keys = Object.keys as <T>(o: T) => Key<T>[]
// const values = Object.values as <T>(o: T) => Values<T>[]
const entries = Object.entries as <T>(o: T) => Entry<T>[]

const emptyObj: object = Object.freeze(Object.create(null))

export default function useForm<S extends State = State>({
  initialState,
  verifiers,
  verifyCallback,
  handleErrors
}: Config<S>): Form<S> {
  type FE = FieldErrors<S>
  type CF = Fields<S>
  type PCF = Partial<CF>
  type K = Key<S>

  const [state, setState] = useState(initialState)
  const [verifyErrors, setVerifyErrors] = useState<FE>(emptyObj)
  const [postErrors, setPostErrors] = useState<FE>(emptyObj)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField<F extends K>(field: F): SetField<S[F]> {
    return (valueOrCB): void =>
      setState(
        (prevState): S => {
          const value =
            valueOrCB instanceof Function
              ? valueOrCB(prevState[field])
              : valueOrCB

          return Object.freeze({
            ...prevState,
            [field]: value
          })
        }
      )
  }

  function handleFieldChange<F extends K>(
    field: F
  ): ChangeEventHandler<{ value: S[F] }> {
    return (event): void => {
      event.preventDefault()

      if (event.target.value) {
      }

      const { value } = event.target

      setState(
        (prevState): S =>
          Object.freeze({
            ...prevState,
            [field]: value
          })
      )
    }
  }

  const fields = entries(state).reduce<PCF>(
    (acc, [field, value]): PCF =>
      Object.freeze<PCF>({
        ...acc,
        [field]: Object.freeze({
          set: setField(field),
          handleChange: handleFieldChange(field),
          value,
          verifyError: verifyErrors[field],
          postError: postErrors[field]
        })
      }) as PCF,
    emptyObj
  ) as CF

  async function submit(): Promise<void> {
    const verifyErrors: FE = verifiers
      ? await keys(state).reduce<Promise<FE>>(async (acc, field): Promise<
          FE
        > => {
          if (!verifiers.hasOwnProperty(field)) {
            return await acc
          }

          const { [field]: value, ...otherValues } = state

          const error = await Promise.resolve(
            verifiers[field](value, otherValues)
          )

          if (!error) {
            return await acc
          }

          return Object.freeze({
            ...(await acc),
            [field]: error
          })
        }, Promise.resolve(emptyObj))
      : emptyObj

    setVerifyErrors(verifyErrors)

    const noErrors = Object.keys(verifyErrors).length === 0

    if (verifyCallback && noErrors) {
      setIsSubmitting(true)

      try {
        await Promise.resolve(verifyCallback(state))
      } catch (e) {
        // Ensure errors ojbect
        const postErrors: FE =
          (handleErrors &&
            Object.freeze(await Promise.resolve(handleErrors(e)))) ||
          emptyObj

        setPostErrors(postErrors)
      }

      setIsSubmitting(false)
    }
  }

  function handleSubmit(e: SyntheticEvent): void {
    e.preventDefault()
    submit()
  }

  function clearErrors(): void {
    setVerifyErrors(emptyObj)
    setPostErrors(emptyObj)
  }

  return { fields, submit, handleSubmit, isSubmitting, clearErrors }
}
