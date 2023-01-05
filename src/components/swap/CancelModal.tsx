import { Contract } from '@ethersproject/contracts'
import { Fraction } from '@uniswap/sdk-core'
import { RowBetween, RowCenter } from 'components/Row'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { ArrowRight } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { useRecorderContract } from '../../hooks/useContract'
import { db, ReadyTx, Status, TokenAmount } from '../../utils/db'
import { ButtonError, ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'

const Wrapper = styled.div`
  width: 100%;
  background: rgba(44, 47, 63);
  padding: 35px;
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
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <TransactionCancelSuggest onDismiss={onDismiss} readyTxId={readyTxId} />
    </Modal>
  )
}

function TransactionCancelSuggest({ onDismiss, readyTxId }: { onDismiss: any; readyTxId: number }) {
  // const { account, chainId, library } = useActiveWeb3React()

  // const signer = library?.getSigner()
  const [readyTx, setReadyTx] = useState<ReadyTx | undefined>(undefined)

  const recorderContract = useRecorderContract() as Contract

  const [time, setTime] = useState(Date.now())

  const sendCancelTx = async () => {
    if (readyTx !== undefined) {
      await recorderContract.disableTxHash(readyTx.txHash)

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
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now() / 1000)
    }, 1000)

    const updateReadyTx = async () => {
      if (readyTx === undefined) {
        setReadyTx(await db.readyTxs.get(readyTxId))
      }
    }
    updateReadyTx()

    return () => {
      clearInterval(interval)
    }
  }, [])

  // 시간이 지나면 자동으로 modal 사라짐
  // useEffect(() => {
  //   if (readyTx && readyTx.tx.availableFrom - Math.floor(Date.now() / 1000) < 0) {
  //     onDismiss()
  //   }
  // }, [time])

  const continueTx = async () => {
    if (readyTx !== undefined) {
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
    }
    onDismiss()
  }

  return (
    <Wrapper>
      {readyTx && (
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
            </div>
            <br />
            <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
              You may cancel for a transaction timeout as the operator is not responding. Cancellation must be made
              within the remaining time or it may be processed on the blockchain.
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
              <span style={{ color: 'red', fontWeight: 'bold' }}>
                &nbsp;
                {readyTx.tx.availableFrom - Math.floor(time)}
              </span>
            </ButtonPrimary>
            <ProceedButton
              style={{ width: '35%', height: '46px', borderRadius: '4px', margin: '0px', fontWeight: 'bold' }}
              onClick={() => continueTx()}
            >
              Proceed Swap
            </ProceedButton>
          </RowBetween>
        </Section>
      )}
    </Wrapper>
  )
}

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  return new Fraction(numerator, denominator).toSignificant(precision).toString()
}
