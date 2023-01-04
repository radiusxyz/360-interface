import Dexie, { IndexableType, Table } from 'dexie'

export enum Status {
  PENDING,
  COMPLETED,
  CANCELED,
  REJECTED,
  REIMBURSE_AVAILABLE,
  REIMBURSED,
}

export interface TX {
  txOwner: string
  functionSelector: string
  amountIn: string
  amountOut: string
  path: string[]
  to: string
  nonce: number
  availableFrom: number
  deadline: number
}

export interface TokenAmount {
  token: string
  amount: string
  decimal: string
}

export interface ReadyTx {
  id?: number
  tx: TX
  mimcHash: string
  txHash: string
  progressHere: number
  from: TokenAmount
  to: TokenAmount
}

export interface PendingTx {
  id?: number
  readyTxId: number

  sendDate: number

  round: number
  order: number
  proofHash: string
  operatorSignature?: { r: string; s: string; v: number }
  progressHere: number
}

export interface TxHistory {
  id?: number
  pendingTxId: number
  txId: string
  txDate: number
  from: TokenAmount
  to: TokenAmount
  status: Status
}

export interface TxHistoryParam {
  pendingTxId?: number
  txId?: string
  txDate?: number
  from?: TokenAmount
  to?: TokenAmount
  status?: Status
}

export interface PendingTxWithReadyTx extends PendingTx, ReadyTx {}
export interface TxHistoryWithPendingTx extends TxHistory, PendingTx, ReadyTx {}

export class MySubClassedDexie extends Dexie {
  readyTxs!: Table<ReadyTx>
  pendingTxs!: Table<PendingTx>
  txHistory!: Table<TxHistory>

  constructor() {
    super('ThreeSixty')
    this.version(1).stores({
      readyTxs: '++id, txHash, progressHere',
      pendingTxs: '++id, sendDate, txOwner, nonce, round, order, txHash, progressHere',
      txHistory: '++id, pendingTxId, txDate, txId, fromToken, toToken',
    })
  }

  async getTxHistoryWithPendingTxById(id: number) {
    const tx = await this.txHistory.where({ id }).first()

    const pendingTx = await this.pendingTxs.get(tx?.pendingTxId as number)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx, ...tx } as TxHistoryWithPendingTx
  }

  async getTxHistoryWithPendingTxByKey(key: IndexableType) {
    const tx = await this.txHistory.get(key)

    const pendingTx = await this.pendingTxs.get(tx?.pendingTxId as number)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx, ...tx } as TxHistoryWithPendingTx
  }

  async getPendingTxWithReadyTxById(id: number) {
    const pendingTx = await this.pendingTxs.get(id)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx } as PendingTxWithReadyTx
  }

  async getPendingTxWithReadyTxByKey(key: IndexableType) {
    const pendingTx = await this.pendingTxs.get(key)

    const readyTx = await this.readyTxs.get(pendingTx?.readyTxId as number)

    return { ...readyTx, ...pendingTx } as PendingTxWithReadyTx
  }

  async pushTxHistory(_where: { field: string; value: any }, _history: TxHistoryParam) {
    if ((await db.txHistory.where(_where.field).equals(_where.value).toArray()).length === 0) {
      console.log('1')
      await db.txHistory.add({
        pendingTxId: _history.pendingTxId ?? 0,
        txId: _history.txId ?? '',
        txDate: _history.txDate ?? Date.now(),
        from: _history.from ?? { token: '', amount: '', decimal: '1' },
        to: _history.to ?? { token: '', amount: '', decimal: '1' },
        status: _history.status ?? Status.PENDING,
      })
    } else {
      console.log('2')
      const history: TxHistoryParam = {}
      await db.txHistory.where(_where.field).equals(_where.value).modify({ pendingTxId: _history.pendingTxId })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ txId: _history.txId })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ txDate: _history.txDate })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ from: _history.from })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ to: _history.to })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ status: _history.status })
    }
  }
}

/**  txId: string
  txDate: number
  from: TokenAmount
  to: TokenAmount
  status: Status
 */
export const db = new MySubClassedDexie()
