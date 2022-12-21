import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useContext, useState } from 'react'
import { AlertTriangle, ArrowRight } from 'react-feather'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import styled, { ThemeContext } from 'styled-components/macro'

import { useUSDCValue } from '../../hooks/useUSDCPrice'
import { ThemedText } from '../../theme'
import { isAddress, shortenAddress } from '../../utils'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import { FiatValue } from '../CurrencyInputPanel/FiatValue'
import CurrencyLogo from '../CurrencyLogo'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { AdvancedSwapDetails } from './AdvancedSwapDetails'
import { SwapShowAcceptChanges } from './styleds'

const ArrowWrapper = styled.div`
  padding: 4px;
  border-radius: 12px;
  height: 32px;
  width: 32px;
  position: relative;
  margin-top: -18px;
  margin-bottom: -18px;
  left: calc(50% - 16px);
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ theme }) => theme.bg1};
  border: 4px solid;
  border-color: ${({ theme }) => theme.bg0};
  z-index: 2;
`

export default function SwapModalHeader({
  trade,
  inputCurrency,
  outputCurrency,
  allowedSlippage,
  recipient,
  showAcceptChanges,
  onAcceptChanges,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  inputCurrency: Currency | null | undefined
  outputCurrency: Currency | null | undefined
  allowedSlippage: Percent
  recipient: string | null
  showAcceptChanges: boolean
  onAcceptChanges: () => void
}) {
  const theme = useContext(ThemeContext)

  const [showInverted, setShowInverted] = useState<boolean>(false)

  const fiatValueInput = useUSDCValue(trade.inputAmount)
  const fiatValueOutput = useUSDCValue(trade.outputAmount)

  return (
    <AutoRow
      gap={'4px'}
      style={{
        marginTop: '16px',
        marginBottom: '30px',
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-around',
          padding: '32px 0px',
          width: '100%',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '40%' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CurrencyLogo
              currency={inputCurrency}
              size={'60px'}
              style={{ marginRight: '12px', marginBottom: '15px' }}
            />
            <div
              style={{
                display: 'flex',
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <RowFixed gap={'0px'} style={{ marginRight: '5px' }}>
                <Text
                  fontSize={20}
                  fontWeight={500}
                  color={showAcceptChanges && trade.tradeType === TradeType.EXACT_OUTPUT ? theme.primary1 : ''}
                >
                  {trade.inputAmount.toSignificant(6)}
                </Text>
              </RowFixed>
              <RowFixed gap={'0px'}>
                <Text fontSize={20} fontWeight={500}>
                  {trade.inputAmount.currency.symbol}
                </Text>
              </RowFixed>
            </div>
            {/* <RowBetween>
              <FiatValue fiatValue={fiatValueInput} />
            </RowBetween> */}
          </div>
        </div>
        <ArrowRight size="36" color={'#ffffff'} />
        <div style={{ width: '40%' }}>
          <div
            style={{
              display: 'flex',
              width: '100%',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <CurrencyLogo
              currency={outputCurrency}
              size={'60px'}
              style={{ marginRight: '12px', marginBottom: '15px' }}
            />
            <div
              style={{
                display: 'flex',
                width: '100%',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <RowFixed gap={'0px'} style={{ marginRight: '5px' }}>
                <Text fontSize={20} fontWeight={500}>
                  {trade.outputAmount.toSignificant(6)}
                </Text>
              </RowFixed>
              <RowFixed gap={'0px'}>
                <Text fontSize={20} fontWeight={500}>
                  {trade.outputAmount.currency.symbol}
                </Text>
              </RowFixed>
            </div>
            <RowBetween>
              <ThemedText.Body fontSize={14} color={theme.text3}>
                <FiatValue
                  fiatValue={fiatValueOutput}
                  priceImpact={computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)}
                />
              </ThemedText.Body>
            </RowBetween>
          </div>
        </div>
      </div>
      <div
        style={{
          padding: '25px 35px',
          marginTop: '0.5rem',
          borderRadius: '4px',
          background: 'rgba(31,32,42)',
          width: '100%',
        }}
      >
        <AdvancedSwapDetails trade={trade} allowedSlippage={allowedSlippage} />
      </div>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges justify="flex-start" gap={'0px'}>
          <RowBetween>
            <RowFixed>
              <AlertTriangle size={20} style={{ marginRight: '8px', minWidth: 24 }} />
              <ThemedText.Main color={theme.primary1}>
                <Trans>Price Updated</Trans>
              </ThemedText.Main>
            </RowFixed>
            <ButtonPrimary
              style={{ padding: '.5rem', width: 'fit-content', fontSize: '0.825rem', borderRadius: '12px' }}
              onClick={onAcceptChanges}
            >
              <Trans>Accept</Trans>
            </ButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : null}
      {/* 
      <AutoColumn justify="flex-start" gap="sm" style={{ padding: '.75rem 1rem' }}>
        {trade.tradeType === TradeType.EXACT_INPUT ? (
          <ThemedText.Italic fontWeight={400} textAlign="left" style={{ width: '100%' }}>
            <Trans>
              Output is estimated. You will receive at least{' '}
              <b>
                {trade.minimumAmountOut(allowedSlippage).toSignificant(6)} {trade.outputAmount.currency.symbol}
              </b>{' '}
              or the transaction will revert.
            </Trans>
          </ThemedText.Italic>
        ) : (
          <ThemedText.Italic fontWeight={400} textAlign="left" style={{ width: '100%' }}>
            <Trans>
              Input is estimated. You will sell at most{' '}
              <b>
                {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {trade.inputAmount.currency.symbol}
              </b>{' '}
              or the transaction will revert.
            </Trans>
          </ThemedText.Italic>
        )}
      </AutoColumn> */}
      {recipient !== null ? (
        <AutoColumn justify="flex-start" gap="sm" style={{ padding: '12px 0 0 0px' }}>
          <ThemedText.Main>
            <Trans>
              Output will be sent to{' '}
              <b title={recipient}>{isAddress(recipient) ? shortenAddress(recipient) : recipient}</b>
            </Trans>
          </ThemedText.Main>
        </AutoColumn>
      ) : null}
      {/* <RowBetween style={{ marginTop: '0.25rem', padding: '0 1rem' }}>
        <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
      </RowBetween> */}
    </AutoRow>
  )
}
