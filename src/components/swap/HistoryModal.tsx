import { useLiveQuery } from 'dexie-react-hooks'
import JSBI from 'jsbi'
import { useState } from 'react'
import { X } from 'react-feather'
import { useCancelManager } from 'state/modal/hooks'
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

function LinkIconThin() {
  return (
    <img
      src="images/launch-link-open-thin.png"
      width="16px"
      height="16px"
      alt="link"
      style={{ position: 'relative' }}
    />
  )
}

export function HistoryModal({ isOpen, onDismiss }: { isOpen: boolean; onDismiss: () => void }) {
  // TODO: order === -1 이면 cancel 버튼 활성화
  const [cancel, setCancel] = useCancelManager()

  const Columns = [
    {
      label: 'ID',
      accessor: 'id',
      align: 'left',
    },
    {
      label: 'Date',
      accessor: 'txDate',
      align: 'left',
      format: (i: number) => {
        const date = new Intl.DateTimeFormat('en', { dateStyle: 'short' }).format(new Date(i))
        const time = new Intl.DateTimeFormat('en', { timeStyle: 'short', hour12: false }).format(new Date(i))
        return date + ' ' + time
      },
    },
    {
      label: 'From',
      accessor: 'from',
      align: 'left',
      format: (i: TokenAmount) => JSBIDivide(JSBI.BigInt(i.amount), JSBI.BigInt(i.decimal), 6) + ' ' + i.token,
    },
    {
      label: 'To',
      accessor: 'to',
      align: 'left',
      format: (i: TokenAmount) => JSBIDivide(JSBI.BigInt(i.amount), JSBI.BigInt(i.decimal), 6) + ' ' + i.token,
    },
    {
      label: 'Status',
      accessor: 'status',
      align: 'left',
      format: (i: number) => {
        switch (i) {
          case Status.CANCELED:
            return <span style={{ color: '#A8A8A8' }}>Void</span>
          case Status.COMPLETED:
            return (
              <span style={{ color: '#51FF6D' }}>
                <li>
                  <span style={{ transform: 'translateX(-9px)' }}>Completed</span>
                </li>
              </span>
            )
          case Status.PENDING:
            return <span style={{ color: '#FF4444' }}>Pending</span>
          case Status.REIMBURSED:
            return <span style={{ color: '#FFBF44' }}>{'Reimbursed >'}</span>
          case Status.REIMBURSE_AVAILABLE:
            return <span style={{ color: '#00A3FF' }}>{'Request Reimburse >'}</span>
          case Status.REJECTED:
            return <span style={{ color: '#FFFFFF' }}>Rejected</span>
        }
        return ''
      },
    },
    {
      label: 'Transaction Hash',
      accessor: 'txId',
      align: 'right',
      subAccessor: 'txHash',
      format: (i: string) => {
        if (i.length > 20)
          return (
            <>
              <span style={{ color: '#cccccc', marginRight: '5px' }}>
                {i.substring(0, 5) + '...' + i.substring(19)}
              </span>
              <ExternalLink href={getExplorerLink(80001, i, ExplorerDataType.TRANSACTION)}>
                <LinkIconThin />
              </ExternalLink>
            </>
          )
        else if (i.length > 0) {
          return (
            <>
              <span style={{ color: '#cccccc', marginRight: '5px' }}>{i}</span>
              <ExternalLink
                href={getExplorerLink(80001, i, ExplorerDataType.TRANSACTION)}
                style={{ verticalAlign: 'middle' }}
              >
                <LinkIconThin />
              </ExternalLink>
            </>
          )
        } else {
          return (
            <button onClick={() => setCancel(0)}>
              <span style={{ color: '#ff8888' }}>cancel</span>
            </button>
          )
        }
      },
    },
  ]

  const Table = () => {
    const columns = Columns
    const rowsPerPage = 10
    const [activePage, setActivePage] = useState(0)
    const rows = useLiveQuery(async () => {
      const history = await db.txHistory
        .orderBy('txDate')
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
                  <th key={column.accessor} style={{ fontSize: '14', fontWeight: 'bolder', textAlign: 'left' }}>
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
                          style={{
                            textAlign: align,
                            fontSize: '14px',
                            fontWeight: 'normal',
                            color: '#a8a8a8',
                          }}
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
        <div
          style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', marginTop: '29px' }}
        >
          {[...Array(page).keys()].map((i) => (
            <div
              key={i}
              style={{ padding: '0px 5px', fontSize: '14px' }}
              onClick={() => {
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
      width: 840,
      content: (
        <div
          style={{
            padding: '30px',
            width: '840px',
          }}
        >
          <div
            style={{
              justifyContent: 'space-between',
              display: 'flex',
              flexDirection: 'row',
              paddingBottom: '30px',
            }}
          >
            <div style={{ fontSize: '18', fontWeight: 'bold' }}>Recent Transactions</div>
            <div>
              <div onClick={() => onDismiss()}>
                <X />
              </div>
            </div>
          </div>
          <div style={{ width: '100%', background: 'rgba(37, 39, 53)', padding: '30px' }}>
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

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  // if (precision < 0) return Error('precision must bigger than 0')
  // if (denominator === JSBI.BigInt(0)) return Error('divide by zero')

  const division = JSBI.divide(numerator, denominator).toString()
  let remain = JSBI.remainder(numerator, denominator).toString()

  remain = remain.length > precision ? remain.substring(0, precision) : remain

  return division + '.' + remain
}
