import {
  Description,
  Details,
  DetailsRow,
  InfoIcon,
  Note,
  PreviewImg,
  Property,
  PropertyName,
  Value,
  Wrapper,
} from './PreviewStyles'
import { useDerivedSwapInfo } from 'state/swap/hooks'
import JSBI from 'jsbi'
import { token2str } from 'utils'

const Preview = () => {
  const {
    trade: { trade },
  } = useDerivedSwapInfo()

  // let input = trade?.inputAmount?.numerator
  let output = trade?.outputAmount?.numerator
  // input = !input ? JSBI.BigInt(0) : input
  output = !output ? JSBI.BigInt(0) : output

  // const inDecimal = trade?.inputAmount?.decimalScale !== undefined ? trade?.inputAmount?.decimalScale : JSBI.BigInt(1)
  const outDecimal =
    trade?.outputAmount?.decimalScale !== undefined ? trade?.outputAmount?.decimalScale : JSBI.BigInt(1)

  // const inSymbol = trade?.inputAmount?.currency?.symbol !== undefined ? trade?.inputAmount?.currency?.symbol : ''
  const outSymbol = trade?.outputAmount?.currency?.symbol !== undefined ? trade?.outputAmount?.currency?.symbol : ''

  // const from = { token: inSymbol, amount: input.toString(), decimal: inDecimal.toString() }
  const to = { token: outSymbol, amount: output.toString(), decimal: outDecimal.toString() }

  return (
    <Wrapper>
      <Description>
        <PreviewImg />
        <Note>Preview the results before clicking the button!</Note>
      </Description>
      <Details>
        <DetailsRow>
          <Property>
            <InfoIcon />
            <PropertyName>Protected</PropertyName>
          </Property>
          <Value>{token2str(to)}</Value>
        </DetailsRow>
        <DetailsRow>
          <Property>
            <InfoIcon />
            <PropertyName>Save your Gas fee</PropertyName>
          </Property>
          <Value>No Fee</Value>
        </DetailsRow>
        <DetailsRow>
          <Property>
            <Property>
              <InfoIcon />
              <PropertyName>Extra profit</PropertyName>
            </Property>
          </Property>
          <Value>{}</Value>
        </DetailsRow>
        <DetailsRow>
          <Property>
            <InfoIcon />
            <PropertyName>Estimate Time</PropertyName>
          </Property>
          <Value>30 sec</Value>
        </DetailsRow>
      </Details>
    </Wrapper>
  )
}

export default Preview
