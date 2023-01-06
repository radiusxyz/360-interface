import { Fraction } from '@uniswap/sdk-core'
import { useLiveQuery } from 'dexie-react-hooks'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { useState } from 'react'
import { X } from 'react-feather'
import { useCancelManager, useReimbursementManager } from 'state/modal/hooks'
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
  const [cancel, setCancel] = useCancelManager()
  const [reimbursement, setReimbursement] = useReimbursementManager()

  const { chainId } = useActiveWeb3React()

  const openCancelModal = (id: number) => {
    setCancel(id)
  }
  const openReimbursementModal = (id: number) => {
    setReimbursement(id)
  }

  const Columns = [
    {
      label: 'ID',
      accessor: 'id',
      subAccessor: 'id',
      align: 'left',
    },
    {
      label: 'Date(UTC)',
      accessor: 'txDate',
      subAccessor: 'id',
      align: 'left',
      format: (i: number, subAccessor: any) => {
        const date = new Intl.DateTimeFormat('en', { dateStyle: 'short' }).format(new Date(i * 1000))
        const time = new Intl.DateTimeFormat('en', { timeStyle: 'short', hour12: false }).format(new Date(i * 1000))
        return date + ' ' + time
      },
    },
    {
      label: 'From',
      accessor: 'from',
      subAccessor: 'id',
      align: 'left',
      format: (i: TokenAmount, subAccessor: any) =>
        JSBIDivide(JSBI.BigInt(i.amount), JSBI.BigInt(i.decimal), 6) + ' ' + i.token,
    },
    {
      label: 'To',
      accessor: 'to',
      subAccessor: 'id',
      align: 'left',
      format: (i: TokenAmount, subAccessor: any) =>
        JSBIDivide(JSBI.BigInt(i.amount), JSBI.BigInt(i.decimal), 6) + ' ' + i.token,
    },
    {
      label: 'Status',
      accessor: 'status',
      subAccessor: 'id',
      align: 'left',
      format: (i: number, subAccessor: any) => {
        switch (i) {
          case Status.CANCELED:
            return (
              <span style={{ color: '#A8A8A8' }}>
                <li>Void</li>
              </span>
            )
          case Status.COMPLETED:
            return (
              <span style={{ color: '#51FF6D' }}>
                <li>Completed</li>
              </span>
            )
          case Status.PENDING:
            return (
              <span style={{ color: '#FF4444' }}>
                <li>
                  <button
                    style={{
                      appearance: 'none',
                      background: 'transparent',
                      color: '#FF4444',
                      padding: '0px',
                      margin: '0px',
                      border: 'none',
                      fontSize: '14px',
                    }}
                    onClick={() => openCancelModal(subAccessor)}
                  >
                    {'Pending >'}
                  </button>
                </li>
              </span>
            )
          case Status.REIMBURSED:
            return (
              <span style={{ color: '#FFBF44' }}>
                <li>
                  <button
                    style={{
                      appearance: 'none',
                      background: 'transparent',
                      color: '#FFBF44',
                      padding: '0px',
                      margin: '0px',
                      border: 'none',
                      fontSize: '14px',
                    }}
                    onClick={() => openReimbursementModal(subAccessor)}
                  >
                    {'Reimbursed >'}
                  </button>
                </li>
              </span>
            )
          case Status.REIMBURSE_AVAILABLE:
            return (
              <span style={{ color: '#00A3FF' }}>
                <li>
                  <button
                    style={{
                      appearance: 'none',
                      background: 'transparent',
                      color: '#00A3FF',
                      padding: '0px',
                      margin: '0px',
                      border: 'none',
                      fontSize: '14px',
                    }}
                    onClick={() => openReimbursementModal(subAccessor)}
                  >
                    {'Claim Reimbursement >'}
                  </button>
                </li>
              </span>
            )
          case Status.REJECTED:
            return (
              <span style={{ color: '#aaaaaa' }}>
                <li>Rejected</li>
              </span>
            )
        }
        return ''
      },
    },
    {
      label: 'Transaction Hash',
      accessor: 'txId',
      align: 'right',
      subAccessor: 'txHash',
      // eslint-disable-next-line react/display-name
      format: (i: string, subAccessor: string) => {
        console.log('txHash-', i)
        const shortenTxId = i.length > 60 ? i.substring(0, 10) + '...' + i.substring(58) : i
        console.log(shortenTxId)
        return (
          <>
            <span style={{ color: '#cccccc', marginRight: '5px' }}>{shortenTxId}</span>
            <ExternalLink href={getExplorerLink(chainId ?? 80001, i, ExplorerDataType.TRANSACTION)}>
              <LinkIconThin />
            </ExternalLink>
          </>
        )
      },
    },
  ]

  const Table = ({ activePage, setActivePage }: { activePage: number; setActivePage: (_page: number) => void }) => {
    const columns = Columns
    const rowsPerPage = 10

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
                          {column.format(row[column.accessor], row[column.subAccessor])}
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

  const [activePage, setActivePage] = useState(0)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={false} maxHeight={90} width={840}>
      <Wrapper>
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
              <div onClick={onDismiss}>
                <X />
              </div>
            </div>
          </div>
          <div style={{ width: '100%', background: 'rgba(37, 39, 53)', padding: '30px' }}>
            <Table activePage={activePage} setActivePage={setActivePage} />
          </div>
        </div>
      </Wrapper>
    </Modal>
  )
}

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  return new Fraction(numerator, denominator).toSignificant(precision).toString()
}
