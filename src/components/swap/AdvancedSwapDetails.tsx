import { Trans } from '@lingui/macro'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import Card from 'components/Card'
import { LoadingRows } from 'components/Loader/styled'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useContext, useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import styled, { ThemeContext } from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { computeRealizedLPFeePercent } from '../../utils/prices'
import { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip } from '../Tooltip'

const StyledCard = styled(Card)`
  padding: 0;
`

interface AdvancedSwapDetailsProps {
  trade?: InterfaceTrade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  syncing?: boolean
  hideRouteDiagram?: boolean
  hideInfoTooltips?: boolean
}

function TextWithLoadingPlaceholder({
  syncing,
  width,
  children,
}: {
  syncing: boolean
  width: number
  children: JSX.Element
}) {
  return syncing ? (
    <LoadingRows>
      <div style={{ height: '15px', width: `${width}px` }} />
    </LoadingRows>
  ) : (
    children
  )
}

export function AdvancedSwapDetails({
  trade,
  allowedSlippage,
  syncing = false,
  hideInfoTooltips = false,
}: AdvancedSwapDetailsProps) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()

  const { expectedOutputAmount, priceImpact } = useMemo(() => {
    if (!trade) return { expectedOutputAmount: undefined, priceImpact: undefined }
    const expectedOutputAmount = trade.outputAmount
    const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
    // const priceImpact = trade.priceImpact.subtract(realizedLpFeePercent)
    const priceImpact = trade?.priceImpact.multiply('100').toSignificant(3)
    return { expectedOutputAmount, priceImpact }
  }, [trade])

  return !trade ? null : (
    <StyledCard>
      <AutoColumn gap="8px">
        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={
                <Trans>
                  The amount you expect to receive at the current market price. You may receive less or more if the
                  market price changes while your transaction is pending.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.SubHeader color={'#d0d0d0'}>
                <Trans>Expected Output</Trans>
              </ThemedText.SubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={65}>
            <ThemedText.SubHeader textAlign="right" fontSize={14} color={'#d0d0d0'} fontWeight={'600'}>
              {expectedOutputAmount
                ? `${expectedOutputAmount.toSignificant(6)}  ${expectedOutputAmount.currency.symbol}`
                : '-'}
            </ThemedText.SubHeader>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed style={{ marginRight: '20px' }}>
            <MouseoverTooltip
              text={
                <Trans>
                  The minimum amount you are guaranteed to receive. If the price slips any further, your transaction
                  will revert.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.SubHeader color={'#d0d0d0'}>
                <Trans>Slippage Tolerance</Trans>
              </ThemedText.SubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>
            <ThemedText.SubHeader textAlign="right" fontSize={14} color={'#d0d0d0'} fontWeight={'600'}>
              {`${allowedSlippage.toSignificant(6)}`} %
            </ThemedText.SubHeader>
          </TextWithLoadingPlaceholder>
        </RowBetween>

        <RowBetween>
          <RowFixed>
            <MouseoverTooltip
              text={<Trans>The impact your trade has on the market price of this pool.</Trans>}
              disableHover={hideInfoTooltips}
            >
              <ThemedText.SubHeader color={'#d0d0d0'}>
                <Trans>Price Impact</Trans>
              </ThemedText.SubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={50}>
            <ThemedText.SubHeader textAlign="right" fontSize={14} color={'#F5AC37'} fontWeight={'600'}>
              {priceImpact}
              {/* <FormattedPriceImpact priceImpact={priceImpact} /> */}
            </ThemedText.SubHeader>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        <RowBetween>
          <RowFixed style={{ marginRight: '20px' }}>
            <MouseoverTooltip
              text={
                <Trans>
                  The minimum amount you are guaranteed to receive. If the price slips any further, your transaction
                  will revert.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.SubHeader color={'#d0d0d0'}>
                <Trans>Total Fee (including gas fee)</Trans>
              </ThemedText.SubHeader>
            </MouseoverTooltip>
          </RowFixed>
          <TextWithLoadingPlaceholder syncing={syncing} width={70}>
            <ThemedText.Black textAlign="right" fontSize={14} color={'#0EFF76'} fontWeight={'600'}>
              NO FEE
            </ThemedText.Black>
          </TextWithLoadingPlaceholder>
        </RowBetween>
        {/* {!trade?.gasUseEstimateUSD || !chainId || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? null : (
          <RowBetween>
            <MouseoverTooltip
              text={
                <Trans>
                  The fee paid to miners who process your transaction. This must be paid in {nativeCurrency.symbol}.
                </Trans>
              }
              disableHover={hideInfoTooltips}
            >
              <ThemedText.SubHeader color={theme.text3}>
                <Trans>Network Fee</Trans>
              </ThemedText.SubHeader>
            </MouseoverTooltip>
            <TextWithLoadingPlaceholder syncing={syncing} width={50}>
              <ThemedText.Black textAlign="right" fontSize={14} color={theme.text3}>
                ~${trade.gasUseEstimateUSD.toFixed(2)}
              </ThemedText.Black>
            </TextWithLoadingPlaceholder>
          </RowBetween>
        )} */}
      </AutoColumn>
    </StyledCard>
  )
}
