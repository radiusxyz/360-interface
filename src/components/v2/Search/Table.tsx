import React, { MutableRefObject } from 'react'
import TableRow from './TableRow'
import { Wrapper } from './TableStyles'
import cuid from 'cuid'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { Currency } from '@uniswap/sdk-core'
import { FixedSizeList } from 'react-window'

export function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const Table = ({
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,

  showCurrencyAmount,
}: {
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (field: any, currency: Currency | null) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showCurrencyAmount?: boolean
}) => {
  return (
    <Wrapper>
      {currencies.map((currency) => (
        <TableRow
          key={cuid()}
          currency={currency}
          selectedCurrency={selectedCurrency}
          otherCurrency={otherCurrency}
          onCurrencySelect={onCurrencySelect}
          showCurrencyAmount={showCurrencyAmount}
        />
      ))}
    </Wrapper>
  )
}

export default Table
