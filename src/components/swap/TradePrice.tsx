import { Currency, Price } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { useCallback } from 'react'
import { ExchangeIcon, ExchangeRate, ExchangeRateWrapper } from 'components/v2/RightSection/RightSectionStyles'

interface TradePriceProps {
  price: Price<Currency, Currency>
  showInverted: boolean
  setShowInverted: (showInverted: boolean) => void
}

export default function TradePrice({ price, showInverted, setShowInverted }: TradePriceProps) {
  const usdcPrice = useUSDCPrice(showInverted ? price.baseCurrency : price.quoteCurrency)

  let formattedPrice: string
  try {
    formattedPrice = showInverted ? price.toSignificant(4) : price.invert()?.toSignificant(4)
  } catch (error) {
    formattedPrice = '0'
  }

  const label = showInverted ? `${price.quoteCurrency?.symbol}` : `${price.baseCurrency?.symbol} `
  const labelInverted = showInverted ? `${price.baseCurrency?.symbol} ` : `${price.quoteCurrency?.symbol}`
  const flipPrice = useCallback(() => setShowInverted(!showInverted), [setShowInverted, showInverted])

  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice ?? '-'} ${label}`

  return (
    <ExchangeRateWrapper
      onClick={(e) => {
        e.stopPropagation() // dont want this click to affect dropdowns / hovers
        flipPrice()
      }}
      title={text}
    >
      <ExchangeIcon>
        <circle cx="8.5" cy="8.5" r="8.5" fill="#F5F4FF" />
        <path d="M8 5L6 7H13" stroke="#847B98" />
        <path d="M10 12L12 10H5" stroke="#847B98" />
      </ExchangeIcon>
      <ExchangeRate>{text}</ExchangeRate>
      {usdcPrice && <ExchangeRate>(${usdcPrice.toSignificant(6, { groupSeparator: ',' })})</ExchangeRate>}
    </ExchangeRateWrapper>
  )
}
