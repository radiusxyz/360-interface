import { Contract } from '@ethersproject/contracts'
import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { RowBetween, RowCenter, RowFixed } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { ArrowRight, ExternalLink as LinkIcon } from 'react-feather'
import { useProgressManager } from 'state/parameters/hooks'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { useRecorderContract } from '../../hooks/useContract'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { CloseIcon } from '../../theme'
import { db, Status } from '../../utils/db'
import { ButtonError, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import TradePrice from '../swap/TradePrice'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

const Wrapper = styled.div`
  width: 100%;
  background: rgba(44, 47, 63);
  padding: 35px;
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const BottomSection = styled(Section)`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const ConfirmedIcon = styled(ColumnCenter)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '20px 0' : '32px 0;')};
`

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`

const ProceedButton = styled(ButtonError)`
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
`

const GradientSpinner = styled.div<{ background: string }>`
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  animation: rotate 1s linear reverse infinite;
  border-radius: 50%;
  height: 90px;
  width: 90px;
  position: relative;

  ::before,
  ::after {
    content: '';
    position: absolute;
  }

  ::before {
    border-radius: 50%;
    background: linear-gradient(0deg, #272b3e00 0%, #272b3ea0 100%) 0% 0%,
      linear-gradient(90deg, #272b3ea0 0%, #01f76eff 100%) 100% 0%,
      linear-gradient(180deg, #01f76eff 0%, #0157ffff 100%) 100% 100%,
      linear-gradient(360deg, #0157ffff 0%, #0157ffff 100%) 0% 100%;
    background-repeat: no-repeat;
    background-size: 50% 50%;
    top: -1px;
    bottom: -1px;
    left: -1px;
    right: -1px;
  }

  ::after {
    background: ${({ background }) => background};
    border-radius: 50%;
    top: 6%;
    bottom: 6%;
    left: 6%;
    right: 6%;
  }
`

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

  const [progress, setProgress] = useProgressManager()

  // <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <TransactionCancelSuggest onDismiss={onDismiss} />
      ) : progress === 1 || progress === 2 ? (
        <PreparingForSwap onDismiss={onDismiss} progress={progress} />
      ) : progress === 3 ? (
        <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
      ) : progress === 4 ? (
        <TransactionSubmitted onDismiss={onDismiss} progress={progress} />
      ) : (
        <ConfirmationModalContent
          title={<Trans>You are swapping</Trans>}
          onDismiss={onDismiss}
          topContent={modalHeader}
          bottomContent={modalBottom}
        />
      ),
    [progress, onDismiss, modalBottom, modalHeader, swapErrorMessage]
  )

  return (
    <TransactionConfirmationModal
      isOpen={isOpen}
      onDismiss={onDismiss}
      attemptingTxn={attemptingTxn}
      hash={txHash}
      trade={trade}
      content={confirmationContent}
      pendingText={pendingText}
      swapResponse={swapResponse}
      showVdf={showVdf}
    />
  )
}

interface ModalTestProps {
  isOpen: boolean
  swapResponse?: RadiusSwapResponse | undefined
  onDismiss: () => void
}
export function ModalTest({ isOpen, onDismiss, swapResponse }: ModalTestProps) {
  let progress = 1

  progress = 3

  return (
    <>
      {progress === 1 || progress === 2 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <PreparingForSwap onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 3 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 4 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <TransactionSubmitted onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 5 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={600}>
          <Wrapper>
            <TransactionCancelSuggest onDismiss={onDismiss} />
          </Wrapper>
        </Modal>
      ) : progress === 6 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={600}>
          <Wrapper>
            <ClaimReimbursement onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 7 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <ReimbursementDetails onDismiss={onDismiss} />
          </Wrapper>
        </Modal>
      ) : (
        'default'
      )}
    </>
  )
}

/*

function WatingForSwapConfirmation(onDismiss: any, progress: number) {
function TransactionSubmitted(onDismiss: any, progress: number) {
*/

function PreparingForSwap({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <RowCenter style={{ position: 'absolute', width: '100%' }}>
          <ThemedText.Black fontSize={20} fontWeight={600} color={'#ffffff'}>
            Preparing for swap
          </ThemedText.Black>
        </RowCenter>
        <RowBetween>
          <div />
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <RowBetween>
          <ConfirmedIcon>
            <GradientSpinner className={'spinner'} background={'rgba(44, 47, 63)'} />
          </ConfirmedIcon>
        </RowBetween>
        <RowCenter>
          <ThemedText.Black
            fontSize={20}
            fontWeight={600}
            color={'#0000aa'}
            style={{
              background: 'linear-gradient(90.2deg, #0085FF 15.73%, #00FFD1 46.33%, #42FF00 101.67%)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {progress === 1 ? (
              <>Generating proofs for your transaction...</>
            ) : (
              <div style={{ width: '100%', textAlign: 'center' }}>
                Almost done!
                <br />
                Encrypting transaction before processing swap...
              </div>
            )}
          </ThemedText.Black>
        </RowCenter>
        <br />
        <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '90%' }}>
            <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
              We&apos;re doing some extra work to protect your transaction from malicious operator activities.
            </ThemedText.Black>
          </div>
        </RowCenter>
        <div style={{ padding: 5 }} />
      </Section>
    </Wrapper>
  )
}

function WaitingForSwapConfirmation({
  onDismiss,
  progress,
  trade,
}: {
  onDismiss: any
  progress: number
  trade?: InterfaceTrade<Currency, Currency, TradeType> | undefined
}) {
  let input = trade?.inputAmount?.numerator
  let output = trade?.outputAmount?.numerator
  input = !input ? JSBI.BigInt(0) : input
  output = !output ? JSBI.BigInt(0) : output

  const inDecimal = trade?.inputAmount?.decimalScale !== undefined ? trade?.inputAmount?.decimalScale : JSBI.BigInt(1)
  const outDecimal =
    trade?.outputAmount?.decimalScale !== undefined ? trade?.outputAmount?.decimalScale : JSBI.BigInt(1)

  const inSymbol = trade?.inputAmount?.currency?.symbol !== undefined ? trade?.inputAmount?.currency?.symbol : ''
  const outSymbol = trade?.outputAmount?.currency?.symbol !== undefined ? trade?.outputAmount?.currency?.symbol : ''

  const i = JSBI.divide(input, inDecimal).toString()
  const o = JSBI.divide(output, outDecimal).toString()
  let i2 = JSBI.remainder(input, inDecimal).toString()
  let o2 = JSBI.remainder(output, outDecimal).toString()

  i2 = i2.length > 6 ? i2.substring(0, 6) : i2
  o2 = o2.length > 6 ? o2.substring(0, 6) : o2

  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <RowCenter
          style={{
            marginTop: '80px',
          }}
        >
          <img src={'./images/confirmation.png'} width="132" height="98" alt="" />
        </RowCenter>
        <br />
        <RowCenter>
          <ThemedText.Black fontSize={24} fontWeight={600}>
            Waiting for swap confirmation...
          </ThemedText.Black>
        </RowCenter>
        <br />
        <RowCenter
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '100px',
          }}
        >
          <div style={{ width: '90%' }}>
            <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
              confirm the transaction on your wallet
            </ThemedText.Black>
          </div>
        </RowCenter>
        <RowCenter>
          <div
            style={{
              padding: '12px',
              background: 'rgba(37, 39, 53)',
              color: '#8BB3FF',
              justifyContent: 'space-around',
              alignItems: 'center',
              verticalAlign: 'middle',
              display: 'flex',
              flexDirection: 'row',
              width: '90%',
              fontSize: '14px',
            }}
          >
            <div>{i + '.' + i2 + ' ' + inSymbol}</div>
            <div>
              <ArrowRight color={'#8BB3FF'} size={'14px'} />
            </div>
            <div>{o + '.' + o2 + ' ' + outSymbol}</div>
          </div>
        </RowCenter>
      </Section>
    </Wrapper>
  )
}

function TransactionSubmitted({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <RowCenter>
          <div
            style={{
              background: '#1b1e2d',
              borderRadius: '66px',
              width: '132px',
              height: '132px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <img src={'./images/MEV_protected.png'} width="85" height="78" alt="" />
          </div>
        </RowCenter>
        <RowCenter style={{ marginTop: '20px' }}>
          <ThemedText.Black fontSize={20} fontWeight={600}>
            Transaction Submitted
          </ThemedText.Black>
        </RowCenter>
        <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ width: '90%' }}>
            <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
              You may continue to wait until the transaction is confirmed on the blockchain or try another secure swap.
            </ThemedText.Black>
          </div>
        </RowCenter>
        <ButtonPrimary
          style={{ background: '#1B1E2D', height: '46px', borderRadius: '23px', marginTop: '86px' }}
          onClick={() => onDismiss()}
        >
          Close
        </ButtonPrimary>
        <div style={{ padding: 5 }} />
      </Section>
    </Wrapper>
  )
}

function TransactionCancelSuggest({ onDismiss }: { onDismiss: any }) {
  // const { account, chainId, library } = useActiveWeb3React()

  // const signer = library?.getSigner()

  const recorderContract = useRecorderContract() as Contract

  const sendCancelTx = () => {
    // TODO: send cancel tx
    recorderContract.disableTxHash('txHash')
    // TODO: add right data to db
    db.txHistory.add({
      round: 0,
      order: 0,
      txId: '',
      txDate: 0,
      from: { token: '', amount: '' },
      to: { token: '', amount: '' },
      status: Status.CANCELED,
    })
  }

  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <RowCenter>
          <img src={'./images/warning.png'} width="96" height="96" alt="" />
        </RowCenter>
        <RowCenter style={{ marginTop: '20px' }}>
          <ThemedText.Black fontSize={20} fontWeight={600}>
            Transaction Pending
          </ThemedText.Black>
        </RowCenter>
        <RowCenter
          style={{
            background: 'rgba(37,39,53)',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '80px',
            marginBottom: '50px',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ justifyContent: 'space-around', display: 'flex', flexDirection: 'row', width: '70%' }}>
            <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
              {'0.123123 MATIC'}
            </ThemedText.Black>
            <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
              <ArrowRight color={'#8BB3FF'} size={'16px'} />
            </ThemedText.Black>
            <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
              {'0.12303 WETH'}
            </ThemedText.Black>
          </div>
          <br />
          <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
            You may cancel for a transaction timeout as the operator is not responding. Cancellation must be made within
            the remaining time or it may be processed on the blockchain.
          </ThemedText.Black>
          <br />
          <ThemedText.Black fontSize={16} fontWeight={500} color={'#ffffff'}>
            If you wish to proceed with the swap, click Proceed Swap.
          </ThemedText.Black>
        </RowCenter>
        <RowBetween>
          <ButtonPrimary
            style={{
              background: 'transparent',
              height: '46px',
              borderRadius: '4px',
              width: '65%',
              marginRight: '16px',
              border: '1px solid',
              borderColor: 'white',
            }}
            onClick={() => sendCancelTx()}
          >
            <span>Cancel transaction in </span>
            <span style={{ color: 'red', fontWeight: 'bold' }}>{'0:29'}</span>
          </ButtonPrimary>
          <ProceedButton
            style={{ width: '35%', height: '46px', borderRadius: '4px', margin: '0px', fontWeight: 'bold' }}
            onClick={() => onDismiss()}
          >
            Proceed Swap
          </ProceedButton>
        </RowBetween>
      </Section>
    </Wrapper>
  )
}

function TransactionCancel({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return <>TransactionCancel</>
}

function ClaimReimbursement({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <ThemedText.Black fontSize={32} fontWeight={600}>
          Claim reimbursement for this transaction?
        </ThemedText.Black>

        <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'} style={{ marginTop: '20px' }}>
          We will cover a fixed reimbursement for any completed transaction we identify as invalid behavior from an
          operator. You may claim this reimbursement at any time. If you would like to receive the reimbursement now,
          click <span style={{ fontWeight: 'bold', color: 'white' }}>Confirm Reimbursement.</span>{' '}
          <a href="">Learn more</a>
        </ThemedText.Black>

        <RowCenter
          style={{
            background: 'rgba(37,39,53)',
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '30px',
            marginBottom: '20px',
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ justifyContent: 'space-between', display: 'flex', flexDirection: 'row', width: '90%' }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
              <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
                {'From'}
              </ThemedText.Black>
              <ThemedText.Black fontSize={18} fontWeight={600} color={'#ffffFF'}>
                {'0.12303 WETH'}
              </ThemedText.Black>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
              <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
                {'To'}
              </ThemedText.Black>
              <ThemedText.Black fontSize={18} fontWeight={600} color={'#ffffFF'}>
                {'0.12303 MATIC'}
              </ThemedText.Black>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
              <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
                {'Total Reimbursement'}
              </ThemedText.Black>
              <ThemedText.Black fontSize={18} fontWeight={600} color={'#ffffFF'}>
                {'0.12303 USDC'}
              </ThemedText.Black>
            </div>
          </div>
        </RowCenter>
        <RowBetween style={{ marginBottom: '10px' }}>
          <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
            Swap Date
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
            Nov 25 2022 11:36 AM
          </ThemedText.Black>
        </RowBetween>
        <RowBetween style={{ marginBottom: '10px' }}>
          <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
            Transaction Hash
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
            0x88a...751&nbsp;
            <LinkIcon size="12px" />
          </ThemedText.Black>
        </RowBetween>
        <RowBetween style={{ marginBottom: '10px' }}>
          <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
            Reimburse To
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
            0xCCc379b885ABA6820304E8eC9DC979Bdd8941b6e
          </ThemedText.Black>
        </RowBetween>
        <RowBetween style={{ marginTop: '40px' }}>
          <ButtonPrimary
            style={{
              background: 'transparent',
              height: '46px',
              borderRadius: '4px',
              width: '48%',
              border: '1px solid',
              borderColor: 'white',
            }}
          >
            Go back
          </ButtonPrimary>
          <ButtonPrimary
            style={{
              background: 'transparent',
              height: '46px',
              borderRadius: '4px',
              width: '48%',
              border: '1px solid',
              borderColor: 'white',
            }}
          >
            Confirm
          </ButtonPrimary>
        </RowBetween>
      </Section>
    </Wrapper>
  )
}

function ReimbursementDetails({ onDismiss }: { onDismiss: () => void }) {
  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <RowCenter>
          <ThemedText.Black fontSize={24} fontWeight={600}>
            Reimbursement Details
          </ThemedText.Black>
        </RowCenter>

        <div style={{ margin: '50px 0px' }}>
          <div style={{ padding: '8px 0px' }}>
            <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
              Date
            </ThemedText.Black>
            <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
              Nov 25 2022 11:36 AM
            </ThemedText.Black>
          </div>
          <div style={{ padding: '8px 0px' }}>
            <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
              Amount
            </ThemedText.Black>
            <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
              1000 USDC
            </ThemedText.Black>
          </div>
          <div style={{ padding: '8px 0px' }}>
            <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
              Reimburse To
            </ThemedText.Black>
            <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
              0xCCc379b885ABA6820304E8eC9DC979Bdd8941b6e
            </ThemedText.Black>
          </div>
          <div style={{ padding: '8px 0px' }}>
            <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
              Transaction Hash
            </ThemedText.Black>
            <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
              0x88a...751&nbsp;
              <LinkIcon size="12px" />
            </ThemedText.Black>
          </div>
        </div>
        <RowCenter>
          <ButtonPrimary
            style={{
              background: '#1B1E2D',
              height: '46px',
              borderRadius: '23px',
              width: '90%',
            }}
            onClick={() => onDismiss()}
          >
            Close
          </ButtonPrimary>
        </RowCenter>
      </Section>
    </Wrapper>
  )
}
