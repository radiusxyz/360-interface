import { Balance, BalanceInUSD, BalanceWrapper, Description, DetailsWrapper, Title, Wrapper } from './TableRowStyles'
import CurrencyLogo from '../../../components/CurrencyLogo/index'
import { Currency } from '@uniswap/sdk-core'
import { useCombinedActiveList } from '../../../state/lists/hooks'
import { isTokenOnList } from '../../../utils'
import { useIsUserAddedToken } from '../../../hooks/Tokens'
import { useCurrencyBalance } from '../../../state/wallet/hooks'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { Loading } from '../UI/Buttons'
import { Field } from 'state/swap/actions'
import SwapContext from 'store/swap-context'
import { useContext } from 'react'

const TableRow = ({
  currency,
  showCurrencyAmount,
  selectedCurrency,
  otherCurrency,
  onCurrencySelect,
}: {
  currency: Currency
  selectedCurrency?: Currency | null
  otherCurrency?: Currency | null
  onCurrencySelect: (field: any, currency: Currency | null) => void
  showCurrencyAmount?: boolean
}) => {
  const swapCTX = useContext(SwapContext)
  const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
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

  const { account } = useActiveWeb3React()
  const selectedTokenList = useCombinedActiveList()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency.isToken ? currency : undefined)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(account ?? undefined, currency)

  return (
    <Wrapper onClick={() => (isSelected ? null : handleSelect())}>
      <DetailsWrapper>
        <CurrencyLogo currency={currency} size={'23px'} />
        <Title>{currency.symbol}</Title>
        {!currency.isNative && !isOnSelectedList && customAdded ? (
          <Description>{currency.name} • Added by user</Description>
        ) : (
          <Description>{currency.name}</Description>
        )}
      </DetailsWrapper>
      <BalanceWrapper>
        {(showCurrencyAmount && balance && <Balance>{balance.toSignificant(4)}</Balance>) || (account && <Loading />)}
        <BalanceInUSD>$100</BalanceInUSD>
      </BalanceWrapper>
    </Wrapper>
  )
}

export default TableRow
