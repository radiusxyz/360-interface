import Tabs from 'components/v2/Transactions/Tabs'
import TransactionList from 'components/v2/Transactions/TransactionList'
import cuid from 'cuid'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'

const Wrapper = styled.div`
  display: flex;
  max-width: 700px;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  padding: 18px 0px;
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
    reimbursed: true,
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
    status: 'failed',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
    reimbursed: false,
  },
  {
    id: cuid(),
    status: 'Pending',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  },
]

const History = () => {
  const [txs, setTxs] = useState(data)

  const handleTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = event.target as HTMLButtonElement
    setActiveTab(target.textContent as string)
  }

  const [activeTab, setActiveTab] = useState('In Progress')

  const handleTXlist = (activeTab: string) => {
    if (activeTab === 'In Progress') setTxs(() => data.filter((tx) => tx.status === 'Pending'))
    else setTxs(() => data.filter((tx) => tx.status !== 'Pending'))
  }

  useEffect(() => {
    handleTXlist(activeTab)
  }, [activeTab])

  return (
    <Wrapper>
      <Tabs handleTabClick={handleTabClick} activeTab={activeTab} />
      <TransactionList txs={txs} status={activeTab} />
    </Wrapper>
  )
}

export default History
