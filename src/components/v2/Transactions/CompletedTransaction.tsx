import {
  BottomRowSpan,
  TXAmountCompleted,
  TXBottomRow,
  TXPreviewCompleted,
  TxCompleted,
} from './CompletedTransactionStyles'
import { Dash, TXDateTime, TXDateTimeAndAmount, TXDetails, TXStatus } from './PendingTransactionStyles'

type Props = { id: string; status: string; date: string; from: string; to: string }

const CompletedTransaction = ({ status, date, from, to }: Props) => {
  return (
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
        <BottomRowSpan>Reimbursement</BottomRowSpan>
        <BottomRowSpan>Transaction Detail</BottomRowSpan>
      </TXBottomRow>
    </TxCompleted>
  )
}

export default CompletedTransaction
