import styled from 'styled-components/macro'
import cog from '../../../assets/v2/images/cog.png'

export const MainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  width: 372px;
  min-height: 381px;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
  align-items: center;
  border-bottom: 1px solid #dde0ff;
  max-height: 44px;
`

export const HeaderTitle = styled.span`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 144.52%;
  color: #000000;
`

export const Cog = styled.img.attrs({ src: cog, width: 20 })`
  &: hover {
    filter: brightness(30%);
    cursor: pointer;
  }
`

export const SlippageOptions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 9px 0px;
  width: 100%;
`

export const SlippageOption = styled.button<{ selected?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  border: ${({ selected }) => (selected && '1px solid var(--primary-color, #6b11ff)') || '1px solid #ebebeb'};
  max-width: 52px;
  width: 100%;
  max-height: 20px;
  padding: 3px;
  border-radius: 66px;
  color: ${({ selected }) => (selected && '#6b11ff') || '#999999'};
  &:hover {
    cursor: pointer;
    color: #6b11ff;
    border: 1px solid var(--primary-color, #6b11ff);
  }
`

export const TopTokenRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-direction: column;
  height: 118px;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px 20px 21px;
  position: relative;
`

export const Aligner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 8px;
  width: 100%;
`

export const Circle = styled.div`
  border-radius: 50%;
  width: 31px;
  height: 31px;
  position: absolute;
  top: 100%;
  left: 50%;
  border: 1px solid #dde0ff;
  transform: translate(-50%, -50%);
  background: #ffffff;
  cursor: pointer;
`

export const BottomTokenRow = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 100px;
  height: 100%;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px 20px 21px;
`

export const ButtonRow = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  min-height: 116px;
  padding: 0 24px 12px 24px;
  position: relative;
`

export const ButtonAndBalanceWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0px;
  align-items: start;
  width: 100%;
  max-width: 129px;
  position: relative;
`

export const Balance = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 144.52%;
  color: #848484;
  margin-left: 3px;
  position: absolute;
  top: 100%;
  left: 0px;
`

export const TokenWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

export const Logo = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #f5f4ff;
  border: 1px solid #dde0ff;
`
export const TokenName = styled.span`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 144.52%;
  color: #000000;
`

export const InfoMainWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  margin: 27px 0px;
`

export const InfoRowWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

export const Description = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 144.52%;
  color: #333333;
`

export const ValueAndIconWrapper = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

export const MinimumAmount = styled.span`
  font-weight: 600;
  font-size: 14px;
  line-height: 144.52%;
  text-align: right;
  color: #000000;
`

export const ImpactAmount = styled.span<{ priceImpactTooHigh: number }>`
  font-weight: 400;
  font-size: 14px;
  line-height: 144.52%;
  text-align: right;
  color: ${({ priceImpactTooHigh }) => (priceImpactTooHigh ? '#FF0000' : '#000000')};
`

export const InfoIconSVG = styled.svg.attrs({
  viewBox: '0 0 16 16',
  width: 16,
  height: 16,
  fill: 'none',
})``

export const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #dde0ff;
`

export const ExchangeRateWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  margin-bottom: 1px;
  gap: 6px;
`

export const ExchangeIcon = styled.svg.attrs({
  viewBox: '0 0 17 17',
  width: 17,
  height: 17,
  fill: 'none',
})``

export const ExchangeRate = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 144.52%;
  text-align: right;
  color: #626262;
`

export const ErrorMessage = styled.p`
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  color: #ff9c9c;
  text-align: center;
  font-size: 14px;
  font-style: normal;
  font-weight: 400;
  line-height: 144.523%;
`

export const InfoIcon = () => (
  <InfoIconSVG>
    <circle cx="8" cy="8" r="7.5" stroke="#9B9B9B" />
    <rect x="7.27271" y="7.27271" width="1.45455" height="4.36364" fill="#9B9B9B" />
    <rect x="7.27271" y="4.36365" width="1.45455" height="1.45455" fill="#9B9B9B" />
  </InfoIconSVG>
)
