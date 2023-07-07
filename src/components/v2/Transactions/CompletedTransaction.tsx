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
import { Status, statusToString } from 'utils/db'

type Props = { tx: { id: string; status: string; date: string; from: string; to: string; reimbursed?: boolean } }

const CompletedTransaction = ({ tx: { status, date, from, to, reimbursed } }: Props) => {
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
            <TXStatus status={status === 'Completed' ? 'Completed' : 'Failed'}>
              {status === 'Completed' ? 'Completed' : 'Failed'}
            </TXStatus>
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
          <BottomRowSpan>Transaction Detail</BottomRowSpan>
        </TXBottomRow>
      </TxCompleted>
      {showReimbursementModal && <ReimbursementModal handleModal={handleReimbursementModal} />}
      {showReimbursementDetailsModal && <ReimbursementDetailsModal handleModal={handleReimbursementDetailsModal} />}
    </>
  )
}

export default CompletedTransaction
