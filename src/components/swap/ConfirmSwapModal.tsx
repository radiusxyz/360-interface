import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
import { RowBetween, RowCenter, RowFixed } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { SignatureData } from 'hooks/useERC20Permit'
import { useSwapCallArguments } from 'hooks/useSwapCallArguments'
import JSBI from 'jsbi'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { ArrowRight } from 'react-feather'
import { Text } from 'rebass'
import { useProgress } from 'state/modal/hooks'
import { useParametersManager } from 'state/parameters/hooks'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'
import { getVdfProof } from 'wasm/vdf'

import { useV2RouterContract } from '../../hooks/useContract'
import {
  getEncryptProof,
  getSignTransaction,
  sendEIP712Tx,
  useTimeLockPuzzleParam,
} from '../../lib/hooks/swap/useSendSwapTransaction'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { CloseIcon } from '../../theme'
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
  inputCurrency,
  outputCurrency,
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
  inputCurrency: Currency | null | undefined
  outputCurrency: Currency | null | undefined
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
        inputCurrency={inputCurrency}
        outputCurrency={outputCurrency}
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

  const progress = useProgress()

  // <TransactionErrorContent onDismiss={onDismiss} message={swapErrorMessage} />
  /*TODO: fix me*/
  const confirmationContent = useCallback(
    () =>
      progress === 1 || progress === 2 ? (
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

export function AAA({
  trade,
  originalTrade,
  inputCurrency,
  outputCurrency,
  onAcceptChanges,
  allowedSlippage,
  onConfirm,
  onDismiss,
  recipient,
  swapErrorMessage,
  isOpen,
  recipientAddressOrName,
  signatureData,
  deadline,
  feeOptions,
  sigHandler,
}: {
  isOpen: boolean
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  originalTrade: Trade<Currency, Currency, TradeType> | undefined
  inputCurrency: Currency | undefined
  outputCurrency: Currency | undefined
  recipient: string | null
  allowedSlippage: Percent
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  onDismiss: () => void
  recipientAddressOrName: string | null
  signatureData: SignatureData | null
  deadline: BigNumber | undefined
  feeOptions?: FeeOptions
  sigHandler: () => void
}) {
  const [progress, setProgress] = useState(0)
  const { chainId, account, library } = useActiveWeb3React()
  const [parameters, updateParameters] = useParametersManager()

  const showAcceptChanges = useMemo(
    () => Boolean(trade && originalTrade && tradeMeaningfullyDiffers(trade, originalTrade)),
    [originalTrade, trade]
  )
  const routerContract = useV2RouterContract() as Contract
  const { vdfParam, vdfSnarkParam } = useTimeLockPuzzleParam(parameters)

  const swapCalls = useSwapCallArguments(
    trade,
    allowedSlippage,
    recipientAddressOrName,
    signatureData,
    deadline,
    feeOptions
  )

  const runSwap = useCallback(async () => {
    if (vdfParam && vdfSnarkParam) {
      setProgress(1)
      const vdfData = await getVdfProof(vdfParam, vdfSnarkParam)
      setProgress(2)
      const encryptData = await getEncryptProof(vdfData, account as string, swapCalls, sigHandler)
      setProgress(3)
      const { encryptedSwapTx, sig } = await getSignTransaction(
        vdfData,
        encryptData,
        chainId as number,
        account as string,
        library as any,
        swapCalls
      )
      setProgress(4)

      const sendResponse = await sendEIP712Tx(chainId as number, routerContract, encryptedSwapTx, sig, () => {
        console.log('cancel')
      })
      //   const finalResponse: RadiusSwapResponse = {
      //     data: sendResponse.data,
      //     msg: sendResponse.msg,
      //   }
      //   return finalResponse
      // }
    }
  }, [vdfParam, vdfSnarkParam])

  const currencyBalance = useCurrencyBalance(account ?? undefined, trade?.inputAmount.currency ?? undefined)

  const [showInverted, setShowInverted] = useState<boolean>(false)

  const confirmationContent = useCallback(
    () => (
      <Wrapper>
        <Section>
          <RowBetween style={{ justifyContent: 'center' }}>
            <Text fontWeight={600} fontSize={20}>
              <Trans>You are swapping</Trans>
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          {trade && (
            <SwapModalHeader
              trade={trade}
              inputCurrency={inputCurrency}
              outputCurrency={outputCurrency}
              allowedSlippage={allowedSlippage}
              recipient={recipient}
              showAcceptChanges={showAcceptChanges}
              onAcceptChanges={onAcceptChanges}
            />
          )}
        </Section>
        <BottomSection gap="12px">
          {trade && (
            <SwapModalFooter
              onConfirm={onConfirm}
              trade={trade}
              disabledConfirm={showAcceptChanges}
              swapErrorMessage={swapErrorMessage}
            />
          )}
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

            {trade && (
              <RowFixed style={{ height: '10px' }}>
                <TradePrice
                  price={trade.executionPrice}
                  showInverted={showInverted}
                  setShowInverted={setShowInverted}
                />
              </RowFixed>
            )}
          </RowBetween>
        </BottomSection>
        <button
          onClick={() => {
            runSwap()
          }}
        >
          RunSwap
        </button>
      </Wrapper>
    ),
    [onDismiss, swapErrorMessage]
  )

  return progress === 1 || progress === 2 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <PreparingForSwap onDismiss={onDismiss} progress={progress} />
    </Modal>
  ) : progress === 3 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
    </Modal>
  ) : progress === 4 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <TransactionSubmitted onDismiss={onDismiss} progress={progress} />
    </Modal>
  ) : (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      {confirmationContent}
    </Modal>
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
      ) : (
        'default'
      )}
    </>
  )
}

/*
function WaitingForSwapConfirmation(onDismiss: any, progress: number) {
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

  const inAmount = JSBIDivide(input, inDecimal, 6)
  const outAmount = JSBIDivide(output, outDecimal, 6)

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
            <div>{inAmount + ' ' + inSymbol}</div>
            <div>
              <ArrowRight color={'#8BB3FF'} size={'14px'} />
            </div>
            <div>{outAmount + ' ' + outSymbol}</div>
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

function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  // if (precision < 0) return Error('precision must bigger than 0')
  // if (denominator === JSBI.BigInt(0)) return Error('divide by zero')

  const division = JSBI.divide(numerator, denominator).toString()
  let remain = JSBI.remainder(numerator, denominator).toString()

  remain = remain.length > precision ? remain.substring(0, precision) : remain

  return division + '.' + remain
}
