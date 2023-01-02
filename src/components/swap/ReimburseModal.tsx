import { Contract } from '@ethersproject/contracts'
import { Fraction } from '@uniswap/sdk-core'
import { RowBetween, RowCenter } from 'components/Row'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { ExternalLink as LinkIcon } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { useV2RouterContract } from '../../hooks/useContract'
import { db, Status, TxHistoryWithPendingTx } from '../../utils/db'
import { ButtonPrimary } from '../Button'
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

export function ReimbursementModal({
  isOpen,
  onDismiss,
  historyId,
}: {
  isOpen: boolean
  onDismiss: any
  historyId: number
}) {
  const [tx, setTx] = useState<TxHistoryWithPendingTx | null>(null)

  useEffect(() => {
    const getTx = async () => {
      if (historyId > 0) {
        setTx(await db.getTxHistoryWithPendingTxById(historyId))
      }
    }

    getTx()
  }, [historyId])

  if (tx?.status === Status.REIMBURSE_AVAILABLE) {
    return ClaimReimbursement({ isOpen, onDismiss, tx })
  } else {
    return ReimbursementDetails({ isOpen, onDismiss, tx })
  }
}

export function ClaimReimbursement({
  isOpen,
  onDismiss,
  tx,
}: {
  isOpen: boolean
  onDismiss: any
  tx: TxHistoryWithPendingTx
}) {
  const routerContract = useV2RouterContract() as Contract

  const claim = async () => {
    if (tx) {
      await routerContract.reimbursement(tx.round, tx.order, tx.tx, tx.proofHash, tx.operatorSignature)
      // TODO: update status to reimbursed
      // await db.txHistory.get(tx.id).update()
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <Wrapper>
        {tx && (
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
              operator. You may claim this reimbursement at any time. If you would like to receive the reimbursement
              now, click <span style={{ fontWeight: 'bold', color: 'white' }}>Confirm Reimbursement.</span>{' '}
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
                    {tx.from.amount + tx.from.token}
                  </ThemedText.Black>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
                  <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
                    {'To'}
                  </ThemedText.Black>
                  <ThemedText.Black fontSize={18} fontWeight={600} color={'#ffffFF'}>
                    {tx.to.amount + tx.to.token}
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
                {new Date(tx.sendDate).toLocaleDateString()}
              </ThemedText.Black>
            </RowBetween>
            <RowBetween style={{ marginBottom: '10px' }}>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                Transaction Hash
              </ThemedText.Black>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                {tx.txId}
                <a href={''}>
                  <LinkIcon size="12px" />
                </a>
              </ThemedText.Black>
            </RowBetween>
            <RowBetween style={{ marginBottom: '10px' }}>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                Reimburse To
              </ThemedText.Black>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                {tx.tx.txOwner}
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
                onClick={() => onDismiss}
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
                onClick={() => claim}
              >
                Confirm
              </ButtonPrimary>
            </RowBetween>
          </Section>
        )}
      </Wrapper>
    </Modal>
  )
}

export function ReimbursementDetails({ isOpen, onDismiss, tx }: { isOpen: boolean; onDismiss: () => void; tx: any }) {
  const routerContract = useV2RouterContract() as Contract
  const [reimburseAmount, setReimburseAmount] = useState('0')

  useEffect(() => {
    const getAmount = async () => {
      const amount = (await routerContract?.reimbursementAmount()) ?? '0'
      const decimal = 18
      setReimburseAmount(JSBIDivide(JSBI.BigInt(amount), JSBI.BigInt(decimal), 6))
    }
    getAmount()
  }, [routerContract])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      <Wrapper>
        {tx && (
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
                  {new Date(tx.sendDate).toLocaleDateString()}
                </ThemedText.Black>
              </div>
              <div style={{ padding: '8px 0px' }}>
                <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
                  Amount
                </ThemedText.Black>
                <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
                  {reimburseAmount + 'MATIC'}
                </ThemedText.Black>
              </div>
              <div style={{ padding: '8px 0px' }}>
                <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
                  Reimburse To
                </ThemedText.Black>
                <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
                  {tx.tx.txOwner}
                </ThemedText.Black>
              </div>
              <div style={{ padding: '8px 0px' }}>
                <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
                  Transaction Hash
                </ThemedText.Black>
                <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
                  {tx.txId}
                  <a href={'https://'}>
                    <LinkIcon size="12px" />
                  </a>
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
        )}
      </Wrapper>
    </Modal>
  )
}

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  return new Fraction(numerator, denominator).toSignificant(precision).toString()
}
