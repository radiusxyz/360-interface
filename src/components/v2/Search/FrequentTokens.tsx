import { Currency } from '@uniswap/sdk-core'
import { Wrapper } from './FrequentTokensStyles'
import cuid from 'cuid'
import TokenDescription from './TokenDescription'

const FrequentTokens = ({
  currencies,
  onCurrencySelect,
  selectedCurrency,
}: {
  currencies: Currency[]
  selectedCurrency: null
  onCurrencySelect: (field: any, currency: Currency | null) => void
}) => {
  return (
    currencies && (
      <Wrapper>
        {currencies.slice(2, 6).map((currency) => (
          <TokenDescription
            selectedCurrency={selectedCurrency}
            onCurrencySelect={onCurrencySelect}
            currency={currency}
            key={cuid()}
          ></TokenDescription>
        ))}
      </Wrapper>
    )
  )
}

export default FrequentTokens
