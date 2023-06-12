import { FocusEvent, ReactNode, useState } from 'react'
import styled from 'styled-components/macro'

const InputWrapper = styled.div<NumericInputProps>`
  display: flex;
  justify-content: flex-end;
  max-width: 190px;
  width: 100%;
  height: 60px;
  padding: 6px;
  border-radius: 2px;
  outline: ${({ error, parentStyles }) => (error && '1px solid #FF9C9C') || parentStyles?.outline};
  color: ${({ error, parentStyles }) => (error && '#FF9C9C') || parentStyles?.color};
  background: ${({ error, parentStyles }) => (error && '#FFF4F4') || parentStyles?.background};
  &: hover {
    background: ${({ error }) => (error && '#FFF4F4') || '#F5F4FF'};
    outline: ${({ error }) => (error && '1px solid #FF9C9C') || '1px solid #DDE0FF'};
  }
`

const Input = styled.input`
  text-align: right;
  font-style: normal;
  font-weight: 500;
  font-size: 22px;
  line-height: 144.52%;
  width: 100%;
  height: 32px;
  border: none;
  outline: none;
  background: inherit;
  color: inherit;
  ::placeholder {
    color: #d0b2ff;
  }
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
`

type NumericInputProps = {
  error?: boolean
  children?: ReactNode
  parentStyles?: Styles
}

type Styles = {
  background: string
  color: string
  outline: string
}

export const NumericInput = (props: NumericInputProps) => {
  const [parentStyles, setParentStyles] = useState({ background: 'transparent', color: '#D0B2FF', outline: 'none' })

  const handleParentStyles = (e: FocusEvent<HTMLInputElement>) => {
    if (e.type === 'focus') {
      setParentStyles({ background: '#F5F4FF', color: '#6B11FF', outline: '1px solid #DDE0FF' })
    }

    if (e.type === 'blur') {
      setParentStyles({ background: 'transparent', color: '#6B11FF', outline: 'none' })
    }
  }

  return (
    <InputWrapper parentStyles={parentStyles} {...props}>
      <Input
        autoFocus
        inputMode="decimal"
        pattern="^[0-9]*[.,]?[0-9]*$"
        placeholder="0.00"
        minLength={1}
        maxLength={79}
        type="number"
        spellCheck="false"
        onFocus={handleParentStyles}
        onBlur={handleParentStyles}
      />
    </InputWrapper>
  )
}
