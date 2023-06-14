import { Trans } from 'utils/trans'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Fraction, Percent, TradeType } from '@uniswap/sdk-core'
import blockImage from 'assets/images/gif_block_200.gif'
import loadingImage from 'assets/images/gif_loading_300.gif'
import protectedImage from 'assets/images/gif_protected_200.gif'
import respondingImage from 'assets/images/gif_responding_200.gif'
import signImage from 'assets/images/gif_sign_300.gif'
import { RowBetween, RowCenter, RowFixed } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import { useCurrencyBalance } from '../../state/wallet/hooks'
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
  errorMessage,
  progress,
  recipient,
  swapErrorMessage,
  isOpen,
  txHash,
  swapResponse,
}: {
  isOpen: boolean
  trade: InterfaceTrade<Currency, Currency, TradeType> | undefined
  originalTrade: Trade<Currency, Currency, TradeType> | undefined
  inputCurrency: Currency | null | undefined
  outputCurrency: Currency | null | undefined
  txHash: string | undefined
  recipient: string | null
  allowedSlippage: Percent
  onAcceptChanges: () => void
  onConfirm: () => void
  onDismiss: () => void
  errorMessage: string | undefined | null
  progress: number
  swapErrorMessage: ReactNode | undefined
  swapResponse?: RadiusSwapResponse | undefined
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

  return progress === 2 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
      <WaitingForSwapConfirmation onDismiss={onDismiss} progress={progress} trade={trade} />
    </Modal>
  ) : progress === 3 ? (
    <Modal isOpen={isOpen} onDismiss={() => null} maxHeight={90} width={700}>
      <PreparingForSwap1 onDismiss={() => null} />
    </Modal>
  ) : progress === 4 || progress === 5 ? (
    <Modal isOpen={isOpen} onDismiss={() => null} maxHeight={90} width={700}>
      <PreparingForSwap2 onDismiss={() => null} />
    </Modal>
  ) : // ) : progress === 5 ? (
  //   <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
  //     <PreparingForSwap3 onDismiss={onDismiss} />
  //   </Modal>
  progress === 6 ? (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
      <TransactionSubmitted onDismiss={onDismiss} />
    </Modal>
  ) : progress === 7 ? (
    <div onLoad={() => onDismiss()} />
  ) : (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={480}>
      <ConfirmationModalContent
        title={<Trans>You are swapping</Trans>}
        onDismiss={onDismiss}
        errorMessage={errorMessage}
        topContent={modalHeader}
        bottomContent={modalBottom}
      />
    </Modal>
  )
}

function PreparingForSwap1({ onDismiss }: { onDismiss: any }) {
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
          <img src={blockImage} width="180px" height="180px" alt="" />
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
            {rogress === 2 ? (
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
        {/* <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
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
            onClick={() => {
              dispatch(setProgress({ newParam: 8 }))
              onDismiss()
            }}
          >
            Cancel
          </button>
        </RowCenter> */}
      </Section>
    </Wrapper>
  )
}

function PreparingForSwap2({ onDismiss }: { onDismiss: any }) {
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
          <img src={loadingImage} width="180px" height="180px" alt="" />
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
            {rogress === 2 ? (
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
        {/* <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
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
            onClick={() => {
              dispatch(setProgress({ newParam: 8 }))
              onDismiss()
            }}
          >
            Cancel
          </button>
        </RowCenter> */}
      </Section>
    </Wrapper>
  )
}

function PreparingForSwap3({ onDismiss }: { onDismiss: any }) {
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
          <img src={respondingImage} width="180px" height="180px" alt="" />
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
            {"We're waiting for Operator response"}
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
            {rogress === 2 ? (
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
              Waiting operator response for your transaction...
            </ThemedText.Black>
          </div>
        </RowCenter>
        {/* <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
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
            onClick={() => {
              dispatch(setProgress({ newParam: 8 }))
              onDismiss()
            }}
          >
            Cancel
          </button>
        </RowCenter> */}
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
  // let input = trade?.inputAmount?.numerator
  // let output = trade?.outputAmount?.numerator
  // input = !input ? JSBI.BigInt(0) : input
  // output = !output ? JSBI.BigInt(0) : output

  // const inDecimal = trade?.inputAmount?.decimalScale !== undefined ? trade?.inputAmount?.decimalScale : JSBI.BigInt(1)
  // const outDecimal =
  //   trade?.outputAmount?.decimalScale !== undefined ? trade?.outputAmount?.decimalScale : JSBI.BigInt(1)

  // const inSymbol = trade?.inputAmount?.currency?.symbol !== undefined ? trade?.inputAmount?.currency?.symbol : ''
  // const outSymbol = trade?.outputAmount?.currency?.symbol !== undefined ? trade?.outputAmount?.currency?.symbol : ''

  // const inAmount = JSBIDivide(input, inDecimal, 6)
  // const outAmount = JSBIDivide(output, outDecimal, 6)

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
          <img src={signImage} width="300" height="300" alt="" />
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
        <RowCenter style={{ marginTop: '20px' }}>
          <ThemedText.Black fontSize={16} fontWeight={500} color={comment === retryMsg ? '#ff0000' : '#a8a8a8'}>
            {comment}
          </ThemedText.Black>
        </RowCenter>
      </Section>
    </Wrapper>
  )
}

function TransactionSubmitted({ onDismiss }: { onDismiss: any }) {
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
          <img src={protectedImage} width="120" height="120" alt="" />
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
