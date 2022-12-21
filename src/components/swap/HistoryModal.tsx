import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { ExternalLink as LinkIcon, X } from 'react-feather'
import styled from 'styled-components/macro'

import { ExternalLink } from '../../theme'
import { db, Status, TokenAmount } from '../../utils/db'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import Modal from '../Modal'

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
  background: rgba(44, 47, 63);
`

export function HistoryModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  const Columns = [
    {
      label: 'ID',
      accessor: 'id',
    },
    {
      label: 'Date',
      accessor: 'txDate',
      format: (i: number) => {
        const date = new Intl.DateTimeFormat('en', { dateStyle: 'short' }).format(new Date(i))
        const time = new Intl.DateTimeFormat('en', { timeStyle: 'short', hour12: false }).format(new Date(i))
        return date + ' ' + time
      },
    },
    {
      label: 'From',
      accessor: 'from',
      // TODO: fix decimal
      format: (i: TokenAmount) => i.amount.substring(0, i.amount.length - 18) + ' ' + i.token,
    },
    {
      label: 'To',
      accessor: 'to',
      // TODO: fix decimal
      format: (i: TokenAmount) => i.amount.substring(0, i.amount.length - 18) + ' ' + i.token,
    },
    {
      label: 'Status',
      accessor: 'status',
      format: (i: number) => {
        switch (i) {
          case Status.CANCELED:
            return <span style={{ color: '#A8A8A8' }}>Void</span>
          case Status.COMPLETED:
            return <span style={{ color: '#51FF6D' }}>Completed</span>
          case Status.PENDING:
            return <span style={{ color: '#FF4444' }}>Pending</span>
          case Status.REIMBURSED:
            return <span style={{ color: '#FFBF44' }}>Reimbursed</span>
          case Status.REIMBURSE_AVAILABLE:
            return <span style={{ color: '#00A3FF' }}>Reimburse Available</span>
          case Status.REJECTED:
            return <span style={{ color: '#FFFFFF' }}>Rejected</span>
        }
        return ''
      },
    },
    {
      label: 'Transaction Hash',
      accessor: 'txId',
      format: (i: string) => {
        if (i.length > 20)
          return (
            <>
              <span style={{ color: '#cccccc' }}>{i.substring(0, 5) + '...' + i.substring(19)}</span>
              <ExternalLink href={getExplorerLink(80001, i, ExplorerDataType.TRANSACTION)}>
                <LinkIcon size={20} />
              </ExternalLink>
            </>
          )
        else
          return (
            <>
              <span style={{ color: '#cccccc' }}>{i}</span>
              <ExternalLink href={getExplorerLink(80001, i, ExplorerDataType.TRANSACTION)}>
                <LinkIcon size={20} color={'#cccccc'} />
              </ExternalLink>
            </>
          )
      },
    },
  ]

  const Table = () => {
    const columns = Columns
    const rowsPerPage = 10
    const [activePage, setActivePage] = useState(0)
    const rows = useLiveQuery(async () => {
      return await db.txHistory
        .orderBy('txDate')
        .reverse()
        .offset(activePage * rowsPerPage)
        .limit(rowsPerPage)
        .toArray()
    }, [activePage])

    const count = useLiveQuery(async () => {
      return await db.txHistory.count()
    })

    const flag = count ? (count / rowsPerPage - Math.floor(count / rowsPerPage) === 0 ? true : false) : false
    const page = count ? (flag ? Math.floor(count / rowsPerPage) : Math.floor(count / rowsPerPage) + 1) : 0

    return (
      <>
        <table style={{ width: '100%', fontSize: '12', fontWeight: 'normal' }}>
          <thead>
            <tr>
              {columns.map((column: any) => {
                return (
                  <th key={column.accessor} style={{ fontSize: '12', fontWeight: 'bold' }}>
                    {column.label}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {rows?.map((row: any) => {
              return (
                <tr key={row.id}>
                  {columns.map((column: any) => {
                    const align = column.align ? column.align : 'center'
                    if (column.format) {
                      return (
                        <td
                          key={column.accessor}
                          style={{ textAlign: align, fontSize: '14px', fontWeight: 'normal', color: '#a8a8a8' }}
                        >
                          {column.format(row[column.accessor])}
                        </td>
                      )
                    }
                    return (
                      <td
                        key={column.accessor}
                        style={{ textAlign: align, fontSize: '14px', fontWeight: 'normal', color: '#a8a8a8' }}
                      >
                        {row[column.accessor]}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center' }}>
          {[...Array(page).keys()].map((i) => (
            <div
              key={i}
              style={{ padding: '5px' }}
              onClick={() => {
                console.log(i)
                setActivePage(i)
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </>
    )
  }

  function getModalContent() {
    return {
      width: 730,
      content: (
        <div
          style={{
            padding: '25px',
            width: '730px',
          }}
        >
          <div
            style={{
              justifyContent: 'space-between',
              display: 'flex',
              flexDirection: 'row',
              paddingBottom: '18px',
            }}
          >
            <div style={{ fontSize: '18', fontWeight: 'normal' }}>Recent Transactions</div>
            <div>
              <div onClick={() => onDismiss}>
                <X />
              </div>
            </div>
          </div>
          <div style={{ width: '100%', background: 'rgba(37, 39, 53)', padding: '32px' }}>
            <Table />
          </div>
        </div>
      ),
    }
  }

  const contentsInfo = getModalContent()

  return (
    <Modal isOpen={isOpen} onDismiss={() => onDismiss} minHeight={false} maxHeight={90} width={contentsInfo.width}>
      <Wrapper>{contentsInfo.content}</Wrapper>
    </Modal>
  )
}
