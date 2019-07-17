import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

type Optional<T> = T | undefined | null

type Field = string
type Value = any // eslint-disable-line @typescript-eslint/no-explicit-any

type ExtractFields<S> = Extract<keyof S, Field>

type State = Record<Field, Value>

type VerifyErrors<S extends State> = {
  [F in ExtractFields<S>]?: string
}

type Verifier<S extends State, F extends Field> = (value: S[F], otherValues: Omit<S, F>) => Promise<string | void>;

export type Verifiers<S extends State> = {
  [F in ExtractFields<S>]: Verifier<S, F>
}

export type SubmitCallback<S extends State> = (state: S) => Promise<void>

type SetFieldCallback<V extends Value> = (value: V) => V

type SetField<V extends Value> = (valueOrCB: SetFieldCallback<V> | V) => void;

export interface ControlledField<V extends Value> {
  set: SetField<V>;
  handleChange: ChangeEventHandler<HTMLInputElement>;
  value: V;
  verifyError?: string;
}

type ControlledFields<S extends State> = {
  [P in ExtractFields<S>]: ControlledField<S[P]>
}

type SyntheticEventHandler = (e: SyntheticEvent) => void | boolean

interface Config<S extends State> {
  initialState: S;
  verifiers?: Verifiers<S>;
  submitCallback?: SubmitCallback<S>;
}

interface Form<S extends State> {
  fields: ControlledFields<S>;
  submit(): Promise<void>;
  handleSubmit: SyntheticEventHandler;
  isSubmitting: boolean;
  clearErrors(): void;
}

// Used to ensure types
type Keys<T> = Extract<keyof T, string>[]
type Values<T> = T[Keys<T>[number]][]
type Entries<T> = [Keys<T>[number], Values<T>[number]][]

const entries = Object.entries as <T>(o: T) => Entries<T>
const keys = Object.keys as <T>(o: T) => Keys<T>
// const values = Object.values as <T>(o: T) => Values<T>

export default function useForm<S extends State> ({ initialState, verifiers, submitCallback }: Config<S>): Form<S> {
  type VES = VerifyErrors<S>
  type CFS = ControlledFields<S>
  type PCF = Partial<CFS>
  type Fields = ExtractFields<S>

  const [state, setState] = useState(initialState)
  const [verifyErrors, setVerifyErrors] = useState<VES>({});
  const [isSubmitting, setIsSubmitting] = useState(false)

  function setField<F extends Fields>(field: F): SetField<S> {
    return (valueOrCB): void => setState((prevState): S => ({
      ...prevState,
      [field]: valueOrCB instanceof Function ? valueOrCB(prevState[field]): valueOrCB
    }))
  }

  function handleFieldChange<F extends Fields>(field: F): ChangeEventHandler<HTMLInputElement> {
    return (event): void => {
      event.preventDefault()

      const { value } = event.target

      setState((prevState): S => ({
        ...prevState,
        [field]: value
      }))
    }
  }

  const fields = entries(state)
    .reduce<PCF>((acc, [field, value]): PCF => {
      return {
        ...acc,
        [field]: {
          set: setField(field),
          handleChange: handleFieldChange(field),
          value,
          verifyError: verifyErrors[field]
        }
      }
    }, {}) as CFS

  async function submit(): Promise<void> {
    let errors: Optional<VES>

    if (verifiers) {
      errors = await keys(state)
        .filter((field): boolean => verifiers.hasOwnProperty(field))
        .reduce<Promise<VES>>(async (accPromise, field): Promise<VES> => {
          const { [field]: value, ...otherValues } = state

          const error = await verifiers[field](value, otherValues)
          const acc = await accPromise

          if (error) {
            return {
              ...acc,
              [field]: error
            }
          }

          return acc
        }, Promise.resolve({}))
    }

    setVerifyErrors(errors || {})

    const noErrors = !errors || Object.keys(errors).length === 0

    if (submitCallback && noErrors) {
      setIsSubmitting(true)
      await submitCallback(state)
      setIsSubmitting(false)
    }
  }

  function handleSubmit (e: SyntheticEvent): void {
    e.preventDefault()
    submit()
  }

  function clearErrors(): void {
    setVerifyErrors({})
  }

  return { fields, submit, handleSubmit, isSubmitting, clearErrors }
}
