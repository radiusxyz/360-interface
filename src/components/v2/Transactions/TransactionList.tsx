import styled from 'styled-components/macro'
import Transaction from './Transaction'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`
type Props = {
  txs: {
    id: string
    status: string
    date: string
    from: string
    to: string
  }[]
}

const TransactionList = ({ txs }: Props) => (
  <Wrapper>
    {txs.map((tx) => (
      <Transaction key={tx.id} id={tx.id} status={tx.status} date={tx.date} from={tx.from} to={tx.to} />
    ))}
  </Wrapper>
)

export default TransactionList
