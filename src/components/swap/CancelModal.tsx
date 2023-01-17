import { Contract } from '@ethersproject/contracts'
import { Fraction } from '@uniswap/sdk-core'
import { RowBetween, RowCenter } from 'components/Row'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { addPopup, removePopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { useRecorderContract } from '../../hooks/useContract'
import { db, PendingTx, ReadyTx, Status, TokenAmount } from '../../utils/db'
import { ButtonError, ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'
const Wrapper = styled.div`
  width: 100%;
  background: rgba(44, 47, 63);
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const ProceedButton = styled(ButtonError)`
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
`

export function CancelSuggestModal({
  isOpen,
  readyTxId,
  onDismiss,
}: {
  isOpen: boolean
  readyTxId: number
  onDismiss: () => void
}) {
  const dispatch = useAppDispatch()
  // const { account, chainId, library } = useActiveWeb3React()

  // const signer = library?.getSigner()
  const [readyTx, setReadyTx] = useState<ReadyTx | undefined>(undefined)
  const [pendingTx, setPendingTx] = useState<PendingTx | undefined>(undefined)
  const [cancelProgress, setCancelProgress] = useState(0)

  const recorderContract = useRecorderContract() as Contract

  // 시간이 지나면 자동으로 modal 사라짐
  // useEffect(() => {
  //   if (readyTx && readyTx.tx.availableFrom - Math.floor(Date.now() / 1000) < 0) {
  //     onDismiss()
  //   }
  // }, [time])
  useEffect(() => {
    const updateTx = async () => {
      if (readyTx === undefined) {
        setReadyTx(await db.readyTxs.get(readyTxId))
        setPendingTx(await db.pendingTxs.where('readyTxId').equals(readyTxId).first())
      }
    }
    updateTx()
    setCancelProgress(0)
  }, [readyTxId])

  const continueTx = async () => {
    if (readyTx !== undefined) {
      setCancelProgress(2)
      sleep(3000)

      const currentRound = parseInt(await recorderContract.currentRound()) - 1
      await db.readyTxs.where({ id: readyTx?.id }).modify({ progressHere: 0 })
      const pendingTxId = await db.pushPendingTx(
        { field: 'readyTxId', value: readyTx.id },
        {
          round: currentRound,
          readyTxId: readyTx.id as number,
          progressHere: 1,
        }
      )
      await db.pushTxHistory(
        { field: 'pendingTxId', value: parseInt(pendingTxId.toString()) },
        {
          pendingTxId: parseInt(pendingTxId.toString()),
          from: readyTx?.from as TokenAmount,
          to: readyTx?.to as TokenAmount,
          status: Status.PENDING,
        }
      )
      dispatch(
        removePopup({
          key: `${pendingTx?.round}-${pendingTx?.order}`,
        })
      )

      dispatch(
        addPopup({
          content: {
            title: 'Transaction Pending',
            status: 'pending',
            data: { hash: readyTx.txHash },
          },
          key: `${pendingTx?.round}-${pendingTx?.order}`,
          removeAfterMs: 31536000,
        })
      )
    }
    onDismiss()
  }

  const sendCancelTx = async () => {
    if (readyTx !== undefined) {
      const canceled = await recorderContract.disableTxHash(readyTx.txHash)
      console.log(canceled)
      setCancelProgress(1)
      sleep(3000)

      const currentRound = parseInt(await recorderContract.currentRound()) - 1
      await db.readyTxs.where({ id: readyTx.id }).modify({ progressHere: 0 })
      const pendingTxId = await db.pushPendingTx(
        { field: 'readyTxId', value: readyTx.id },
        {
          round: currentRound,
          readyTxId: readyTx.id as number,
          progressHere: 1,
        }
      )
      await db.pushTxHistory(
        { field: 'pendingTxId', value: parseInt(pendingTxId.toString()) },
        {
          pendingTxId: parseInt(pendingTxId.toString()),
          from: readyTx?.from as TokenAmount,
          to: readyTx?.to as TokenAmount,
          status: Status.PENDING,
        }
      )
      dispatch(
        removePopup({
          key: `${pendingTx?.round}-${pendingTx?.order}`,
        })
      )
      dispatch(
        addPopup({
          content: {
            title: 'Validating cancel success',
            status: 'pending',
            data: { hash: readyTx.txHash, readyTxId: readyTx.id },
          },
          key: `${pendingTx?.round}-${pendingTx?.order}`,
          removeAfterMs: 31536000,
        })
      )
    }
    onDismiss()
  }

  if (cancelProgress === 0) {
    return (
      <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
        <TransactionCancelSuggest continueTx={continueTx} sendCancelTx={sendCancelTx} readyTx={readyTx} />
      </Modal>
    )
  } else if (cancelProgress === 1) {
    return (
      <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
        <TransactionCanceled onDismiss={onDismiss} />
      </Modal>
    )
  } else {
    return (
      <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={700}>
        <TransactionSubmitted onDismiss={onDismiss} />
      </Modal>
    )
  }
}

function TransactionCancelSuggest({
  continueTx,
  sendCancelTx,
  readyTx,
}: {
  continueTx: () => void
  sendCancelTx: () => void
  readyTx: ReadyTx | undefined
}) {
  const [time, setTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Math.floor(Date.now() / 1000))
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const flag = false

  return (
    <Wrapper>
      {readyTx && (
        <Section
          style={{
            position: 'relative',
            padding: '80px 60px 60px 60px',
          }}
        >
          <RowCenter>
            {flag ? (
              <img src={'./images/gif_error_200.gif'} width="220" height="220" alt="" />
            ) : (
              <img src={'./images/gif_responding_200.gif'} width="220" height="220" alt="" />
            )}
          </RowCenter>
          {/* <RowCenter style={{ marginTop: '20px' }}>
            <ThemedText.White fontSize={20} fontWeight={600}>
              {flag ? 'Swap Error' : 'Transaction Pending'}
            </ThemedText.White>
          </RowCenter> */}
          <RowCenter
            style={{
              background: 'rgba(37,39,53)',
              textAlign: 'center',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '17px 0px 40px 0px',
              padding: '50px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* <div style={{ justifyContent: 'space-around', display: 'flex', flexDirection: 'row', width: '70%' }}>
              <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
                {JSBIDivide(JSBI.BigInt(readyTx?.from.amount), JSBI.BigInt(readyTx?.from.decimal), 6) +
                  ' ' +
                  readyTx?.from.token}
              </ThemedText.Black>
              <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
                <ArrowRight color={'#8BB3FF'} size={'16px'} />
              </ThemedText.Black>
              <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
                {JSBIDivide(JSBI.BigInt(readyTx?.to.amount), JSBI.BigInt(readyTx?.to.decimal), 6) +
                  ' ' +
                  readyTx?.to.token}
              </ThemedText.Black>
            </div> */}
            <ThemedText.White fontSize={24} fontWeight={500}>
              {flag ? 'Swap Error' : 'Oops! Swap is not responding'}
            </ThemedText.White>
            <br />
            {flag && (
              <>
                <ThemedText.White fontSize={16} fontWeight={400}>
                  Oops! Something went wrong while trying to swap.
                </ThemedText.White>
                <br />
              </>
            )}
            <ThemedText.Gray fontSize={16} fontWeight={500} color={'#bbbbbb'}>
              {flag
                ? "Cancel the transaction and try the swap again. If you don't cancel within the remaining time, it may proceed and finalize on the blockchain."
                : 'You may cancel for a transaction timeout as the operator is not responding. Cancellation must be made within the remaining time or it may be processed on the blockchain.'}
            </ThemedText.Gray>
            {!flag && (
              <>
                <br />
                <ThemedText.White fontSize={16} fontWeight={500}>
                  If you wish to proceed with the swap, click Proceed Swap.
                </ThemedText.White>
              </>
            )}
          </RowCenter>
          {flag ? (
            <RowCenter>
              <ButtonPrimary
                style={{
                  background: 'transparent',
                  height: '46px',
                  borderRadius: '4px',
                  width: '100%',
                  marginRight: '16px',
                  border: '1px solid',
                  borderColor: 'white',
                }}
                onClick={() => sendCancelTx()}
              >
                <span>{'Cancel transaction' + (readyTx.tx.availableFrom - Math.floor(time) < 0 ? '' : ' in ')}</span>
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  &nbsp;
                  {readyTx.tx.availableFrom - Math.floor(time) < 0 ? '' : readyTx.tx.availableFrom - Math.floor(time)}
                </span>
              </ButtonPrimary>
            </RowCenter>
          ) : (
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
                <span>{'Cancel transaction' + (readyTx.tx.availableFrom - Math.floor(time) < 0 ? '' : ' in ')}</span>
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  &nbsp;
                  {readyTx.tx.availableFrom - Math.floor(time) < 0 ? '' : readyTx.tx.availableFrom - Math.floor(time)}
                </span>
              </ButtonPrimary>
              <ProceedButton
                style={{ width: '35%', height: '46px', borderRadius: '4px', margin: '0px', fontWeight: 'bold' }}
                onClick={() => continueTx()}
              >
                Proceed Swap
              </ProceedButton>
            </RowBetween>
          )}
        </Section>
      )}
    </Wrapper>
  )
}

function TransactionCanceled({ onDismiss }: { onDismiss: any }) {
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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
