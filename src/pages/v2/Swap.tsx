import styled from 'styled-components/macro'
import ferris_wheel from '../../assets/v2/images/ferris_wheel.png'
import cog from '../../assets/v2/images/cog.png'
import { PrimaryButton, SelectTokenButton } from 'components/v2/UI/Buttons'
import { NumericInput } from 'components/v2/UI/Inputs'
import { useState } from 'react'
import Search from 'components/v2/Search/Search'
import Preview from 'components/v2/Preview/Preview'
import AlmostThere from 'components/v2/AlmostThere/AlmostThere'
import React from 'react'
import Switch from '../../components/v2/UI/Switch'

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: start;
  height: auto;
  gap: 12px;
  width: 100%;
  height: 100%;
  @media (max-width: 634px) {
    flex-direction: column;
    align-items: center;
  }
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
  display: flex;
  flex-direction: column;
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
  max-height: 44px;
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
  min-height: 118px;
  height: 100%;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px;
  gap: 8px;
  position: relative;
`

const Aligner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 8px;
`

const Circle = styled.div`
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

const BottomTokenRow = styled.div`
  display: flex;
  align-items: start;
  flex-grow: 1;
  justify-content: space-between;
  min-height: 75px;
  height: 100%;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px;
  gap: 8px;
  margin-top: 25px;
`

const ButtonRow = styled.div`
  display: flex;
  height: 100%;
  align-items: end;
  min-height: 116px;
  padding: 0 24px 24px 24px;
`

export const Swap = () => {
  const [leftSection, setLeftSection] = useState('welcome')
  const handleClickSelect = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLButtonElement

    if (target.textContent === 'Select Token') setLeftSection('search-table')
    if (target.textContent === 'Connect Wallet') setLeftSection('preview')
    if (target.textContent === '') setLeftSection('almost-there')
  }

  return (
    <Wrapper>
      <Switch />
      {(leftSection === 'welcome' && (
        <LeftSection>
          <FerrisWheel />
          <GreetingMessage>Welcome to 360</GreetingMessage>
        </LeftSection>
      )) ||
        (leftSection === 'search-table' && <Search />) ||
        (leftSection === 'preview' && <Preview />) ||
        (leftSection === 'almost-there' && <AlmostThere />)}
      <RightSection>
        <Header>
          <HeaderTitle>Swap</HeaderTitle>
          <Cog />
        </Header>
        <TopTokenRow>
          <Aligner>
            <SelectTokenButton mrgn="6px 0px 0px 0px" onClick={handleClickSelect}>
              Select Token
            </SelectTokenButton>
            <NumericInput />
          </Aligner>
          <Circle onClick={handleClickSelect} />
        </TopTokenRow>
        <BottomTokenRow>
          <Aligner>
            <SelectTokenButton mrgn="6px 0px 0px 0px" onClick={handleClickSelect}>
              Select Token
            </SelectTokenButton>
            <NumericInput />
          </Aligner>
        </BottomTokenRow>
        <ButtonRow>
          <PrimaryButton onClick={handleClickSelect}>Connect Wallet</PrimaryButton>
        </ButtonRow>
      </RightSection>
    </Wrapper>
  )
}

export default Swap
