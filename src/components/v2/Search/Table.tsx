import React, { MutableRefObject } from 'react'
import TableRow from './TableRow'
// import { Tokens } from '../../../assets/v2/data'
import { Wrapper } from './TableStyles'
import cuid from 'cuid'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { Currency, Token } from '@uniswap/sdk-core'
import { FixedSizeList } from 'react-window'

type Props = {
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency | null) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showImportView: () => void
  setImportToken: (token: Token) => void
  showCurrencyAmount?: boolean
}

const Table: React.FC<Props> = ({
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showImportView,
  setImportToken,
  showCurrencyAmount,
}: {
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency | null) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showImportView: () => void
  setImportToken: (token: Token) => void
  showCurrencyAmount?: boolean
}) => {
  return (
    <Wrapper>
      {currencies.map((token) => (
        <TableRow key={cuid()} token={token} />
      ))}
    </Wrapper>
  )
}

export default Table
