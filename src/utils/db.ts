import Dexie, { Table } from 'dexie'

export enum Status {
  PENDING,
  COMPLETED,
  CANCELED,
  REJECTED,
  REIMBURSE_AVAILABLE,
  REIMBURSED,
}

/*
  txOwner: signAddress,
  functionSelector: swapExactTokensForTokens,
  amountIn: `${amountIn}`,
  amountOut: `${amountOut}`,
  path,
  to: signAddress,
  nonce: txNonce,
  availableFrom,
  deadline,
*/

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

export interface PendingTx {
  id?: number
  sendDate: number
  round?: number
  order?: number
  tx?: TX
  mimcHash: string
  txHash: string
  proofHash?: string
  operatorSignature?: { r: string; s: string; v: number }
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
      pendingTxs: '++id, sendDate, txOwner, nonce, round, txHash',
      txHistory: '++id, txDate, round, txId, fromToken, toToken',
    })
  }
}

export const db = new MySubClassedDexie()
