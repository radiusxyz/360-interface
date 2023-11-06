import styled from 'styled-components/macro'
import fox from '../../../assets/v2/images/fox.png'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 35px 53px 38px 53px;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 500px;
`

export const FoxImg = styled.img.attrs({
  src: fox,
  width: '80px',
})`
  margin-bottom: 14px;
`

export const Note = styled.p`
  font-weight: 500;
  font-size: 18px;
  line-height: 144.52%;
  text-align: center;
  color: #000000;
  margin-bottom: 22px;
`

export const BlueSpan = styled.span`
  color: #6e00fb;
`

export const TokenPair = styled.div`
  display: flex;
  width: 100%;
  min-height: 67px;
  margin-bottom: 8px;
  justify-content: center;
  align-items: center;
  gap: 30px;
  background: #f5f4ff;
`

export const Token = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
`

export const TokenLogo = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid #dde0ff;
`

export const TokenName = styled.span`
  font-weight: 500;
  font-size: 18px;
  line-height: 21px;
  color: #000000;
`

export const SwapIcon = styled.svg.attrs({
  viewbox: '0 0 19 16',
  fill: 'none',
  width: 19,
  height: 16,
})``

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-top: 1px solid #dde0ff;
  border-left: 1px solid #dde0ff;
  border-right: 1px solid #dde0ff;
`
export const DetailsRow = styled.div`
  display: flex;
  padding: 12px 62px;
  width: 100%;
  justify-content: space-between;
  border-bottom: 1px solid #dde0ff;
`

export const PropertyName = styled.span`
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #333333;
`
export const Value = styled.span`
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  text-align: center;
  color: #6b11ff;
`
