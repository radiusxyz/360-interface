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
import Progress from '../Progress/Progress'

type Props = { id: string; status: string; date: string; from: string; to: string }

const PendingTransaction = ({ status, date, from, to }: Props) => {
  const [isExpanded, setIsExpand] = useState(false)
  const handleExpand = () => {
    setIsExpand((state: boolean) => !state)
  }
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
          <Progress page="history" />
        </ProgressWrapper>
      )}
    </TX>
  )
}

export default PendingTransaction
