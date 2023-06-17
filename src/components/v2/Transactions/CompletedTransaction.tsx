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

type Props = { id: string; status: string; date: string; from: string; to: string }

const CompletedTransaction = ({ status, date, from, to }: Props) => {
  const [showModal, setShowModal] = useState(false)

  const handleModal = () => {
    setShowModal((showModal) => !showModal)
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
          <BottomRowSpan onClick={handleModal}>Reimbursement</BottomRowSpan>
          <BottomRowSpan>Transaction Detail</BottomRowSpan>
        </TXBottomRow>
      </TxCompleted>
      {showModal && <ReimbursementModal handleModal={handleModal} />}
    </>
  )
}

export default CompletedTransaction
