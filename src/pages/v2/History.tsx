import Tabs from 'components/v2/Transactions/Tabs'
import TransactionList from 'components/v2/Transactions/TransactionList'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Status, statusToString } from 'utils/db'
import moment from 'moment'

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

  const pendingTxs: { id: string; status: string; date: string; from: string; to: string; reimbursed?: boolean }[] = []
  const completedTxs: { id: string; status: string; date: string; from: string; to: string; reimbursed?: boolean }[] =
    []

  rows?.forEach((row) => {
    if (row.fromResult && row.toResult && row.txDate) {
      completedTxs.push({
        id: row.id ? row.id.toString() : '-1',
        status: statusToString(row.status as Status),
        date: moment(new Date(row.txDate * 1000)).format('DD MMMM YYYY - h:mm A'),
        from: token2str(row.fromResult),
        to: token2str(row.toResult),
      })
    } else if (row.from && row.to && row.sendDate) {
      pendingTxs.push({
        id: row.id ? row.id.toString() : '-1',
        status: statusToString(row.status as Status),
        date: moment(new Date(row.sendDate * 1000)).format('DD MMMM YYYY - h:mm A'),
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
      <TransactionList txs={activeTab === 'In Progress' ? pendingTxs : completedTxs} status={activeTab} />
    </Wrapper>
  )
}

export default History
