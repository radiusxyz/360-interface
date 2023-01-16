import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import ms from 'ms.macro'
import { darken } from 'polished'
import { useContext, useState } from 'react'
import { Info } from 'react-feather'
import { useSetUserSlippageTolerance, useUserSlippageTolerance, useUserTransactionTTL } from 'state/user/hooks'
import styled, { ThemeContext } from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'

enum SlippageError {
  InvalidInput = 'InvalidInput',
}

enum DeadlineError {
  InvalidInput = 'InvalidInput',
}

const FancyButton = styled.button`
  color: ${({ theme }) => theme.text1};
  align-items: center;
  height: 2rem;
  border-radius: 36px;
  font-size: 14px;
  width: auto;
  min-width: 3.6rem;
  border: 0px solid ${({ theme }) => theme.bg3};
  outline: none;
  background: ${({ theme }) => theme.bg1};
`

const Option = styled(FancyButton)<{ active: boolean }>`
  height: 24px;
  width: 57px;
  margin-right: 8px;
  padding: 0px 10px;
  background-color: ${({ active }) => active && '#cccccc'};
  color: ${({ active }) => active && '#485c83'};
  border: ${({ active }) => active && '1px solid #485c83'};
  :hover {
    color: #ffffff;
    border: 1px solid #ffffff;
  }
`

const Input = styled.input`
  background: ${({ theme }) => theme.bg1};
  font-size: 16px;
  width: auto;
  outline: none;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
  }
  /*color: ${({ theme, color }) => (color === 'red' ? theme.red1 : theme.text1)};*/
  color: #8bb3ff;
  text-align: right;
`

const OptionCustom = styled(FancyButton)<{ active?: boolean; warning?: boolean }>`
  height: 46px;
  position: relative;
  padding: 0 0.75rem;
  flex: 1;
  /*border: ${({ theme, active, warning }) =>
    active ? `1px solid ${warning ? theme.red1 : theme.primary1}` : warning && `1px solid ${theme.red1}`};*/
  :hover {
    border: ${({ theme, active, warning }) =>
      active && `0px solid ${warning ? darken(0.1, theme.red1) : darken(0.1, theme.primary1)}`};
  }

  input {
    width: 100%;
    height: 100%;
    border: 0px;
    border-radius: 2rem;
  }
`

const SlippageEmojiContainer = styled.span`
  color: #f3841e;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `}
`

interface TransactionSettingsProps {
  placeholderSlippage: Percent // varies according to the context in which the settings dialog is placed
}

const THREE_DAYS_IN_SECONDS = ms`3 days` / 1000

export default function TransactionSettings({ placeholderSlippage }: TransactionSettingsProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

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
    <AutoColumn gap="40px">
      <AutoColumn gap="14px">
        <RowFixed>
          <ThemedText.Black fontWeight={600} fontSize={16} color={'#DDDDDD'}>
            <Trans>Slippage tolerance</Trans>
          </ThemedText.Black>
          &nbsp;
          <MouseoverTooltip
            text={
              <Trans>
                The maximum price slippage you are willing to accept. If the price slips further, your transaction will
                revert.
              </Trans>
            }
          >
            <Info
              style={{
                stroke: '1px',
                width: '18px',
                height: '18px',
              }}
            />
          </MouseoverTooltip>
        </RowFixed>
        <RowBetween>
          <OptionCustom
            active={userSlippageTolerance !== 'auto'}
            warning={!!slippageError}
            tabIndex={-1}
            style={{ padding: '0px 20px 0px 12px' }}
          >
            <RowBetween style={{ padding: '5px 0px' }}>
              <Option
                onClick={() => {
                  parseSlippageInput('0.1')
                }}
                active={
                  userSlippageTolerance !== 'auto' &&
                  userSlippageTolerance.toSignificant(6) === new Percent(10, 10_000).toSignificant(6)
                }
              >
                <Trans>0.1 %</Trans>
              </Option>

              <Option
                onClick={() => {
                  parseSlippageInput('0.5')
                }}
                active={
                  userSlippageTolerance !== 'auto' &&
                  userSlippageTolerance.toSignificant(6) === new Percent(50, 10_000).toSignificant(6)
                }
              >
                <Trans>0.5 %</Trans>
              </Option>

              <Option
                onClick={() => {
                  parseSlippageInput('1')
                }}
                active={
                  userSlippageTolerance !== 'auto' &&
                  userSlippageTolerance.toSignificant(6) === new Percent(100, 10_000).toSignificant(6)
                }
              >
                <Trans>1 %</Trans>
              </Option>

              {tooLow || tooHigh ? (
                <SlippageEmojiContainer>
                  <span role="img" aria-label="warning">
                    ⚠️
                  </span>
                </SlippageEmojiContainer>
              ) : null}
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
              <span style={{ color: '#8bb3ff', fontSize: '16px' }}>%</span>
            </RowBetween>
          </OptionCustom>
        </RowBetween>
        {slippageError || tooLow || tooHigh ? (
          <RowBetween
            style={{
              fontSize: '14px',
              paddingTop: '7px',
              color: slippageError ? '#ff4747' : '#ff4747',
            }}
          >
            {slippageError ? (
              <Trans>Enter a valid slippage percentage</Trans>
            ) : tooLow ? (
              <Trans>Slippage is too low. Your transaction may fail.</Trans>
            ) : (
              <Trans>Slippage is too high.</Trans>
            )}
          </RowBetween>
        ) : null}
      </AutoColumn>

      {showCustomDeadlineRow && (
        <AutoColumn gap="12px">
          <RowFixed>
            <ThemedText.Black fontSize={16} fontWeight={600} color={'#DDDDDD'}>
              <Trans>Transaction deadline</Trans>
            </ThemedText.Black>
            &nbsp;
            <MouseoverTooltip
              text={
                <Trans>
                  Set the maximum length of time that a transaction spends to be processed. Your transaction will revert
                  if it passes more than this period.
                </Trans>
              }
            >
              <Info
                style={{
                  stroke: '1px',
                  width: '18px',
                  height: '18px',
                }}
              />
            </MouseoverTooltip>
          </RowFixed>
          <RowBetween>
            <OptionCustom style={{ width: '100%', padding: '0px 20px' }} warning={!!deadlineError} tabIndex={-1}>
              <Input
                placeholder={(DEFAULT_DEADLINE_FROM_NOW / 60).toString()}
                value={
                  deadlineInput.length > 0
                    ? deadlineInput
                    : deadline === DEFAULT_DEADLINE_FROM_NOW
                    ? ''
                    : (deadline / 60).toString()
                }
                onChange={(e) => parseCustomDeadline(e.target.value)}
                onBlur={() => {
                  setDeadlineInput('')
                  setDeadlineError(false)
                }}
                color={deadlineError ? '#ff4747' : ''}
              />
            </OptionCustom>
            <ThemedText.Body style={{ paddingLeft: '10px', paddingRight: '20px' }} color={'#8BB3FF'} fontSize={16}>
              <Trans>minutes</Trans>
            </ThemedText.Body>
          </RowBetween>
          {deadlineError ? (
            <RowBetween
              style={{
                fontSize: '14px',
                paddingTop: '7px',
                color: slippageError ? '#ff4747' : '#ff4747',
              }}
            >
              <Trans>Your transaction will be pending for a long period of time. Use at your own risk</Trans>
            </RowBetween>
          ) : null}
        </AutoColumn>
      )}
    </AutoColumn>
  )
}
