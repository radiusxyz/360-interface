import Dexie, { Table } from 'dexie'

export enum Status {
  PENDING,
  COMPLETED,
  CANCELED,
  REJECTED,
  REIMBURSE_AVAILABLE,
  REIMBURSED,
}

export interface PendingTx {
  id?: number
  sendDate: number
  round: number
  order: number
  tx: string
  mimcHash: string
  txHash: string
  proofHash: string
  operatorSignature: { r: string; s: string; v: number }
}

export interface TokenAmount {
  token: string
  amount: string
}

export interface TxHistory {
  id?: number
  round: number
  order: number
  txId: string
  txDate: number
  from: TokenAmount
  to: TokenAmount
  status: Status
}

export class MySubClassedDexie extends Dexie {
  pendingTxs!: Table<PendingTx>
  txHistory!: Table<TxHistory>

  constructor() {
    super('ThreeSixty')
    this.version(1).stores({
      pendingTxs: '++id, sendDate, round, txHash',
      txHistory: '++id, txDate, round, txId, fromToken, toToken',
    })
  }
}

export const db = new MySubClassedDexie()
