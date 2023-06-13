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

const AlmostThere = () => {
  return (
    <Wrapper>
      <FoxImg />
      <Note>
        You&#39;re almost there! <br />
        <BlueSpan>Sign your wallet</BlueSpan> to send the transaction order.
      </Note>
      <TokenPair>
        <Token>
          <TokenLogo />
          <TokenName>0.225 DAI</TokenName>
        </Token>
        <SwapIcon>
          <path d="M0 6.04H16.2L11.16 1" stroke="#8864EF" strokeWidth="1.5" />
          <path d="M18.1992 9.96L1.99922 9.96L7.03922 15" stroke="#8864EF" strokeWidth="1.5" />
        </SwapIcon>
        <Token>
          <TokenLogo />
          <TokenName>0.225 MATIC</TokenName>
        </Token>
      </TokenPair>
      <Details>
        <DetailsRow>
          <PropertyName>Fee</PropertyName>
          <Value>No Fee</Value>
        </DetailsRow>
        <DetailsRow>
          <PropertyName>Slippage</PropertyName>
          <Value>0.01%</Value>
        </DetailsRow>
        <DetailsRow>
          <PropertyName>Extra profit</PropertyName>
          <Value>0.012 MATIC</Value>
        </DetailsRow>
        <DetailsRow>
          <PropertyName>Your save</PropertyName>
          <Value>0.058 MATIC</Value>
        </DetailsRow>
      </Details>
    </Wrapper>
  )
}

export default AlmostThere
