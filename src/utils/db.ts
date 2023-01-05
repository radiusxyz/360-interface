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

export interface PendingTxParam {
  readyTxId?: number

  sendDate?: number

  round?: number
  order?: number
  proofHash?: string
  operatorSignature?: { r: string; s: string; v: number }
  progressHere?: number
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
      pendingTxs: '++id, readyTxId, sendDate, txOwner, nonce, round, order, txHash, progressHere',
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

  async pushPendingTx(_where: { field: string; value: any }, _pendingTx: PendingTxParam) {
    if ((await db.pendingTxs.where(_where.field).equals(_where.value).toArray()).length === 0) {
      const id = await db.pendingTxs.add({
        readyTxId: _pendingTx.readyTxId ?? 0,
        sendDate: _pendingTx.sendDate ?? Date.now(),
        round: _pendingTx.round ?? 0,
        order: _pendingTx.order ?? -1,
        proofHash: _pendingTx.proofHash ?? '',
        operatorSignature: _pendingTx.operatorSignature ?? { r: '', s: '', v: 27 },
        progressHere: _pendingTx.progressHere ?? 0,
      })
      return id
    } else {
      await db.pendingTxs.where(_where.field).equals(_where.value).modify({ readyTxId: _pendingTx.readyTxId })
      await db.pendingTxs.where(_where.field).equals(_where.value).modify({ sendDate: _pendingTx.sendDate })
      await db.pendingTxs.where(_where.field).equals(_where.value).modify({ round: _pendingTx.round })
      await db.pendingTxs.where(_where.field).equals(_where.value).modify({ order: _pendingTx.order })
      await db.pendingTxs.where(_where.field).equals(_where.value).modify({ proofHash: _pendingTx.proofHash })
      await db.pendingTxs
        .where(_where.field)
        .equals(_where.value)
        .modify({ operatorSignature: _pendingTx.operatorSignature })
      await db.pendingTxs.where(_where.field).equals(_where.value).modify({ progressHere: _pendingTx.progressHere })

      const pendingTx = await db.pendingTxs.where(_where.field).equals(_where.value).first()

      return pendingTx?.id as number as IndexableType
    }
  }
  async pushTxHistory(_where: { field: string; value: any }, _history: TxHistoryParam) {
    if ((await db.txHistory.where(_where.field).equals(_where.value).toArray()).length === 0) {
      const id = await db.txHistory.add({
        pendingTxId: _history.pendingTxId ?? 0,
        txId: _history.txId ?? '',
        txDate: _history.txDate ?? Date.now(),
        from: _history.from ?? { token: '', amount: '', decimal: '1' },
        to: _history.to ?? { token: '', amount: '', decimal: '1' },
        status: _history.status ?? Status.PENDING,
      })
      return id
    } else {
      await db.txHistory.where(_where.field).equals(_where.value).modify({ pendingTxId: _history.pendingTxId })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ txId: _history.txId })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ txDate: _history.txDate })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ from: _history.from })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ to: _history.to })
      await db.txHistory.where(_where.field).equals(_where.value).modify({ status: _history.status })

      const txHistory = await db.txHistory.where(_where.field).equals(_where.value).first()

      return txHistory?.id as number as IndexableType
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
