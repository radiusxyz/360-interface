import React, { FocusEvent, ReactNode, useState } from 'react'
import styled from 'styled-components/macro'

const InputWrapper = styled.div<NumericInputProps>`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 190px;
  width: 100%;
  height: 60px;
  padding: 5px;
  border-radius: 2px;
  border: ${({ error, parentStyles }) => (error && '1px solid #FF9C9C') || parentStyles?.border};
  color: ${({ error, parentStyles }) => (error && '#FF9C9C') || parentStyles?.color};
  background: ${({ error, parentStyles }) => (error && '#FFF4F4') || parentStyles?.background};
  &: hover {
    background: ${({ error }) => (error && '#FFF4F4') || '#F5F4FF'};
    border: ${({ error }) => (error && '1px solid #FF9C9C') || '1px solid #DDE0FF'};
  }
  background: #f5f4ff;
  color: #6b11ff;
  border: 1px solid #dde0ff;
`

const Input = styled.input`
  text-align: right;
  font-style: normal;
  font-weight: 500;
  font-size: 22px;
  line-height: 144.52%;
  width: 100%;
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

const BalanceUSD = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 144.52%;
  text-align: right;
  color: inherit;
`

type NumericInputProps = {
  error?: boolean
  children?: ReactNode
  parentStyles?: Styles
  isSelected?: boolean
}

type Styles = {
  background: string
  color: string
  border: string
}

export const NumericInput = (props: NumericInputProps) => {
  const [parentStyles, setParentStyles] = useState({ background: 'transparent', color: '#D0B2FF', border: 'none' })

  const handleParentStyles = (e: FocusEvent<HTMLInputElement>) => {
    if (e.type === 'focus') {
      setParentStyles({ background: '#F5F4FF', color: '#6B11FF', border: '1px solid #DDE0FF' })
    }

    if (e.type === 'blur') {
      setParentStyles({ background: 'transparent', color: '#6B11FF', border: 'none' })
    }
  }

  return (
    <InputWrapper parentStyles={parentStyles} {...props}>
      <Input
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
      {props.isSelected && <BalanceUSD>$0.00</BalanceUSD>}
    </InputWrapper>
  )
}
