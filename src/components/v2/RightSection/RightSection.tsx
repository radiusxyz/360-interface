import { PrimaryButton, SelectTokenButton } from '../UI/Buttons'
import { NumericInput } from '../UI/Inputs'

import React, { useState } from 'react'
import {
  Header,
  Aligner,
  ButtonAndBalanceWrapper,
  Cog,
  HeaderTitle,
  MainWrapper,
  SlippageOption,
  SlippageOptions,
  TokenName,
  TokenWrapper,
  TopTokenRow,
  Logo,
  Balance,
  Circle,
  BottomTokenRow,
  ButtonRow,
  InfoMainWrapper,
  InfoRowWrapper,
  Description,
  ValueAndIconWrapper,
  ImpactAmount,
  InfoIcon,
  Divider,
  ExchangeRateWrapper,
  ExchangeIcon,
  ExchangeRate,
} from './RightSectionStyles'

export const RightSection = () => {
  const [isSelected, setIsSelected] = useState(true)
  return (
    <MainWrapper>
      <Header>
        <HeaderTitle>Swap</HeaderTitle>
        <Cog />
      </Header>
      <TopTokenRow>
        {isSelected && (
          <SlippageOptions>
            <SlippageOption>MAX</SlippageOption>
            <SlippageOption>50%</SlippageOption>
            <SlippageOption>Clear</SlippageOption>
          </SlippageOptions>
        )}
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isSelected}>
              {isSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>WMATIC</TokenName>
                </TokenWrapper>
              ) : (
                'Select Token'
              )}
            </SelectTokenButton>
            {isSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput isSelected={isSelected} />
        </Aligner>
        <Circle />
      </TopTokenRow>
      <BottomTokenRow>
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isSelected}>
              {isSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>DAI</TokenName>
                </TokenWrapper>
              ) : (
                'Select Token'
              )}
            </SelectTokenButton>
            {isSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput isSelected={isSelected} />
        </Aligner>
      </BottomTokenRow>
      <ButtonRow>
        {isSelected && (
          <InfoMainWrapper>
            <InfoRowWrapper>
              <Description>You receive minimum</Description>
              <ValueAndIconWrapper>
                <ImpactAmount>15.2545 DAI</ImpactAmount>
                <InfoIcon>
                  <circle cx="8" cy="8" r="7.5" stroke="#9B9B9B" />
                  <rect x="7.27271" y="7.27271" width="1.45455" height="4.36364" fill="#9B9B9B" />
                  <rect x="7.27271" y="4.36365" width="1.45455" height="1.45455" fill="#9B9B9B" />
                </InfoIcon>
              </ValueAndIconWrapper>
            </InfoRowWrapper>
            <Divider />
            <InfoRowWrapper>
              <Description>Price impact</Description>
              <ValueAndIconWrapper>
                <ImpactAmount>0.25%</ImpactAmount>
                <InfoIcon>
                  <circle cx="8" cy="8" r="7.5" stroke="#9B9B9B" />
                  <rect x="7.27271" y="7.27271" width="1.45455" height="4.36364" fill="#9B9B9B" />
                  <rect x="7.27271" y="4.36365" width="1.45455" height="1.45455" fill="#9B9B9B" />
                </InfoIcon>
              </ValueAndIconWrapper>
            </InfoRowWrapper>
          </InfoMainWrapper>
        )}
        <PrimaryButton mrgn="0px 0px 12px 0px">Preview Swap</PrimaryButton>
        {isSelected && (
          <ExchangeRateWrapper>
            <ExchangeIcon>
              <circle cx="8.5" cy="8.5" r="8.5" fill="#F5F4FF" />
              <path d="M8 5L6 7H13" stroke="#847B98" />
              <path d="M10 12L12 10H5" stroke="#847B98" />
            </ExchangeIcon>
            <ExchangeRate>1ETH = 2035 WMATIC</ExchangeRate>
          </ExchangeRateWrapper>
        )}
      </ButtonRow>
    </MainWrapper>
  )
}

export default RightSection
