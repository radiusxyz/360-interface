import Tabs from 'components/v2/Transactions/Tabs'
import TransactionList from 'components/v2/Transactions/TransactionList'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Status, statusToString, TokenAmount } from 'utils/db'
import moment from 'moment'
import { useParams } from 'react-router-dom'
import { token2str } from 'utils'

const Wrapper = styled.div`
  display: flex;
  max-width: 700px;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
  padding: 18px 0px;
`

const Pagination = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  justify-content: center;
`

const Page = styled.button`
  border: none;
  background-color: transparent;
  padding: 10px;
  color: skyblue;
`

const History = () => {
  const [activePage, setActivePage] = useState(0)
  const [pages, setPages] = useState<number[]>([])

  const params = useParams()
  const { status } = params

  const handleTabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const target = event.target as HTMLButtonElement
    setActiveTab(target.textContent as string)
  }

  const [activeTab, setActiveTab] = useState(status === 'in-progress' ? 'In Progress' : 'Completed')

  // const handleTXlist = (activeTab: string) => {
  //   if (activeTab === 'In Progress') setTxs(() => data.filter((tx) => tx.status === 'Pending'))
  //   else setTxs(() => data.filter((tx) => tx.status !== 'Pending'))
  // }

  // useEffect(() => {
  //   handleTXlist(activeTab)
  // }, [activeTab])

  const rowsPerPage = 10

  const rows = useLiveQuery(async () => {
    const totalCnt = await db.swap.count()
    const doneCnt = await db.swap.where('txDate').noneOf([0]).count()

    let cnt = 0
    if (activeTab === 'In Progress') cnt = totalCnt - doneCnt
    else cnt = doneCnt

    const array = []
    for (let i = 0; i < cnt / rowsPerPage; i++) {
      array.push(i + 1)
    }
    setPages(array)

    const history = await db.swap
      .orderBy('id')
      .reverse()
      .offset(activePage * rowsPerPage)
      .limit(rowsPerPage)

    return history.toArray()
  }, [activePage, activeTab])

  const pendingTxs: {
    id: string
    hash: string
    status: string
    date: string
    from: string
    to: string
    reimbursed?: boolean
    tx: any
  }[] = []
  const completedTxs: {
    id: string
    hash: string
    status: string
    date: string
    from: string
    to: string
    reimbursed?: boolean
    tx: any
  }[] = []

  rows?.forEach((row) => {
    if (row.txDate) {
      completedTxs.push({
        id: row.id ? row.id.toString() : '-1',
        hash: row.txId as string,
        status: statusToString(row.status as Status),
        date: moment(new Date(row.txDate * 1000)).format('DD MMMM YYYY - h:mm A'),
        ...(row.fromResult ? { from: token2str(row.fromResult) } : { from: token2str(row.from as TokenAmount) }),
        ...(row.toResult ? { to: token2str(row.toResult) } : { to: token2str(row.to as TokenAmount) }),
        tx: row,
      })
    } else if (row.from && row.to && row.sendDate) {
      pendingTxs.push({
        id: row.id ? row.id.toString() : '-1',
        hash: row.txId as string,
        status: statusToString(row.status as Status),
        date: moment(new Date(row.sendDate * 1000)).format('DD MMMM YYYY - h:mm A'),
        from: token2str(row.from),
        to: token2str(row.to),
        tx: row,
      })
    }
  })

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
      <Pagination>
        {pages.map((i) => (
          <Page key={i} onClick={() => setActivePage(i - 1)}>
            {i}
          </Page>
        ))}
      </Pagination>
    </Wrapper>
  )
}

export default History
