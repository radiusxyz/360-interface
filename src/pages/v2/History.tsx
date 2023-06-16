import Tabs from 'components/v2/Transactions/Tabs'
import TransactionList from 'components/v2/Transactions/TransactionList'
import styled from 'styled-components/macro'

const Wrapper = styled.div`
  display: flex;
  max-width: 700px;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  margin-top: 18px;
`

const History = () => {
  return (
    <Wrapper>
      <Tabs />
      <TransactionList />
    </Wrapper>
  )
}

export default History
