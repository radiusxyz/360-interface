import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { RowBetween, RowFixed } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { useCurrencyBalance } from '../../state/wallet/hooks'
import { ThemedText } from '../../theme'
import TradePrice from '../swap/TradePrice'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

export default function ConfirmSwapModal({
  trade,
  originalTrade,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  attemptingTxn,
  txHash,
  swapResponse,
  showVdf,
}: {
  isOpen: boolean
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  originalTrade: Trade<Currency, Currency, TradeType> | undefined
  attemptingTxn: boolean
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: Percent
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  onDismiss: () => void
  swapResponse?: RadiusSwapResponse | undefined
  showVdf: boolean
}) {
  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )

  const { account } = useActiveWeb3React()

  const currencyBalance = useCurrencyBalance(account ?? undefined, trade?.inputAmount.currency ?? undefined)

  const modalHeader = useCallback(() => {
    return trade ? (
      <SwapModalHeader
        trade={trade}
        allowedSlippage={allowedSlippage}
        recipient={recipient}
        showAcceptChanges={showAcceptChanges}
        onAcceptChanges={onAcceptChanges}
      />
    ) : null
  }, [allowedSlippage, onAcceptChanges, recipient, showAcceptChanges, trade])

  const [showInverted, setShowInverted] = useState<boolean>(false)
  const modalBottom = useCallback(() => {
    return trade ? (
      <>
        <SwapModalFooter
          onConfirm={onConfirm}
          trade={trade}
          disabledConfirm={showAcceptChanges}
          swapErrorMessage={swapErrorMessage}
        />
        <RowBetween>
          <RowFixed style={{ height: '10px' }}>
            <ThemedText.Body
              color={'#999999'}
              fontWeight={500}
              fontSize={14}
              style={{ display: 'inline', cursor: 'pointer' }}
            >
              {currencyBalance ? <Trans>Balance: {formatCurrencyAmount(currencyBalance, 4)}</Trans> : null}
            </ThemedText.Body>
          </RowFixed>

          <RowFixed style={{ height: '10px' }}>
            <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
          </RowFixed>
        </RowBetween>
      </>
    ) : null
  }, [onConfirm, showAcceptChanges, swapErrorMessage, trade])

  // text to show while loading
  const pendingText = (
    <Trans>
      Swapping {trade?.inputAmount?.toSignificant(6)} {trade?.inputAmount?.currency?.symbol} for{' '}
      {trade?.outputAmount?.toSignificant(6)} {trade?.outputAmount?.currency?.symbol}
    </Trans>
  )

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
      ) : (
        <ConfirmationModalContent
          title={<Trans>You are swapping</Trans>}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [onDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      content={confirmationContent}
      pendingText={pendingText}
      currencyToAdd={trade?.outputAmount.currency}
      swapResponse={swapResponse}
      showVdf={showVdf}
    />
  )
}
