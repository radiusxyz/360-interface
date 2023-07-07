import CurrencyLogo from 'components/CurrencyLogo'
import { Title, Wrapper } from './TokenDescriptionStyles'
import { Currency } from '@uniswap/sdk-core'
import { Field } from 'state/swap/actions'
import { useContext } from 'react'
import SwapContext from 'store/swap-context'

const TokenDescription = ({
  currency,
  onCurrencySelect,
  selectedCurrency,
}: {
  currency: Currency
  selectedCurrency?: Currency | null
  onCurrencySelect: (field: any, currency: Currency | null) => void
}) => {
  const swapCTX = useContext(SwapContext)
  const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
  const handleSelect = () => {
    if (currency && swapCTX.isAtokenSelectionActive) {
      onCurrencySelect(Field.INPUT, currency)
      swapCTX.handleSetIsAtokenSelected()
      swapCTX.handleSetIsAtokenSelectionActive(false)
      swapCTX.handleLeftSection('welcome')
    }
    if (currency && swapCTX.isBtokenSelectionActive) {
      onCurrencySelect(Field.OUTPUT, currency)
      swapCTX.handleSetIsBtokenSelected()
      swapCTX.handleSetIsBtokenSelectionActive(false)
      swapCTX.handleLeftSection('welcome')
    }
  }
  return (
    <Wrapper key={currency?.symbol} onClick={() => (isSelected ? null : handleSelect())}>
      <CurrencyLogo currency={currency} size={'20px'} />
      <Title>{currency?.symbol}</Title>
    </Wrapper>
  )
}

export default TokenDescription
