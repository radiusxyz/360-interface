import Switch from '../UI/Switch'
import { useSetUserSlippageTolerance, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import { InfoIcon } from '../RightSection/RightSectionStyles'
import { PrimaryButton } from '../UI/Buttons'
import {
  Body,
  BottomDescWrapper,
  Close,
  Description,
  Footer,
  Header,
  HeaderTitle,
  Input,
  InputWrapper,
  MevSettingWrapper,
  Option,
  OptionsRow,
  SlippageSettingWrapper,
  TopDescWrapper,
  Wrapper,
} from './SettingsStyles'

import { Percent } from '@uniswap/sdk-core'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { useState } from 'react'
import ms from 'ms.macro'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

type Props = {
  isSelected?: boolean
  handleShowSettings?: (e: React.MouseEvent<HTMLImageElement | SVGSVGElement>) => void
  placeholderSlippage: Percent
}

const THREE_DAYS_IN_SECONDS = ms`3 days` / 1000

const Settings = ({ isSelected, handleShowSettings, placeholderSlippage }: Props) => {
  const userSlippageTolerance = useUserSlippageTolerance()
  const setUserSlippageTolerance = useSetUserSlippageTolerance()

  const [deadline, setDeadline] = useUserTransactionTTL()

  const [slippageInput, setSlippageInput] = useState('')
  const [slippageError, setSlippageError] = useState<SlippageError | false>(false)

  const [deadlineInput, setDeadlineInput] = useState('')
  const [deadlineError, setDeadlineError] = useState<DeadlineError | false>(false)

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

  function parseCustomDeadline(value: string) {
    // populate what the user typed and clear the error
    setDeadlineInput(value)
    setDeadlineError(false)

    if (value.length === 0) {
      setDeadline(DEFAULT_DEADLINE_FROM_NOW)
    } else {
      try {
        const parsed: number = Math.floor(Number.parseFloat(value) * 60)
        if (!Number.isInteger(parsed) || parsed < 60 || parsed > THREE_DAYS_IN_SECONDS) {
          setDeadlineError(DeadlineError.InvalidInput)
        } else {
          setDeadline(parsed)
        }
      } catch (error) {
        console.error(error)
        setDeadlineError(DeadlineError.InvalidInput)
      }
    }
  }

  // const showCustomDeadlineRow = Boolean(chainId && !L2_CHAIN_IDS.includes(chainId))
  const showCustomDeadlineRow = false

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
        <MevSettingWrapper>
          <BottomDescWrapper>
            <Description>MEV Protection Guarantee</Description>
            <InfoIcon />
          </BottomDescWrapper>
          <Switch />
        </MevSettingWrapper>
      </Body>
      <Footer>
        <PrimaryButton>OK</PrimaryButton>
      </Footer>
    </Wrapper>
  )
}

export default Settings
