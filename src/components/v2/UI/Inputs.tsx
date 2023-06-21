import React, { FocusEvent, ReactNode, useState } from 'react'
import styled from 'styled-components/macro'
import { escapeRegExp } from '../../../utils'

const InputWrapper = styled.div<{ error?: boolean; children?: ReactNode; parentStyles?: Styles; isSelected?: boolean }>`
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

type Styles = {
  background: string
  color: string
  border: string
}

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const NumericInput = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  prependSymbol,
  isSelected,
  ...rest
}: {
  children?: ReactNode
  parentStyles?: Styles
  value: string | number
  isSelected: boolean
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  prependSymbol?: string | undefined
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const [parentStyles, setParentStyles] = useState({ background: 'transparent', color: '#D0B2FF', border: 'none' })
  const [placeHolder, setPlaceHolder] = useState<string | undefined>(placeholder)

  const handleParentStyles = (e: FocusEvent<HTMLInputElement>) => {
    if (e.type === 'focus') {
      setPlaceHolder('')
      setParentStyles({ background: '#F5F4FF', color: '#6B11FF', border: '1px solid #DDE0FF' })
    }

    if (e.type === 'blur') {
      setPlaceHolder(placeholder)
      setParentStyles({ background: 'transparent', color: '#6B11FF', border: 'none' })
    }
  }

  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput)
    }
  }

  return (
    <InputWrapper parentStyles={parentStyles} {...rest}>
      <Input
        value={prependSymbol && value ? prependSymbol + value : value}
        onFocus={handleParentStyles}
        onBlur={handleParentStyles}
        onChange={(event) => {
          if (prependSymbol) {
            const value = event.target.value

            // cut off prepended symbol
            const formattedValue = value.toString().includes(prependSymbol)
              ? value.toString().slice(1, value.toString().length + 1)
              : value

            // replace commas with periods, because uniswap exclusively uses period as the decimal separator
            enforcer(formattedValue.replace(/,/g, '.'))
          } else {
            enforcer(event.target.value.replace(/,/g, '.'))
          }
        }}
        // universal input options
        inputMode="decimal"
        autoComplete="off"
        autoCorrect="off"
        // text-specific options
        type="text"
        pattern="^[0-9]*[.,]?[0-9]*$"
        placeholder={placeHolder === '' ? '' : '0.0'}
        minLength={1}
        maxLength={79}
        spellCheck="false"
      />
      {isSelected && <BalanceUSD>$0.00</BalanceUSD>}
    </InputWrapper>
  )
})

export default NumericInput
