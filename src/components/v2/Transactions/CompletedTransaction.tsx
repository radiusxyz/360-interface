import { useState } from 'react'
import {
  BottomRowSpan,
  TXAmountCompleted,
  TXBottomRow,
  TXPreviewCompleted,
  TxCompleted,
} from './CompletedTransactionStyles'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import {
  Dash,
  TXCommitBox,
  TXCommitment,
  TXDateTime,
  TXDateTimeAndAmount,
  TXDetails,
  TXStatus,
} from './PendingTransactionStyles'
import ReimbursementModal from './ReimbursementModal'
import ReimbursementDetailsModal from './ReimbursementDetailsModal'
import { Status, statusToString } from 'utils/db'
import useActiveWeb3React from 'hooks/useActiveWeb3React'

type Props = {
  tx: {
    id: string
    hash: string
    status: string
    date: string
    from: string
    to: string
    round: number
    order: number
    reimbursed?: boolean
    tx: any
  }
}

const CompletedTransaction = ({ tx: { status, hash, date, from, to, round, order, reimbursed, tx } }: Props) => {
  const { chainId } = useActiveWeb3React()

  const [showReimbursementModal, setShowReimbursementModal] = useState(false)
  const [showReimbursementDetailsModal, setShowReimbursementDetailsModal] = useState(false)
  const [hover, setHover] = useState(false)

  const handleReimbursementModal = () => {
    setShowReimbursementModal((showModal) => !showModal)
  }

  const handleReimbursementDetailsModal = () => {
    setShowReimbursementDetailsModal((showModal) => !showModal)
  }

  return (
    <>
      <TxCompleted>
        <TXPreviewCompleted>
          <TXDetails>
            <TXStatus status={status === 'Completed' ? 'Completed' : 'Failed'}>
              {status === 'Completed' ? 'Completed' : 'Failed'}
            </TXStatus>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <TXCommitBox>
                <TXCommitment>round:</TXCommitment>
                <TXCommitment>order:</TXCommitment>
              </TXCommitBox>
              <TXCommitBox>
                <TXCommitment>{round}</TXCommitment>
                <TXCommitment>{order}</TXCommitment>
              </TXCommitBox>
            </div>

            <TXDateTimeAndAmount>
              <TXDateTime>{date}</TXDateTime>
              <TXAmountCompleted>
                {from} <Dash>&mdash;&mdash;</Dash> {to}
              </TXAmountCompleted>
            </TXDateTimeAndAmount>
          </TXDetails>
        </TXPreviewCompleted>
        <TXBottomRow>
          {status === statusToString(Status.REIMBURSED) ? (
            <BottomRowSpan onClick={handleReimbursementDetailsModal}>Reimbursement details</BottomRowSpan>
          ) : status === statusToString(Status.REIMBURSE_AVAILABLE) ? (
            <BottomRowSpan onClick={handleReimbursementModal}>Reimburse</BottomRowSpan>
          ) : (
            <></>
          )}
          <BottomRowSpan>
            <a
              target={'_blank'}
              href={getExplorerLink(chainId as number, hash, ExplorerDataType.TRANSACTION)}
              onMouseOver={() => {
                setHover(true)
              }}
              onMouseLeave={() => {
                setHover(false)
              }}
              style={
                hover
                  ? {
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '14px',
                      color: '#8d95d7',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }
                  : {
                      fontWeight: 400,
                      fontSize: '12px',
                      lineHeight: '14px',
                      color: '#8d95d7',
                      cursor: 'pointer',
                      textDecoration: 'none',
                    }
              }
              rel="noreferrer"
            >
              Transaction Detail
            </a>
          </BottomRowSpan>
        </TXBottomRow>
      </TxCompleted>
      {showReimbursementModal && <ReimbursementModal handleModal={handleReimbursementModal} tx={tx} />}
      {showReimbursementDetailsModal && <ReimbursementDetailsModal handleModal={handleReimbursementDetailsModal} />}
    </>
  )
}

export default CompletedTransaction
