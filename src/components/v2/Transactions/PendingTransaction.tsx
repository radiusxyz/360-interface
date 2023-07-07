import { useState } from 'react'
import {
  Dash,
  Expand,
  ProgressWrapper,
  TX,
  TXAmount,
  TXDateTime,
  TXDateTimeAndAmount,
  TXDetails,
  TXPreview,
  TXStatus,
} from './PendingTransactionStyles'
import StraightProgress from './StraightProgress'
import { Status, stringToStatus } from 'utils/db'

type Props = { tx: { id: string; status: string; date: string; from: string; to: string; reimbursed?: boolean } }

const PendingTransaction = ({ tx: { status, date, from, to } }: Props) => {
  const [isExpanded, setIsExpand] = useState(false)
  const handleExpand = () => {
    setIsExpand((state: boolean) => !state)
  }

  let progress = 0
  if (stringToStatus(status) === Status.PENDING) progress = 50
  if (stringToStatus(status) === Status.CANCELED) progress = 100
  if (stringToStatus(status) === Status.COMPLETED) progress = 100
  if (stringToStatus(status) === Status.REJECTED) progress = 100
  if (stringToStatus(status) === Status.REIMBURSE_AVAILABLE) progress = 100
  if (stringToStatus(status) === Status.REIMBURSED) progress = 100

  return (
    <TX>
      <TXPreview>
        <TXDetails>
          <TXStatus status={status}>{status}</TXStatus>
          <TXDateTimeAndAmount>
            <TXDateTime>{date}</TXDateTime>
            <TXAmount>
              {from} <Dash>&mdash;&mdash;</Dash> {to}
            </TXAmount>
          </TXDateTimeAndAmount>
        </TXDetails>
        <Expand rotate={isExpanded ? 1 : 0} onClick={handleExpand} />
      </TXPreview>
      {isExpanded && (
        <ProgressWrapper>
          <StraightProgress percentage={progress} />
        </ProgressWrapper>
      )}
    </TX>
  )
}

export default PendingTransaction
