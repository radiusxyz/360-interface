import Tabs from 'components/v2/Transactions/Tabs'
import TransactionList from 'components/v2/Transactions/TransactionList'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from 'utils/db'

const Wrapper = styled.div`
  display: flex;
  max-width: 700px;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  padding: 18px 0px;
`

const History = () => {
  // const [txs, setTxs] = useState(data)

  const handleTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = event.target as HTMLButtonElement
    setActiveTab(target.textContent as string)
  }

  const [activeTab, setActiveTab] = useState('In Progress')

  // const handleTXlist = (activeTab: string) => {
  //   if (activeTab === 'In Progress') setTxs(() => data.filter((tx) => tx.status === 'Pending'))
  //   else setTxs(() => data.filter((tx) => tx.status !== 'Pending'))
  // }

  // useEffect(() => {
  //   handleTXlist(activeTab)
  // }, [activeTab])

  const activePage = 0
  const rowsPerPage = 10

  const rows = useLiveQuery(async () => {
    const history = await db.swap
      .orderBy('id')
      .reverse()
      .offset(activePage * rowsPerPage)
      .limit(rowsPerPage)

    // await history.each(async (obj, cursor) => {
    //   console.log(obj, cursor)
    //   const a = await db.getTxHistoryWithPendingTxById(obj.id as number)
    //   console.log(a)
    // })
    return history.toArray()
  }, [activePage])

  console.log(rows)

  const txs: { id: string; status: string; date: string; from: string; to: string; reimbursed?: boolean }[] = []

  rows?.forEach((row) => {
    console.log('row', row)
    if (row.fromResult && row.toResult && row.txDate) {
      console.log(row, token2str(row.fromResult), token2str(row.toResult))
      txs.push({
        id: row.id ? row.id.toString() : '-1',
        status: 'pending',
        date: new Date(row.txDate).toDateString(),
        from: token2str(row.fromResult),
        to: token2str(row.toResult),
      })
    } else if (row.from && row.to && row.txDate) {
      console.log(row, token2str(row.from), token2str(row.to))
      txs.push({
        id: row.id ? row.id.toString() : '-1',
        status: 'pending',
        date: new Date(row.txDate * 1000).toDateString(),
        from: token2str(row.from),
        to: token2str(row.to),
      })
    }
  })

  function token2str(row: { amount: string; decimal: string; token: string }) {
    const amount = Number(row.amount) / Number(row.decimal)
    return amount.toString() + ' ' + row.token
  }

  /* {
    id: cuid(),
    status: 'Pending',
    date: '18 April 2023 - 5:18 PM',
    from: '0.001 WMATIC',
    to: '0.000000557497 ETH',
  } */

  return (
    <Wrapper>
      <Tabs handleTabClick={handleTabClick} activeTab={activeTab} />
      <TransactionList txs={txs} status={'In Progress'} />
    </Wrapper>
  )
}

export default History
