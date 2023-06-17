import { useState } from 'react'
import {
  Dash,
  Expand,
  TX,
  TXAmount,
  TXDateTime,
  TXDateTimeAndAmount,
  TXDetails,
  TXPreview,
  TXStatus,
} from './TransactionStyles'
import Progress from '../Progress/Progress'

type Props = { id: string; status: string; date: string; from: string; to: string }

const Transaction = ({ status, date, from, to }: Props) => {
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
      {isExpanded && <Progress page="history" />}
    </TX>
  )
}

export default Transaction
