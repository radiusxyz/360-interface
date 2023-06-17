import styled from 'styled-components/macro'
import PendingTransaction from './PendingTransaction'
import CompletedTransaction from './CompletedTransaction'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`
type Props = {
  status: string
  txs: {
    id: string
    status: string
    date: string
    from: string
    to: string
  }[]
}

const TransactionList = ({ txs, status }: Props) => (
  <Wrapper>
    {(status === 'In Progress' &&
      txs.map((tx) => (
        <PendingTransaction key={tx.id} id={tx.id} status={tx.status} date={tx.date} from={tx.from} to={tx.to} />
      ))) ||
      txs.map((tx) => (
        <CompletedTransaction key={tx.id} id={tx.id} status={tx.status} date={tx.date} from={tx.from} to={tx.to} />
      ))}
  </Wrapper>
)

export default TransactionList
