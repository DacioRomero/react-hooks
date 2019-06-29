import { useState, ChangeEventHandler, SyntheticEvent } from 'react';

type Field = string
type Value = any // eslint-disable-line @typescript-eslint/no-explicit-any

type State = Record<Field, Value>
type VerifyErrors = Record<Field, string>

type PotentialPromise<T> = Promise<T> | T

type Verifier = (value: Value, otherValues: State) => PotentialPromise<string | void>
export type Verifiers = Record<Field, Verifier>
export type SubmitCallback = (state: State) => PotentialPromise<void>

type SetFieldCallback = (value: Value) => Value
type SetField = (valueOrCB: SetFieldCallback | Value) => void

export interface ControlledField {
  set: SetField;
  handleChange: ChangeEventHandler<HTMLInputElement>;
  value: Value;
  error?: string;
}

type ControlledFields = Record<string, ControlledField>

type SyntheticEventHandler = (e: SyntheticEvent) => void

interface Form {
  fields: ControlledFields;
  submit: VoidFunction;
  handleSubmit: SyntheticEventHandler;
  submitting: boolean;
  clearErrors: VoidFunction;
}


const initalErrors: VerifyErrors = {}
const initalFields: ControlledFields = {}
const initialErrors: PotentialPromise<VerifyErrors> = {}

export default function useForm (initalState: State, verifiers?: Verifiers, submitCallback?: SubmitCallback): Form {
  const [state, setState] = useState(initalState)
  const [errors, setErrors] = useState(initalErrors);
  const [submitting, setSubmitting] = useState(false)

  const setField = (field: Field): SetField => (valueOrCB): void => setState((prevState): State => ({
    ...prevState,
    [field]: valueOrCB instanceof Function ? valueOrCB(prevState[field]): valueOrCB
  }))

  const handleFieldChange = (field: Field): ChangeEventHandler<HTMLInputElement> => (e): void => {
    e.preventDefault()

    const { value } = e.target

    return setState((prevState): State => ({
      ...prevState,
      [field]: value
    }))
  }

  const fields = Object.entries(state)
    .reduce((prev, [field, value]): ControlledFields => {
      return {
        ...prev,
        [field]: {
          set: setField(field),
          handleChange: handleFieldChange(field),
          value,
          error: errors[field]
        }
      }
    }, initalFields)

  const submit = async (): Promise<void> => {
    let errors: VerifyErrors | undefined

    if (verifiers) {
      errors = await Object.keys(state)
        .filter((field): boolean => verifiers.hasOwnProperty(field))
        .reduce(async (prev, field): Promise<VerifyErrors> => {
          const { [field]: value, ...otherValues } = state

          const error = await verifiers[field](value, otherValues)
          const prevErrors = await prev

          if (error) {
            return {
              ...prevErrors,
              [field]: error
            }
          }

          return prevErrors
        }, initialErrors)
    }

    setErrors(errors || {})

    const noErrors = !errors || Object.keys(errors).length === 0

    if (submitCallback && noErrors) {
      setSubmitting(true)
      await submitCallback(state)
      setSubmitting(false)
    }
  }

  const handleSubmit: SyntheticEventHandler = (e): void => {
    e.preventDefault()
    submit()
  }

  const clearErrors = (): void => setErrors({})

  return { fields, submit, handleSubmit, submitting, clearErrors }
}
