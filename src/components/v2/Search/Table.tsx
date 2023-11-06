import React, { MutableRefObject, useContext } from 'react'
import TableRow from './TableRow'
import { Wrapper } from './TableStyles'
import cuid from 'cuid'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { Currency } from '@uniswap/sdk-core'
import { FixedSizeList } from 'react-window'
import { DetailsWrapper, RowWrapper, Title } from './TableRowStyles'
import CurrencyLogo from 'components/CurrencyLogo'
import SwapContext from 'store/swap-context'
import { Field } from 'state/swap/actions'

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
  const swapCTX = useContext(SwapContext)
  const {
    handleSetIsASelected,
    handleSetIsAActive,
    handleSetIsBSelected,
    handleSetIsBActive,
    handleLeftSection,
    isAActive,
    isBActive,
  } = swapCTX
  const handleSelect = () => {
    if (isAActive) {
      onCurrencySelect(Field.INPUT, null)
      handleSetIsASelected(false)
      handleSetIsAActive(false)
      handleLeftSection('welcome')
    } else if (isBActive) {
      onCurrencySelect(Field.OUTPUT, null)
      handleSetIsBSelected(false)
      handleSetIsBActive(false)
      handleLeftSection('welcome')
    }
  }

  return (
    <Wrapper>
      <RowWrapper onClick={() => handleSelect()}>
        <DetailsWrapper>
          <CurrencyLogo currency={null} size={'23px'} />
          <Title>None</Title>
        </DetailsWrapper>
      </RowWrapper>
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

export default React.memo(Table)
