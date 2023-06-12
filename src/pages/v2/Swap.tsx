import styled from 'styled-components/macro'
import ferris_wheel from '../../assets/v2/images/ferris_wheel.png'
import cog from '../../assets/v2/images/cog.png'
import { PrimaryButton, SelectTokenButton } from 'components/v2/UI/Buttons'
import { NumericInput } from 'components/v2/UI/Inputs'

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  height: auto;
  gap: 12px;
  width: 100%;
  height: 100%;
`

const LeftSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border: 1px solid #dde0ff;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  width: 100%;
  max-width: 500px;
  min-height: 381px;
  height: 100%;
`

const FerrisWheel = styled.img.attrs(() => ({
  src: ferris_wheel,
  height: '60px',
  width: '60px',
}))``

const GreetingMessage = styled.p`
  font-weight: 500;
  font-size: 20px;
  line-height: 26.97px;
  color: #5800af;
  margin: 0;
`

const RightSection = styled.div`
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  max-width: 372px;
  width: 100%;
  min-height: 381px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
  align-items: center;
  border-bottom: 1px solid #dde0ff;
`

const HeaderTitle = styled.span`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 144.52%;
  color: #000000;
`

const Cog = styled.img.attrs({ src: cog, width: 20 })``

const TopTokenRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-height: 118px;
  height: 100%;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px;
`

const BottomTokenRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-height: 100px;
  height: 100%;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px;
`

const ButtonRow = styled.div`
  max-height: 116px;
  height: 100%;
  display: flex;
  align-items: end;
  padding: 0px 24px 24px 24px;
`

export const Swap = () => {
  return (
    <Wrapper>
      <LeftSection>
        <FerrisWheel />
        <GreetingMessage>Welcome to 360</GreetingMessage>
      </LeftSection>
      <RightSection>
        <Header>
          <HeaderTitle>Swap</HeaderTitle>
          <Cog />
        </Header>
        <TopTokenRow>
          <SelectTokenButton>Select Token</SelectTokenButton>
          <NumericInput />
        </TopTokenRow>
        <BottomTokenRow>
          <SelectTokenButton>Select Token</SelectTokenButton>
          <NumericInput />
        </BottomTokenRow>
        <ButtonRow>
          <PrimaryButton>Connect Wallet</PrimaryButton>
        </ButtonRow>
      </RightSection>
    </Wrapper>
  )
}

export default Swap
