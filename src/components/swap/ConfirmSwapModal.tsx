import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Fraction, Percent, TradeType } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
import { RowBetween, RowCenter, RowFixed } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { SignatureData } from 'hooks/useERC20Permit'
import { useSwapCallArguments } from 'hooks/useSwapCallArguments'
import JSBI from 'jsbi'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useProgress } from 'state/modal/hooks'
import { useParametersManager } from 'state/parameters/hooks'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'
import { getTimeLockPuzzleProof } from 'wasm/timeLockPuzzle'

import { useRecorderContract, useV2RouterContract } from '../../hooks/useContract'
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
import { ConfirmationModalContent } from '../TransactionConfirmationModal'
import SwapModalFooter from './SwapModalFooter'
import SwapModalHeader from './SwapModalHeader'

const Wrapper = styled.div`
  width: 100%;
  background: rgba(44, 47, 63);
  padding: 0px;
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
  @keyframes rotates {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  animation: rotates 2s linear reverse infinite;
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
    background: linear-gradient(0deg, #272b3e00 0%, #272b3ea0 100%) 0% 0%,
      linear-gradient(90deg, #272b3ea0 0%, #01f76eff 100%) 100% 0%,
      linear-gradient(180deg, #01f76eff 0%, #0157ffff 100%) 100% 100%,
      linear-gradient(360deg, #0157ffff 0%, #0157ffff 100%) 0% 100%;
    background-repeat: no-repeat;
    background-size: 50% 50%;
    border-radius: 50%;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
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
  showTimeLockPuzzle,
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
  showTimeLockPuzzle: boolean
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

  const confirmationContent = useCallback(
    () =>
      progress === 1 ? (
        <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
      ) : progress === 2 || progress === 3 ? (
        <PreparingForSwap onDismiss={onDismiss} progress={progress} />
      ) : progress === 4 ? (
        <TransactionSubmitted onDismiss={onDismiss} progress={progress} />
      ) : progress === 8 ? (
        <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
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

  return progress === 1 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
      <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
    </Modal>
  ) : progress === 2 || progress === 3 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
      <PreparingForSwap onDismiss={onDismiss} progress={progress} />
    </Modal>
  ) : progress === 4 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
      <TransactionSubmitted onDismiss={onDismiss} progress={progress} />
    </Modal>
  ) : progress === 8 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
      <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
    </Modal>
  ) : (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={450}>
      <ConfirmationModalContent
        title={<Trans>You are swapping</Trans>}
        onDismiss={onDismiss}
        topContent={modalHeader}
        bottomContent={modalBottom}
      />
    </Modal>
  )

  // <TransactionConfirmationModal
  //   isOpen={isOpen}
  //   onDismiss={onDismiss}
  //   attemptingTxn={attemptingTxn}
  //   hash={txHash}
  //   trade={trade}
  //   content={confirmationContent}
  //   pendingText={pendingText}
  //   swapResponse={swapResponse}
  //   showTimeLockPuzzle={showTimeLockPuzzle}
  // />
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
  const recorderContract = useRecorderContract() as Contract
  const { timeLockPuzzleParam, timeLockPuzzleSnarkParam } = useTimeLockPuzzleParam(parameters)

  const swapCalls = useSwapCallArguments(
    trade,
    allowedSlippage,
    recipientAddressOrName,
    signatureData,
    deadline,
    feeOptions
  )

  const runSwap = useCallback(async () => {
    if (timeLockPuzzleParam && timeLockPuzzleSnarkParam) {
      setProgress(1)
      const timeLockPuzzleData = await getTimeLockPuzzleProof(timeLockPuzzleParam, timeLockPuzzleSnarkParam)
      setProgress(2)
      const encryptData = await getEncryptProof(
        routerContract,
        timeLockPuzzleData,
        chainId,
        account as string,
        swapCalls,
        sigHandler
      )
      setProgress(3)
      const { encryptedSwapTx, sig } = await getSignTransaction(
        routerContract,
        timeLockPuzzleData,
        encryptData,
        chainId as number,
        account as string,
        library as any,
        swapCalls
      )
      setProgress(4)

      const sendResponse = await sendEIP712Tx(
        chainId as number,
        routerContract,
        recorderContract,
        encryptedSwapTx,
        sig,
        () => {
          console.log('cancel')
        }
      )
      //   const finalResponse: RadiusSwapResponse = {
      //     data: sendResponse.data,
      //     msg: sendResponse.msg,
      //   }
      //   return finalResponse
      // }
    }
  }, [timeLockPuzzleParam, timeLockPuzzleSnarkParam])

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

  return progress === 1 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
    </Modal>
  ) : progress === 2 || progress === 3 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <PreparingForSwap onDismiss={onDismiss} progress={progress} />
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
          background: '#1F2232',
          padding: '30px',
        }}
      >
        <RowCenter>
          <ThemedText.Black fontSize={20} fontWeight={600} color={'#ffffff'}>
            Preparing for swap
          </ThemedText.Black>
        </RowCenter>
        <RowCenter style={{ marginTop: '83px', marginBottom: '30px' }}>
          {progress === 2 ? (
            <img src="/images/gif_block_200.gif" width="180px" height="180px" alt="" />
          ) : (
            <img src="/images/gif_loading_300.gif" width="180px" height="180px" alt="" />
          )}
        </RowCenter>
      </Section>
      <Section
        style={{
          position: 'relative',
          padding: '50px',
        }}
      >
        <RowCenter>
          <ThemedText.Black fontSize={26} fontWeight={600} color={'#ffffff'} textAlign={'center'}>
            {"We're doing some extra work to protect your transaction from MEV"}
          </ThemedText.Black>
          {/* <ThemedText.Black
            fontSize={20}
            fontWeight={600}
            color={'#0000aa'}
            style={{
              background: 'linear-gradient(90.2deg, #0085FF 15.73%, #00FFD1 46.33%, #42FF00 101.67%)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {progress === 2 ? (
              <>Generating proofs for your transaction...</>
            ) : (
              <div style={{ width: '100%', textAlign: 'center' }}>
                Almost done!
                <br />
                Encrypting transaction before processing swap...
              </div>
            )}
          </ThemedText.Black> */}
        </RowCenter>
        <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '90%', marginTop: '20px' }}>
            <ThemedText.Black
              fontSize={18}
              fontWeight={500}
              style={{
                background: 'linear-gradient(90.2deg, #0085FF 15.73%, #00FFD1 46.33%, #42FF00 101.67%)',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Generating proofs for your transaction...
            </ThemedText.Black>
          </div>
        </RowCenter>
        <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
          <button
            style={{
              width: '99%',
              height: '70px',
              border: 'none',
              color: '#ffffff',
              background: '#1f2232',
              margin: '40px 10px 0px 10px',
              fontSize: '18px',
            }}
            onClick={onDismiss}
          >
            Cancel
          </button>
        </RowCenter>
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

  const waitMsg = 'Confirm the transaction on your wallet'
  const hurryMsg = 'Please confirm the transaction now or the transaction will be canceled'
  const retryMsg = 'Retry Swap'

  const [comment, setComment] = useState(waitMsg)

  useEffect(() => {
    setTimeout(() => {
      setComment(hurryMsg)
    }, 6000)
    setTimeout(() => {
      setComment(retryMsg)
    }, 10000)
  }, [])

  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
          background: '#1f2232',
        }}
      >
        <RowCenter
          style={{
            padding: '45px 0px 35px 0px',
          }}
        >
          <img src={'./images/gif_sign_300.gif'} width="300" height="300" alt="" />
        </RowCenter>
        {/* <RowCenter>
          <ThemedText.Black fontSize={24} fontWeight={600}>
            Waiting for confirmation...
          </ThemedText.Black>
        </RowCenter>
        <RowCenter
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '100px',
          }}
        >
          <div style={{ width: '90%' }}>
            <ThemedText.Black fontSize={14} fontWeight={500} color={comment !== waitMsg ? '#ff0000' : '#a8a8a8'}>
              {progress === 1 ? comment : retryMsg}
            </ThemedText.Black>
          </div>
        </RowCenter> */}
        {/* <RowCenter>
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
        </RowCenter> */}
      </Section>
      <Section style={{ padding: '50px' }}>
        <ThemedText.White textAlign={'center'} fontWeight={'600'} fontSize={'24px'}>
          Waiting for confirmation on your wallet...
        </ThemedText.White>
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
          background: '#1f2232',
          padding: '83px 0px 84px 0px',
        }}
      >
        <RowCenter>
          <img src={'./images/gif_protected_200.gif'} width="120" height="120" alt="" />
        </RowCenter>
        <RowCenter style={{ paddingTop: '16px' }}>
          <ThemedText.Label fontSize={'20px'} color={'#0DE08E'}>
            MEV-Protected
          </ThemedText.Label>
        </RowCenter>
      </Section>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <RowCenter style={{ paddingTop: '50px' }}>
          <ThemedText.Black fontSize={26} fontWeight={600}>
            Transaction Submitted
          </ThemedText.Black>
        </RowCenter>
        <RowCenter
          style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', padding: '20px 60px 0px 60px' }}
        >
          <div style={{ width: '90%' }}>
            <ThemedText.White fontSize={18} fontWeight={500}>
              Try another secure swap as you wait for the transaction to finalize on the blockchain.
            </ThemedText.White>
          </div>
        </RowCenter>
        <RowCenter style={{ padding: '40px 60px 50px 60px' }}>
          <ButtonPrimary style={{ background: '#1f2232', height: '70px', borderRadius: '0px', fontSize: '18px' }}>
            Back to Swap
          </ButtonPrimary>
        </RowCenter>
      </Section>
    </Wrapper>
  )
}

function TransactionCanceled({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
    <Wrapper>
      <Section
        style={{
          position: 'relative',
          background: '#1f2232',
          padding: '83px 0px 84px 0px',
        }}
      >
        <RowCenter>
          <img src={'./images/gif_protected_200.gif'} width="120" height="120" alt="" />
        </RowCenter>
        <RowCenter style={{ paddingTop: '16px' }}>
          <ThemedText.Label fontSize={'20px'} color={'#0DE08E'}>
            MEV-Protected
          </ThemedText.Label>
        </RowCenter>
      </Section>
      <Section
        style={{
          position: 'relative',
        }}
      >
        <RowCenter style={{ paddingTop: '50px' }}>
          <ThemedText.Black fontSize={26} fontWeight={600}>
            Transaction Canceled
          </ThemedText.Black>
        </RowCenter>
        <RowCenter
          style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', padding: '20px 60px 0px 60px' }}
        >
          <div style={{ width: '90%' }}>
            <ThemedText.White fontSize={18} fontWeight={500}>
              We canceled your transaction due to a possible front-running attack or sandwich squeeze.
            </ThemedText.White>
          </div>
        </RowCenter>
        <RowCenter
          style={{
            textAlign: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px 60px 0px 60px',
          }}
        >
          <div style={{ width: '90%' }}>
            <ThemedText.White fontSize={16} fontWeight={400} color={'#8BB3FF'}>
              Please try the swap again.
            </ThemedText.White>
          </div>
        </RowCenter>
        <RowCenter style={{ padding: '40px 60px 50px 60px' }}>
          <ButtonPrimary
            style={{ background: '#1f2232', height: '70px', borderRadius: '0px', fontSize: '18px' }}
            onClick={onDismiss}
          >
            Back to Swap
          </ButtonPrimary>
        </RowCenter>
      </Section>
    </Wrapper>
  )
}

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  return new Fraction(numerator, denominator).toSignificant(precision).toString()
}
