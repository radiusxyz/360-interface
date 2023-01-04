// eslint-disable-next-line no-restricted-imports
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import ERC20_ABI from 'abis/erc20.json'
import { solidityKeccak256 } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { addPopup } from 'state/application/reducer'

import { db, Status, TokenAmount } from '../../utils/db'

const EventLogHashTransfer = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const EventLogHashSwap = '0xcbdaf2fdec4361aa4e9cafe49671d841695df07b12b53d1ce10464489a98dd49'

export async function CheckPendingTx({
  chainId,
  account,
  library,
  dispatch,
  router,
  recorder,
}: {
  chainId: number | undefined
  account: string | null | undefined
  library: Web3Provider | undefined
  dispatch: any
  router: Contract | null
  recorder: Contract | null
}) {
  const pendingTx = await db.pendingTxs.get({ progressHere: 1 }).catch((e) => console.log(e))
  const currentRound = parseInt((await recorder?.currentRound()).toString())

  // 1. round에 해당하는 txId 받아오기
  if (pendingTx && pendingTx.progressHere === 1) {
    const readyTx = await db.readyTxs.get(pendingTx.readyTxId)

    await fetch(
      `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${router?.address}&round=${pendingTx.round}`
    )
      .then((roundResponse) => {
        if (roundResponse.ok) {
          roundResponse.json().then(async (json) => {
            if (json?.txHash) {
              // 2. txId 실행되었는지 확인
              const txReceipt = await library?.getTransactionReceipt(json?.txHash)

              if (txReceipt) {
                const block = await library?.getBlock(txReceipt.blockNumber)
                const txTime = block?.timestamp as number
                const Logs = txReceipt?.logs as Array<{ address: string; topics: Array<any>; data: string }>

                let from: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                let to: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                let cnt = 0
                for (const log of Logs) {
                  if (log.topics[0] === EventLogHashSwap) {
                    cnt++
                  }
                  if (cnt === pendingTx.order && log.topics[0] === EventLogHashTransfer) {
                    const token = new Contract(log.address, ERC20_ABI, library)
                    const decimal = await token.decimals()
                    const tokenSymbol = await token.symbol()
                    if (
                      log.topics[1].substring(log.topics[1].length - 40).toLowerCase() ===
                      account?.substring(2).toLowerCase()
                    ) {
                      if (from.token === '')
                        from = {
                          token: tokenSymbol,
                          amount: hexToNumberString(log.data),
                          decimal: '1' + '0'.repeat(decimal),
                        }
                      else if (from.amount < hexToNumberString(log.data)) {
                        from = {
                          token: tokenSymbol,
                          amount: hexToNumberString(log.data),
                          decimal: '1' + '0'.repeat(decimal),
                        }
                      }
                    }
                    if (
                      log.topics[2].substring(log.topics[2].length - 40).toLowerCase() ===
                      account?.substring(2).toLowerCase()
                    ) {
                      to = {
                        token: tokenSymbol,
                        amount: hexToNumberString(log.data),
                        decimal: '1' + '0'.repeat(decimal),
                      }
                    }
                  }
                }

                if (pendingTx.order === -1) {
                  if (from.token !== '' && to.token !== '') {
                    db.txHistory
                      .add({
                        pendingTxId: pendingTx.id as number,
                        txId: json?.txHash,
                        txDate: txTime,
                        from,
                        to,
                        status: Status.COMPLETED,
                      })
                      .then(() => {
                        db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                        dispatch(
                          addPopup({
                            content: {
                              title: 'Success',
                              status: 'success',
                              data: { hash: json.txHash },
                            },
                            key: `success`,
                            removeAfterMs: 10000,
                          })
                        )
                      })
                  } else {
                    const isCanceled = await recorder?.useOfVeto(readyTx?.txHash, account)
                    if (isCanceled) {
                      if (currentRound === pendingTx.round) {
                        db.txHistory
                          .add({
                            pendingTxId: pendingTx.id as number,
                            txId: '',
                            txDate: 0,
                            from: readyTx?.from as TokenAmount,
                            to: readyTx?.to as TokenAmount,
                            status: Status.CANCELED,
                          })
                          .then(() => {
                            db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                            dispatch(
                              addPopup({
                                content: {
                                  title: 'Canceled',
                                  status: 'canceled',
                                  data: { hash: '' },
                                },
                                key: `canceled`,
                                removeAfterMs: 10000,
                              })
                            )
                          })
                      } else {
                        db.pendingTxs.update(pendingTx.id as number, { round: pendingTx.round++ })
                      }
                    } else {
                    }
                  }
                } else {
                  // 2.1 HashChain 검증
                  const txHashes = await recorder?.getRoundTxHashes(pendingTx.round)

                  let hashChain = txHashes[0]
                  for (let i = 1; i < pendingTx.order; i++) {
                    hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
                  }

                  // 2.2 Order 검증
                  const currentRound = await recorder?.currentRound()
                  if (
                    currentRound > pendingTx.round &&
                    txHashes[pendingTx.order] === readyTx?.txHash &&
                    ((pendingTx.order === 0 &&
                      pendingTx.proofHash === '0x0000000000000000000000000000000000000000000000000000000000000000') ||
                      hashChain === pendingTx.proofHash)
                  ) {
                    // 2.1.1 제대로 수행 되었다면 history에 넣음
                    if (from.token !== '' && to.token !== '') {
                      db.pendingTxs.get(pendingTx.id as number).then((pending) => {
                        if (pending?.progressHere === 1) {
                          db.txHistory
                            .add({
                              pendingTxId: pendingTx.id as number,
                              txId: json?.txHash,
                              txDate: txTime,
                              from,
                              to,
                              status: Status.COMPLETED,
                            })
                            .then(() => {
                              db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                              dispatch(
                                addPopup({
                                  content: {
                                    title: 'Success',
                                    status: 'success',
                                    data: { hash: json.txHash },
                                  },
                                  key: `success`,
                                  removeAfterMs: 10000,
                                })
                              )
                            })
                        }
                      })
                    } else {
                      db.pendingTxs.get(pendingTx.id as number).then((pending) => {
                        if (pending?.progressHere === 1) {
                          db.txHistory
                            .add({
                              pendingTxId: pendingTx.id as number,
                              txId: json?.txHash,
                              txDate: txTime,
                              from: readyTx?.from as TokenAmount,
                              to: readyTx?.to as TokenAmount,
                              status: Status.REJECTED,
                            })
                            .then(() => {
                              db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                              dispatch(
                                addPopup({
                                  content: {
                                    title: 'Rejected',
                                    status: 'rejected',
                                    data: { hash: json.txHash },
                                  },
                                  key: `rejected`,
                                  removeAfterMs: 10000,
                                })
                              )
                            })
                        }
                      })
                    }
                  } else {
                    // 2.1.2 문제가 있다면 claim 할 수 있도록 진행
                    db.pendingTxs.get(pendingTx.id as number).then((pending) => {
                      if (pending?.progressHere === 1) {
                        db.txHistory
                          .add({
                            pendingTxId: pendingTx.id as number,
                            txId: json?.txHash,
                            txDate: txTime,
                            from: readyTx?.from as TokenAmount,
                            to: readyTx?.to as TokenAmount,
                            status: Status.REIMBURSE_AVAILABLE,
                          })
                          .then(() => {
                            db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                            dispatch(
                              addPopup({
                                content: {
                                  title: 'Reimbursement available',
                                  status: 'reimbursement',
                                  data: { hash: json.txHash },
                                },
                                key: `reimbursement`,
                                removeAfterMs: 10000,
                              })
                            )
                          })
                      }
                    })
                  }
                }
              } else {
                // no receipt => pending
                db.txHistory
                  .add({
                    pendingTxId: pendingTx.id as number,
                    txId: json?.txHash,
                    txDate: 0,
                    from: readyTx?.from as TokenAmount,
                    to: readyTx?.to as TokenAmount,
                    status: Status.PENDING,
                  })
                  .then(() => {
                    dispatch(
                      addPopup({
                        content: {
                          title: 'Pending',
                          status: 'pending',
                          data: { hash: json.txHash },
                        },
                        key: `pending`,
                        removeAfterMs: 10000,
                      })
                    )
                  })
              }
            }
          })
        }
      })
      .catch((e) => console.error(e))
  }
}

function hexToNumberString(hex: string) {
  if (hex.substring(0, 2) !== '0x') hex = '0x' + hex
  return JSBI.BigInt(hex).toString()
}
