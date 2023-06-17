import styled from 'styled-components/macro'
import cuid from 'cuid'
import Transaction from './Transaction'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`

const data = [
  {
    id: cuid(),
    status: 'Pending',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    id: cuid(),
    status: 'Failed',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    id: cuid(),
    status: 'Completed',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    id: cuid(),
    status: 'Completed',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
  {
    id: cuid(),
    status: 'Pending',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
]

const TransactionList = () => (
  <Wrapper>
    {data.map((tx) => (
      <Transaction key={tx.id} id={tx.id} status={tx.status} date={tx.date} from={tx.from} to={tx.to} />
    ))}
  </Wrapper>
)

export default TransactionList
