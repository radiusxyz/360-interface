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
  const {
    handleSetIsASelected,
    handleSetIsAActive,
    handleSetIsBSelected,
    handleSetIsBActive,
    handleLeftSection,
    isAActive,
    isBActive,
  } = swapCTX
  const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
  const handleSelect = () => {
    if (currency && isAActive) {
      onCurrencySelect(Field.INPUT, currency)
      handleSetIsASelected(true)
      handleSetIsAActive(false)
      handleLeftSection('welcome')
    }
    if (currency && isBActive) {
      onCurrencySelect(Field.OUTPUT, currency)
      handleSetIsBSelected(true)
      handleSetIsBActive(false)
      handleLeftSection('welcome')
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
