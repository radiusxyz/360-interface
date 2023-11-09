import {
  BlueSpan,
  Details,
  DetailsRow,
  FoxImg,
  Note,
  PropertyName,
  SwapIcon,
  Token,
  TokenLogo,
  TokenName,
  TokenPair,
  Value,
  Wrapper,
} from './AlmostThereStyles'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import JSBI from 'jsbi'
import { token2str } from 'utils'

const AlmostThere = () => {
  const {
    trade: { trade },
    allowedSlippage,
  } = useDerivedSwapInfo()

  let input = trade?.inputAmount?.numerator
  let output = trade?.outputAmount?.numerator
  input = !input ? JSBI.BigInt(0) : input
  output = !output ? JSBI.BigInt(0) : output

  const inDecimal = trade?.inputAmount?.decimalScale !== undefined ? trade?.inputAmount?.decimalScale : JSBI.BigInt(1)
  const outDecimal =
    trade?.outputAmount?.decimalScale !== undefined ? trade?.outputAmount?.decimalScale : JSBI.BigInt(1)

  const inSymbol = trade?.inputAmount?.currency?.symbol !== undefined ? trade?.inputAmount?.currency?.symbol : ''
  const outSymbol = trade?.outputAmount?.currency?.symbol !== undefined ? trade?.outputAmount?.currency?.symbol : ''

  const from = { token: inSymbol, amount: input.toString(), decimal: inDecimal.toString() }
  const to = { token: outSymbol, amount: output.toString(), decimal: outDecimal.toString() }

  return (
    <Wrapper>
      <FoxImg />
      <Note>
        You&#39;re almost done! <br />
        Just <BlueSpan>sign on your wallet</BlueSpan> to complete the transaction
      </Note>
      <TokenPair>
        <Token>
          <TokenLogo />
          <TokenName>{token2str(from)}</TokenName>
        </Token>
        <SwapIcon>
          <path d="M0 6.04H16.2L11.16 1" stroke="#8864EF" strokeWidth="1.5" />
          <path d="M18.1992 9.96L1.99922 9.96L7.03922 15" stroke="#8864EF" strokeWidth="1.5" />
        </SwapIcon>
        <Token>
          <TokenLogo />
          <TokenName>{token2str(to)}</TokenName>
        </Token>
      </TokenPair>
      <Details>
        <DetailsRow>
          <PropertyName>Fee</PropertyName>
          <Value>No Fee</Value>
        </DetailsRow>
        <DetailsRow>
          <PropertyName>Slippage</PropertyName>
          <Value>{allowedSlippage.toSignificant(2)}</Value>
        </DetailsRow>
      </Details>
    </Wrapper>
  )
}

export default AlmostThere
