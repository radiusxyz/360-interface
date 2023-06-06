import React, { useState } from 'react'
import styled from 'styled-components/macro'

import { escapeRegExp } from '../../utils'

const StyledInput = styled.input<{ error?: boolean; fontSize?: string; align?: string }>`
  color: ${({ error, theme }) => (error ? theme.red1 : theme.text1)};
  width: 0;
  position: relative;
  font-weight: 500;
  outline: none;
  border: none;
  flex: 1 1 auto;
  border-radius: 20px;
  height: 40px;
  font-size: ${({ fontSize }) => fontSize ?? '28px'};
  text-align: ${({ align }) => align && align};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0px 12px;
  -webkit-appearance: textfield;
  text-align: right;
  vertical-align: top;
  &:hover {
    background: #1b1b1b;
  }

  ::-webkit-search-decoration {
    -webkit-appearance: none;
  }

  [type='number'] {
    -moz-appearance: textfield;
  }

  ::-webkit-outer-spin-button,
  ::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }

  ::placeholder {
    color: #d0b2ff;
  }
`

const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group

export const Input = React.memo(function InnerInput({
  value,
  onUserInput,
  placeholder,
  prependSymbol,
  onBlur,
  ...rest
}: {
  value: string | number
  onUserInput: (input: string) => void
  error?: boolean
  fontSize?: string
  align?: 'right' | 'left'
  prependSymbol?: string | undefined
} & Omit<React.HTMLProps<HTMLInputElement>, 'ref' | 'onChange' | 'as'>) {
  const enforcer = (nextUserInput: string) => {
    if (nextUserInput === '' || inputRegex.test(escapeRegExp(nextUserInput))) {
      onUserInput(nextUserInput)
    }
  }

  const [placeHolder, setPlaceHolder] = useState<string | undefined>(placeholder)

  return (
    <StyledInput
      {...rest}
      value={prependSymbol && value ? prependSymbol + value : value}
      // onFocus={() => {
      //   setPlaceHolder('')
      // }}
      onBlur={(e: any) => {
        onBlur && onBlur(e)
        setPlaceHolder(placeholder)
      }}
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
  )
})

export default Input

// const inputRegex = RegExp(`^\\d*(?:\\\\[.])?\\d*$`) // match escaped "." characters via in a non-capturing group
