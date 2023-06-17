import { useState } from 'react'
import {
  BottomRowSpan,
  TXAmountCompleted,
  TXBottomRow,
  TXPreviewCompleted,
  TxCompleted,
} from './CompletedTransactionStyles'
import { Dash, TXDateTime, TXDateTimeAndAmount, TXDetails, TXStatus } from './PendingTransactionStyles'
import ReimbursementModal from './ReimbursementModal'
import ReimbursementDetailsModal from './ReimbursementDetailsModal'

type Props = { tx: { id: string; status: string; date: string; from: string; to: string; reimbused?: boolean } }

const CompletedTransaction = ({ tx: { status, date, from, to, reimbused } }: Props) => {
  const [showReimbursementModal, setShowReimbursementModal] = useState(false)
  const [showReimbursementDetailsModal, setShowReimbursementDetailsModal] = useState(false)

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
            <TXStatus status={status}>{status}</TXStatus>
            <TXDateTimeAndAmount>
              <TXDateTime>{date}</TXDateTime>
              <TXAmountCompleted>
                {from} <Dash>&mdash;&mdash;</Dash> {to}
              </TXAmountCompleted>
            </TXDateTimeAndAmount>
          </TXDetails>
        </TXPreviewCompleted>
        <TXBottomRow>
          <BottomRowSpan onClick={handleReimbursementModal}>
            {reimbused ? 'Reimbursement details' : 'Reimbursement'}
          </BottomRowSpan>
          <BottomRowSpan onClick={handleReimbursementDetailsModal}>Transaction Detail</BottomRowSpan>
        </TXBottomRow>
      </TxCompleted>
      {showReimbursementModal && <ReimbursementModal handleModal={handleReimbursementModal} />}
      {showReimbursementDetailsModal && <ReimbursementDetailsModal handleModal={handleReimbursementDetailsModal} />}
    </>
  )
}

export default CompletedTransaction
