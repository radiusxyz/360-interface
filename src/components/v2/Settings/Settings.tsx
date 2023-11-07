import { useSetUserSlippageTolerance, useUserSlippageTolerance } from 'state/user/hooks'
import { InfoIcon, InfoIconWrapper, Tooltip } from '../RightSection/RightSectionStyles'
import { PrimaryButton } from '../UI/Buttons'
import {
  Body,
  Close,
  Description,
  Footer,
  Header,
  HeaderTitle,
  Input,
  InputWrapper,
  Option,
  OptionsRow,
  SlippageSettingWrapper,
  TopDescWrapper,
  Wrapper,
} from './SettingsStyles'

import { Percent } from '@uniswap/sdk-core'
import { useState } from 'react'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

type Props = {
  isSelected?: boolean
  handleShowSettings: () => void
  placeholderSlippage: Percent
}

const Settings = ({ isSelected, handleShowSettings, placeholderSlippage }: Props) => {
  const userSlippageTolerance = useUserSlippageTolerance()
  const setUserSlippageTolerance = useSetUserSlippageTolerance()

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageError, setSlippageError] = useState<SlippageError | false>(false)

  function parseSlippageInput(value: string) {
    // populate what the user typed and clear the error
    setSlippageInput(value)
    setSlippageError(false)

    if (value.length === 0) {
      setUserSlippageTolerance('auto')
    } else {
      const parsed = Math.floor(Number.parseFloat(value) * 100)

      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5000) {
        setUserSlippageTolerance('auto')
        if (value !== '.') {
          setSlippageError(SlippageError.InvalidInput)
        }
      } else {
        setUserSlippageTolerance(new Percent(parsed, 10_000))
      }
    }
  }

  const tooLow = userSlippageTolerance !== 'auto' && userSlippageTolerance.lessThan(new Percent(5, 10_000))
  const tooHigh = userSlippageTolerance !== 'auto' && userSlippageTolerance.greaterThan(new Percent(1, 100))

  return (
    <Wrapper longerVersion={isSelected}>
      <Header>
        <HeaderTitle>Settings</HeaderTitle>
        <Close onClick={handleShowSettings}>
          <path
            d="M4.16675 4.16663L15.8334 15.8333M4.16675 15.8333L15.8334 4.16663"
            stroke="#6D6D6D"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Close>
      </Header>
      <Body>
        <SlippageSettingWrapper>
          <TopDescWrapper>
            <Description>Slippage tolerance</Description>
            <InfoIconWrapper>
              <Tooltip>
                The maximum price slippage you are willing to accept. If the price slips further, your transaction will
                revert.
              </Tooltip>
              <InfoIcon />
            </InfoIconWrapper>
          </TopDescWrapper>
          <OptionsRow>
            <Option
              onClick={() => {
                parseSlippageInput('0.1')
              }}
            >
              0.1%
            </Option>
            <Option
              onClick={() => {
                parseSlippageInput('0.5')
              }}
            >
              0.5%
            </Option>
            <Option
              onClick={() => {
                parseSlippageInput('1')
              }}
            >
              1%
            </Option>
          </OptionsRow>
          <InputWrapper>
            <Input
              placeholder={placeholderSlippage.toFixed(2)}
              value={
                slippageInput.length > 0
                  ? slippageInput
                  : userSlippageTolerance === 'auto'
                  ? ''
                  : userSlippageTolerance.toFixed(2)
              }
              onChange={(e) => parseSlippageInput(e.target.value)}
              onBlur={() => {
                setSlippageInput('')
                setSlippageError(false)
              }}
              color={slippageError ? 'red' : ''}
            />
            <span>%</span>
          </InputWrapper>
        </SlippageSettingWrapper>
        {/*
        <MevSettingWrapper>
          <BottomDescWrapper>
            <Description>MEV Protection Guarantee</Description>
            <InfoIconWrapper>
              <Tooltip>
                Protect Your Swap: Turn On for full protection against malicious MEV activity. Your transaction may
                revert if at risk to an attack. Turn OFF to proceed the swap with potential exposure to MEV and
                lower-price swaps.
              </Tooltip>
              <InfoIcon />
            </InfoIconWrapper>
          </BottomDescWrapper>
          <Switch />
        </MevSettingWrapper>
        */}
      </Body>
      <Footer>
        <PrimaryButton
          onClick={() => {
            handleShowSettings()
          }}
        >
          OK
        </PrimaryButton>
      </Footer>
    </Wrapper>
  )
}

export default Settings
