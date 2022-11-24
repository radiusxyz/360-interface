import Dexie, { Table } from 'dexie'

export interface PendingTx {
  id?: number
  round: number
  order: number
  mimcHash: string
  txHash: string
  proofHash: string
  signature: { r: string; s: string; v: number }
}

export interface TxHistory {
  id?: number
  round: number
  order: number
  txId: string
  fromToken: string
  toToken: string
  fromAmount: number
  toAmount: number
}

export class MySubClassedDexie extends Dexie {
  pendingTxs!: Table<PendingTx>
  txHistory!: Table<TxHistory>

  constructor() {
    super('ThreeSixty')
    this.version(1).stores({
      pendingTxs: '++id, round, order, txHash',
      txHistory: '++id, round, order, txId, fromToken, toToken',
    })
  }
}

export const db = new MySubClassedDexie()
