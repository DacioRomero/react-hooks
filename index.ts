import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

// Used to ensure types
type Key<T> = Extract<keyof T, Field>
type Values<T> = T[Key<T>]
type Entries<T> = [Key<T>, Values<T>]
type PotentialPromise<T> = T | Promise<T>

const keys = Object.keys as <T>(o: T) => Key<T>[]
// const values = Object.values as <T>(o: T) => Values<T>[]
const entries = Object.entries as <T>(o: T) => Entries<T>[]

type Field = string
type Val = any // eslint-disable-line @typescript-eslint/no-explicit-any

type State = Record<Field, Val>

type VerifyErrors<S extends State> = {
  [F in Key<S>]?: string
}

export type Verifier<S extends State, F extends Field> = (value: S[F], otherValues: Omit<S, F>) => PotentialPromise<string | void>;

export type Verifiers<S extends State> = {
  [F in Key<S>]: Verifier<S, F>
}

export type SubmitCallback<S extends State> = (state: S) => PotentialPromise<void>

type SetFieldCallback<V extends Val> = (value: V) => V

type SetField<V extends Val> = (valueOrCB: SetFieldCallback<V> | V) => void;

export interface ControlledField<V extends Val> {
  set: SetField<V>;
  handleChange: ChangeEventHandler<HTMLInputElement>;
  value: V;
  verifyError?: string;
}

export type ControlledFields<S extends State> = {
  [P in Key<S>]: ControlledField<S[P]>
}

export type SyntheticEventHandler = (e: SyntheticEvent) => void | boolean

export interface Config<S extends State> {
  initialState: S;
  verifiers?: Verifiers<S>;
  submitCallback?: SubmitCallback<S>;
}

export interface Form<S extends State> {
  fields: ControlledFields<S>;
  submit(): Promise<void>;
  handleSubmit: SyntheticEventHandler;
  isSubmitting: boolean;
  clearErrors(): void;
}

export default function useForm<S extends State> ({ initialState, verifiers, submitCallback }: Config<S>): Form<S> {
  type VE = VerifyErrors<S>
  type CF = ControlledFields<S>
  type PCF = Partial<CF>
  type Fields = Key<S>

  const [state, setState] = useState(initialState)
  const [verifyErrors, setVerifyErrors] = useState<VE>({});
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
    }, {}) as CF

  async function submit(): Promise<void> {
    let errors: VE = {}

    if (verifiers) {
      errors = await keys(state)
        .filter((field): boolean => verifiers.hasOwnProperty(field))
        .reduce<Promise<VE>>(async (accPromise, field): Promise<VE> => {
          const { [field]: value, ...otherValues } = state

          const error = await Promise.resolve(verifiers[field](value, otherValues))
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

    setVerifyErrors(errors)

    const noErrors = Object.keys(errors).length === 0

    if (submitCallback && noErrors) {
      setIsSubmitting(true)
      await Promise.resolve(submitCallback(state))
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
