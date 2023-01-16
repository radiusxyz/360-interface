// eslint-disable-next-line no-restricted-imports
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import ERC20_ABI from 'abis/erc20.json'
import { solidityKeccak256 } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { addPopup, removePopup } from 'state/application/reducer'

import { db, Status, TokenAmount } from '../../utils/db'

const EventLogHashTransfer = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'.toLowerCase()
const EventLogHashSwap = '0xe920386ef80d415da4cce821f917787bc6593975dfb1e8a002d9cb619f9f608b'.toLowerCase()

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
  console.log('Check PendingTx')
  const _currentRound = parseInt((await recorder?.currentRound()).toString())
  const doneRound = _currentRound === 0 ? 0 : _currentRound - 1
  // const pendingTx = await db.pendingTxs.get({ progressHere: 1 }).catch((e) => console.log(e))

  const pendingTxs = await db.pendingTxs.where('progressHere').equals(1).toArray()

  // .then(async (pendingTxs) => {
  for (const pendingTx of pendingTxs) {
    // 1. round에 해당하는 txId 받아오기
    console.log(pendingTx)
    const readyTx = await db.readyTxs.get(pendingTx.readyTxId)

    const isSaved = await recorder?.isSaved(pendingTx.round)
    console.log('🚀 ~ file: watcher.ts:43 ~ //.then ~ isSaved', isSaved)

    if (isSaved) {
      console.log(
        `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${router?.address}&round=${pendingTx.round}`
      )
      await fetch(
        `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${router?.address}&round=${pendingTx.round}`
      )
        .then((roundResponse) => {
          if (roundResponse.ok) {
            console.log('response ok')
            roundResponse.json().then(async (json) => {
              if (json?.txHash) {
                console.log('has txHash', json, json?.txHash)
                // 2. txId 실행되었는지 확인
                const txReceipt = await library?.getTransactionReceipt(json?.txHash)

                if (txReceipt) {
                  console.log('has receipt', txReceipt)
                  console.log('readyTx', readyTx)
                  console.log('pendingTx', pendingTx)
                  const block = await library?.getBlock(txReceipt.blockNumber)
                  const txTime = block?.timestamp as number
                  const Logs = txReceipt?.logs as Array<{ address: string; topics: Array<any>; data: string }>

                  let from: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                  let to: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                  let fromTmp: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                  let toTmp: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                  let cnt = 0
                  let flag = false
                  const userWalletAddress = account?.substring(2).toLowerCase()

                  for (const log of Logs) {
                    if (
                      (cnt === pendingTx.order || pendingTx.order === -1) &&
                      log.topics[0].toLowerCase() === EventLogHashTransfer &&
                      (fromTmp.token === '' || toTmp.token === '')
                    ) {
                      if (log.topics[1].substring(log.topics[1].length - 40).toLowerCase() === userWalletAddress) {
                        const token = new Contract(log.address, ERC20_ABI, library)
                        const decimal = await token.decimals()
                        const tokenSymbol = await token.symbol()
                        fromTmp = {
                          token: tokenSymbol,
                          amount: hexToNumberString(log.data),
                          decimal: '1' + '0'.repeat(decimal),
                        }
                      }
                      if (log.topics[2].substring(log.topics[2].length - 40).toLowerCase() === userWalletAddress) {
                        const token = new Contract(log.address, ERC20_ABI, library)
                        const decimal = await token.decimals()
                        const tokenSymbol = await token.symbol()
                        toTmp = {
                          token: tokenSymbol,
                          amount: hexToNumberString(log.data),
                          decimal: '1' + '0'.repeat(decimal),
                        }
                      }
                    }

                    if (log.topics[0] === EventLogHashSwap) {
                      const dataList = splitBy64(log.data)

                      console.log('dataList', dataList)

                      if (
                        dataList?.length === 5 &&
                        dataList[2].substring(24).toLowerCase() === userWalletAddress &&
                        parseInt(dataList[3]) === readyTx?.tx.nonce
                      ) {
                        flag = true
                        from = fromTmp
                        to = toTmp
                      }
                      cnt++
                    }
                  }

                  if (pendingTx.order === -1) {
                    console.log('pending tx order === -1', pendingTx, from, to)
                    if (flag) {
                      // 내 nonce의 값을 찾았다.
                      if (from.token !== '' && to.token !== '') {
                        console.log('right tx on log and success', from, to)
                        db.pushTxHistory(
                          { field: 'pendingTxId', value: pendingTx.id as number },
                          {
                            pendingTxId: pendingTx.id as number,
                            txId: json?.txHash,
                            txDate: txTime,
                            from,
                            to,
                            status: Status.COMPLETED,
                          }
                        ).then(() => {
                          db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                          dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                          dispatch(
                            addPopup({
                              content: {
                                title: 'Success',
                                status: 'success',
                                data: { hash: json.txHash },
                              },
                              key: `${pendingTx.round}-${pendingTx.order}`,
                              removeAfterMs: 10000,
                            })
                          )
                        })
                      } else {
                        const isCanceled = await recorder?.useOfVeto(readyTx?.txHash, account)
                        if (isCanceled) {
                          await db
                            .pushTxHistory(
                              { field: 'pendingTxId', value: pendingTx.id as number },
                              {
                                pendingTxId: pendingTx.id as number,
                                txId: json?.txHash,
                                txDate: txTime,
                                from: readyTx?.from as TokenAmount,
                                to: readyTx?.to as TokenAmount,
                                status: Status.CANCELED,
                              }
                            )
                            .then(async () => {
                              await db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                              dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                              dispatch(
                                addPopup({
                                  content: {
                                    title: 'Canceled',
                                    status: 'canceled',
                                    data: { hash: '' },
                                  },
                                  key: `${pendingTx.round}-${pendingTx.order}`,
                                  removeAfterMs: 10000,
                                })
                              )
                            })
                        } else {
                          console.log('right tx on log and rejected', from, to)
                          db.pushTxHistory(
                            { field: 'pendingTxId', value: pendingTx.id as number },
                            {
                              pendingTxId: pendingTx.id as number,
                              txId: json?.txHash,
                              txDate: txTime,
                              status: Status.REJECTED,
                            }
                          ).then(() => {
                            db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                            dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                            dispatch(
                              addPopup({
                                content: {
                                  title: 'Rejected',
                                  status: 'rejected',
                                  data: { hash: json.txHash },
                                },
                                key: `${pendingTx.round}-${pendingTx.order}`,
                                removeAfterMs: 10000,
                              })
                            )
                          })
                        }
                      }
                    } else {
                      console.log('no tx on log')
                      const isCanceled = await recorder?.useOfVeto(readyTx?.txHash, account)
                      if (isCanceled) {
                        console.log('canceled')
                        if (doneRound === pendingTx.round) {
                          console.log('doneRound is round')
                          await db
                            .pushTxHistory(
                              { field: 'pendingTxId', value: pendingTx.id as number },
                              {
                                pendingTxId: pendingTx.id as number,
                                txId: json?.txHash,
                                txDate: txTime,
                                from: readyTx?.from as TokenAmount,
                                to: readyTx?.to as TokenAmount,
                                status: Status.CANCELED,
                              }
                            )
                            .then(async () => {
                              await db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                              dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                              dispatch(
                                addPopup({
                                  content: {
                                    title: 'Canceled',
                                    status: 'canceled',
                                    data: { hash: '' },
                                  },
                                  key: `${pendingTx.round}-${pendingTx.order}`,
                                  removeAfterMs: 10000,
                                })
                              )
                            })
                        } else {
                          await db.pendingTxs.update(pendingTx.id as number, { round: pendingTx.round + 1 })
                        }
                      } else {
                        console.log('proceed')
                        await db.pendingTxs.update(pendingTx.id as number, { round: pendingTx.round + 1 })
                      }
                    }
                  } else {
                    console.log('pending tx exist', pendingTx)
                    // 2.1 HashChain 검증
                    const txHashes = await recorder?.getRoundTxHashes(pendingTx.round)
                    console.log('txHashes', txHashes)

                    let hashChain = '0x0000000000000000000000000000000000000000000000000000000000000000'
                    for (let i = 0; i < pendingTx.order; i++) {
                      hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
                    }

                    // 2.2 Order 검증
                    console.log(
                      '2.2 Order verify',
                      txHashes,
                      pendingTx.order,
                      readyTx?.txHash,
                      hashChain,
                      pendingTx.proofHash
                    )
                    if (
                      txHashes.length > 0 && // doneRound >= pendingTx.round &&
                      txHashes[pendingTx.order] === readyTx?.txHash &&
                      hashChain === pendingTx.proofHash
                    ) {
                      console.log('everything is alright')
                      // 2.1.1 제대로 수행 되었다면 history에 넣음
                      console.log('from, to', from, to)
                      if (from.token !== '' && to.token !== '') {
                        db.pendingTxs.get(pendingTx.id as number).then((pending) => {
                          if (pending?.progressHere === 1) {
                            db.pushTxHistory(
                              { field: 'pendingTxId', value: pendingTx.id as number },
                              {
                                pendingTxId: pendingTx.id as number,
                                txId: json?.txHash,
                                txDate: txTime,
                                from,
                                to,
                                status: Status.COMPLETED,
                              }
                            ).then(() => {
                              db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                              dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                              dispatch(
                                addPopup({
                                  content: {
                                    title: 'Success',
                                    status: 'success',
                                    data: { hash: json.txHash },
                                  },
                                  key: `${pendingTx.round}-${pendingTx.order}`,
                                  removeAfterMs: 10000,
                                })
                              )
                            })
                          }
                        })
                      } else {
                        console.log('tx failed reject')
                        db.pendingTxs.get(pendingTx.id as number).then((pending) => {
                          if (pending?.progressHere === 1) {
                            db.pushTxHistory(
                              { field: 'pendingTxId', value: pendingTx.id as number },
                              {
                                pendingTxId: pendingTx.id as number,
                                txId: json?.txHash,
                                txDate: txTime,
                                from: readyTx?.from as TokenAmount,
                                to: readyTx?.to as TokenAmount,
                                status: Status.REJECTED,
                              }
                            ).then(() => {
                              db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                              dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                              dispatch(
                                addPopup({
                                  content: {
                                    title: 'Rejected',
                                    status: 'rejected',
                                    data: { hash: json.txHash },
                                  },
                                  key: `${pendingTx.round}-${pendingTx.order}`,
                                  removeAfterMs: 10000,
                                })
                              )
                            })
                          }
                        })
                      }
                    } else {
                      console.log('reimbursement')
                      // 2.1.2 문제가 있다면 claim 할 수 있도록 진행
                      db.pendingTxs.get(pendingTx.id as number).then((pending) => {
                        if (pending?.progressHere === 1) {
                          db.pushTxHistory(
                            { field: 'pendingTxId', value: pendingTx.id as number },
                            {
                              pendingTxId: pendingTx.id as number,
                              txId: json?.txHash,
                              txDate: txTime,
                              from: readyTx?.from as TokenAmount,
                              to: readyTx?.to as TokenAmount,
                              status: Status.REIMBURSE_AVAILABLE,
                            }
                          ).then(() => {
                            db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                            dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                            dispatch(
                              addPopup({
                                content: {
                                  title: 'Reimbursement available',
                                  status: 'reimbursement',
                                  data: { hash: json.txHash },
                                },
                                key: `${pendingTx.round}-${pendingTx.order}`,
                                removeAfterMs: 10000,
                              })
                            )
                          })
                        }
                      })
                    }
                  }
                } else {
                  console.log('pending')
                  // no receipt => pending
                  db.pushTxHistory(
                    { field: 'pendingTxId', value: pendingTx.id as number },
                    {
                      pendingTxId: pendingTx.id as number,
                      txId: json?.txHash,
                      txDate: 0,
                      from: readyTx?.from as TokenAmount,
                      to: readyTx?.to as TokenAmount,
                      status: Status.PENDING,
                    }
                  ).then(() => {
                    dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                    dispatch(
                      addPopup({
                        content: {
                          title: 'Pending',
                          status: 'pending',
                          data: { hash: json.txHash },
                        },
                        key: `${pendingTx.round}-${pendingTx.order}`,
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
}

function hexToNumberString(hex: string) {
  if (hex.substring(0, 2) !== '0x') hex = '0x' + hex
  return JSBI.BigInt(hex).toString()
}

function splitBy64(hex: string) {
  if (hex.substring(0, 2) === '0x') hex = hex.substring(2)
  return hex.match(new RegExp('.{1,64}', 'g'))
}

export async function watcher_test(
  recorder: Contract,
  library: Web3Provider,
  txId: string,
  account: string,
  given: { round: number; order: number; proofHash: string; txHash: string; nonce: number },
  doneRound: number
) {
  const txReceipt = await library?.getTransactionReceipt(txId)

  if (txReceipt) {
    console.log('has receipt', txReceipt)
    const Logs = txReceipt?.logs as Array<{ address: string; topics: Array<any>; data: string }>

    let from: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
    let to: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
    let fromTmp: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
    let toTmp: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
    let cnt = 0
    let flag = false
    const userWalletAddress = account?.substring(2).toLowerCase()

    for (const log of Logs) {
      if (
        (cnt === given.order || given.order === -1) &&
        log.topics[0].toLowerCase() === EventLogHashTransfer &&
        (fromTmp.token === '' || toTmp.token === '')
      ) {
        if (log.topics[1].substring(log.topics[1].length - 40).toLowerCase() === userWalletAddress) {
          const token = new Contract(log.address, ERC20_ABI, library)
          const decimal = await token.decimals()
          const tokenSymbol = await token.symbol()
          fromTmp = {
            token: tokenSymbol,
            amount: hexToNumberString(log.data),
            decimal: '1' + '0'.repeat(decimal),
          }
        }
        if (log.topics[2].substring(log.topics[2].length - 40).toLowerCase() === userWalletAddress) {
          const token = new Contract(log.address, ERC20_ABI, library)
          const decimal = await token.decimals()
          const tokenSymbol = await token.symbol()
          toTmp = {
            token: tokenSymbol,
            amount: hexToNumberString(log.data),
            decimal: '1' + '0'.repeat(decimal),
          }
        }
      }

      if (log.topics[0] === EventLogHashSwap) {
        const dataList = splitBy64(log.data)

        console.log('dataList', dataList)

        if (
          dataList?.length === 5 &&
          dataList[2].substring(24).toLowerCase() === userWalletAddress &&
          parseInt(dataList[3]) === given.nonce
        ) {
          flag = true
          from = fromTmp
          to = toTmp
        }
        cnt++
      }
    }

    if (given.order === -1) {
      console.log('pending tx order === -1', given, from, to)
      if (flag) {
        // 내 nonce의 값을 찾았다.
        if (from.token !== '' && to.token !== '') {
          console.log('right tx on log and success', from, to)
          console.log('success')
        } else {
          const isCanceled = await recorder?.useOfVeto(given.txHash, account)
          if (isCanceled) {
            console.log('canceled1')
          } else {
            console.log('right tx on log and rejected', from, to)
            console.log('rejected')
          }
        }
      } else {
        console.log('no tx on log')
        const isCanceled = await recorder?.useOfVeto(given.txHash, account)
        if (isCanceled) {
          console.log('canceled2')
          if (doneRound === given.round) {
            console.log('doneRound is round')
            console.log('canceled3')
          } else {
            console.log('round++1')
          }
        } else {
          console.log('proceed')
          console.log('round++2')
        }
      }
    } else {
      console.log('pending tx exist', given)
      // 2.1 HashChain 검증
      const txHashes = await recorder?.getRoundTxHashes(given.round)
      console.log('txHashes', txHashes)

      let hashChain = '0x0000000000000000000000000000000000000000000000000000000000000000'
      for (let i = 0; i < given.order; i++) {
        hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
      }

      // 2.2 Order 검증
      console.log('2.2 Order verify', txHashes, given.order, given.txHash, hashChain, given.proofHash)
      if (
        txHashes.length > 0 && // doneRound >= pendingTx.round &&
        txHashes[given.order] === given.txHash &&
        hashChain === given.proofHash
      ) {
        console.log('everything is alright')
        // 2.1.1 제대로 수행 되었다면 history에 넣음
        console.log('from, to', from, to)
        if (from.token !== '' && to.token !== '') {
          console.log('success2')
        } else {
          console.log('tx failed reject')
          console.log('rejected2')
        }
      } else {
        console.log('reimbursement')
        // 2.1.2 문제가 있다면 claim 할 수 있도록 진행
      }
    }
  }
}
