// eslint-disable-next-line no-restricted-imports
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import ERC20_ABI from 'abis/erc20.json'
import { solidityKeccak256 } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { addPopup, removePopup } from 'state/application/reducer'

import { db, Status, TokenAmount } from '../../utils/db'

const UnknownOrder = -1
const EventLogHashTransfer = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'.toLowerCase()
const EventLogHashSwap = '0xe920386ef80d415da4cce821f917787bc6593975dfb1e8a002d9cb619f9f608b'.toLowerCase()

const responseList: any = {}

async function getTxId(
  recorder: Contract | null,
  chainId: number | undefined,
  routerAddress: string | undefined,
  round: number
) {
  if (`${routerAddress}-${round}` in responseList) {
    return responseList[`${routerAddress}-${round}`]
  } else {
    const isSaved = await recorder?.isSaved(round)
    const currentRound = await recorder?.currentRound()
    //console.log(`isSaved(${round}) ${isSaved}, currentRound: ${currentRound}`)

    if (isSaved || currentRound > round) {
      await fetch(
        `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${routerAddress}&round=${round}`
      ).then((roundResponse) => {
        if (roundResponse.ok) {
          roundResponse.json().then(async (json) => {
            if (json?.txHash) {
              responseList[`${routerAddress}-${round}`] = json?.txHash
              return responseList[`${routerAddress}-${round}`]
            }
          })
        }
      })
    }
  }
  return null
}

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
  const pendingTxs = await db.pendingTxs.where('progressHere').equals(1).toArray()

  for (const pendingTx of pendingTxs) {
    // 1. round에 해당하는 txId 받아오기
    const readyTx = await db.readyTxs.get(pendingTx.readyTxId)

    //console.log('get', pendingTx.round, pendingTx)
    const txHash = await getTxId(recorder, chainId, router?.address, pendingTx.round)
    if (txHash === null) continue

    //console.log('has txHash', txHash)
    // 2. txId 실행되었는지 확인
    const txReceipt = await library?.getTransactionReceipt(txHash)

    if (txReceipt) {
      //console.log('has receipt', txReceipt)

      const block = await library?.getBlock(txReceipt.blockNumber)
      const txTime = block?.timestamp as number

      const Logs = txReceipt?.logs as Array<{ address: string; topics: Array<any>; data: string }>
      let currentOrderLogs = []
      let currentOrder = 0
      let round = 0
      let order = 0
      let address = '0'
      let nonce = 0
      let success = false
      let from: TokenAmount | undefined = undefined
      let to: TokenAmount | undefined = undefined
      if (pendingTx.order === UnknownOrder) {
        // 라운드에 해당하는 오더를 모르고 있을때
        for (const log of Logs) {
          currentOrderLogs.push(log)
          // order 0
          if (log.topics[0].toLowerCase() === EventLogHashSwap) {
            const dataList: any = splitBy64(log.data)
            round = BigNumber.from(`0x${dataList[0]}`).toNumber()
            order = BigNumber.from(`0x${dataList[1]}`).toNumber()
            address = BigNumber.from(`0x${dataList[2]}`).toHexString()
            nonce = BigNumber.from(`0x${dataList[3]}`).toNumber()
            success = Number(dataList[4]) === 1
            // 확실한건 nonce / walletAddress / txHash
            // 불확실한건 round / order / proofHash / txId는 불확
            // TODO: pendingTx.round === round 왜 있는지 모르겠습니다. operator가 틀린 round를 주는 경우를 고려해봐야 할까 싶습니다.
            if (pendingTx.round === round && address.toLowerCase() === readyTx?.tx.txOwner.toLowerCase()) {
              if (readyTx?.tx.nonce === nonce) {
                if (success === true) {
                  for (const currentLog of currentOrderLogs) {
                    // 2 , 24
                    if (currentLog.topics[0].toLowerCase() === EventLogHashTransfer && from === null) {
                      const token = new Contract(currentLog.address, ERC20_ABI, library)
                      const decimal = await token.decimals()
                      const tokenSymbol = await token.symbol()
                      from = {
                        token: tokenSymbol,
                        amount: hexToNumberString(currentLog.data),
                        decimal: '1' + '0'.repeat(decimal),
                      }
                    } else if (currentLog.topics[0].toLowerCase() === EventLogHashTransfer && to === null) {
                      const token = new Contract(currentLog.address, ERC20_ABI, library)
                      const decimal = await token.decimals()
                      const tokenSymbol = await token.symbol()
                      to = {
                        token: tokenSymbol,
                        amount: hexToNumberString(currentLog.data),
                        decimal: '1' + '0'.repeat(decimal),
                      }
                      break
                    }
                  }
                  //console.log('Success', from, to)
                  db.pushTxHistory(
                    { field: 'pendingTxId', value: pendingTx.id as number },
                    {
                      pendingTxId: pendingTx.id as number,
                      txId: txHash,
                      txDate: txTime,
                      from,
                      to,
                      status: Status.COMPLETED,
                    }
                  ).then(() => {
                    db.pendingTxs.update(pendingTx.id as number, {
                      progressHere: 0,
                      round,
                      order,
                    })

                    //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
                    dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                    //console.log(`popup add ${round}-${order}`)
                    dispatch(
                      addPopup({
                        content: {
                          title: 'Success',
                          status: 'success',
                          data: { hash: txHash },
                        },
                        key: `${round}-${order}`,
                        removeAfterMs: 31536000,
                      })
                    )
                  })
                  continue
                } else {
                  const isCanceled = await recorder?.useOfVeto(readyTx.txHash, readyTx.tx.txOwner)
                  if (isCanceled === true) {
                    //console.log('Canceled')
                    await db
                      .pushTxHistory(
                        { field: 'pendingTxId', value: pendingTx.id as number },
                        {
                          pendingTxId: pendingTx.id as number,
                          txId: txHash,
                          txDate: txTime,
                          from: readyTx?.from as TokenAmount,
                          to: readyTx?.to as TokenAmount,
                          status: Status.CANCELED,
                        }
                      )
                      .then(async () => {
                        await db.pendingTxs.update(pendingTx.id as number, {
                          progressHere: 0,
                          round,
                          order,
                        })
                        //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
                        dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                        //console.log(`popup add ${round}-${order}`)
                        dispatch(
                          addPopup({
                            content: {
                              title: 'Canceled',
                              status: 'canceled',
                              data: { hash: txHash },
                            },
                            key: `${round}-${order}`,
                            removeAfterMs: 31536000,
                          })
                        )
                      })
                    continue
                  } else {
                    //console.log('Rejected')
                    db.pushTxHistory(
                      { field: 'pendingTxId', value: pendingTx.id as number },
                      {
                        pendingTxId: pendingTx.id as number,
                        txId: txHash,
                        txDate: txTime,
                        status: Status.REJECTED,
                      }
                    ).then(() => {
                      db.pendingTxs.update(pendingTx.id as number, { progressHere: 0, round, order })

                      //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
                      dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                      //console.log(`popup add ${round}-${order}`)
                      dispatch(
                        addPopup({
                          content: {
                            title: 'Rejected',
                            status: 'rejected',
                            data: { hash: txHash },
                          },
                          key: `${round}-${order}`,
                          removeAfterMs: 31536000,
                        })
                      )
                    })
                    continue
                  }
                }
              } else if (readyTx.tx.nonce < nonce) {
                //console.log(`Nonce already passed (expected: ${readyTx.tx.nonce} / real: ${nonce})`)
                await db.pendingTxs.update(pendingTx.id as number, { round: 0 })
                throw Error(`Error: re scan from first`)
              }
            }
            currentOrderLogs = []
          }
        }

        const currentRound = await recorder?.currentRound()
        //console.log(`currentRound: ${currentRound} ${pendingTx.round}`)
        // doneRound까지 봤으면
        if (parseInt(currentRound) === pendingTx.round + 1) {
          const isCanceled = await recorder?.useOfVeto(readyTx?.txHash, readyTx?.tx.txOwner)
          if (isCanceled === true) {
            //console.log('Canceled')
            await db
              .pushTxHistory(
                { field: 'pendingTxId', value: pendingTx.id as number },
                {
                  pendingTxId: pendingTx.id as number,
                  txId: txHash,
                  txDate: txTime,
                  from: readyTx?.from as TokenAmount,
                  to: readyTx?.to as TokenAmount,
                  status: Status.CANCELED,
                }
              )
              .then(async () => {
                await db.pendingTxs.update(pendingTx.id as number, {
                  progressHere: 0,
                  round: pendingTx.round,
                  order: pendingTx.order,
                })
                //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
                dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                //console.log(`popup add ${pendingTx.round}-${pendingTx.order}`)
                dispatch(
                  addPopup({
                    content: {
                      title: 'Canceled',
                      status: 'canceled',
                      data: { hash: txHash },
                    },
                    key: `${pendingTx.round}-${pendingTx.order}`,
                    removeAfterMs: 31536000,
                  })
                )
              })
          }
          continue
        }
        //console.log(`check next round: ${pendingTx.round + 1}`)
        //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
        dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
        //console.log(`popup add ${pendingTx.round}-${pendingTx.order}`)
        dispatch(
          addPopup({
            content: {
              title: 'Transaction pending',
              status: 'pending',
              data: { readyTxId: readyTx?.id },
            },
            key: `${pendingTx.round + 1}-${pendingTx.order}`,
            removeAfterMs: 31536000,
          })
        )
        db.pendingTxs.update(pendingTx.id as number, { round: pendingTx.round + 1 })

        continue
      } else {
        // 라운드에 해당하는 오더를 알고 있을때
        for (const log of Logs) {
          currentOrderLogs.push(log)
          if (log.topics[0].toLowerCase() === EventLogHashSwap) {
            if (currentOrder === pendingTx.order) {
              const dataList: any = splitBy64(log.data)
              round = BigNumber.from(`0x${dataList[0]}`).toNumber()
              if (pendingTx.round !== round) {
                //console.log('Invalid round')
                break
              }
              order = BigNumber.from(`0x${dataList[1]}`).toNumber()
              address = BigNumber.from(`0x${dataList[2]}`).toHexString()
              nonce = BigNumber.from(`0x${dataList[3]}`).toNumber()
              success = Number(dataList[4]) === 1
              break
            }
            currentOrderLogs = []
            currentOrder++
          }
        }
        const txHashes = await recorder?.getRoundTxHashes(pendingTx.round)
        //console.log('txHashes', txHashes)

        let hashChain = '0x0000000000000000000000000000000000000000000000000000000000000000'
        if (pendingTx.order + 1 <= txHashes.length) {
          for (let i = 0; i < pendingTx.order; i++) {
            hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
          }
        } else {
          hashChain = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
        }

        if (
          pendingTx.order === order &&
          address.toLowerCase() === readyTx?.tx.txOwner.toLowerCase() &&
          pendingTx.proofHash === hashChain &&
          readyTx.tx.nonce === nonce
        ) {
          // 스왑이 성공시
          if (success === true) {
            //console.log('Success', from, to)
            for (const log of currentOrderLogs) {
              if (log.topics[0].toLowerCase() === EventLogHashTransfer && from === null) {
                const token = new Contract(log.address, ERC20_ABI, library)
                const decimal = await token.decimals()
                const tokenSymbol = await token.symbol()
                from = {
                  token: tokenSymbol,
                  amount: hexToNumberString(log.data),
                  decimal: '1' + '0'.repeat(decimal),
                }
              } else if (log.topics[0].toLowerCase() === EventLogHashTransfer && to === null) {
                const token = new Contract(log.address, ERC20_ABI, library)
                const decimal = await token.decimals()
                const tokenSymbol = await token.symbol()
                to = {
                  token: tokenSymbol,
                  amount: hexToNumberString(log.data),
                  decimal: '1' + '0'.repeat(decimal),
                }
                break
              }
            }
            db.pushTxHistory(
              { field: 'pendingTxId', value: pendingTx.id as number },
              {
                pendingTxId: pendingTx.id as number,
                txId: txHash,
                txDate: txTime,
                from,
                to,
                status: Status.COMPLETED,
              }
            ).then(() => {
              db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })

              //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
              dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
              //console.log(`popup add ${pendingTx.round}-${pendingTx.order}`)
              dispatch(
                addPopup({
                  content: {
                    title: 'Success',
                    status: 'success',
                    data: { hash: txHash },
                  },
                  key: `${pendingTx.round}-${pendingTx.order}`,
                  removeAfterMs: 31536000,
                })
              )
            })

            continue
          } else {
            const isCanceled = await recorder?.useOfVeto(readyTx.txHash, readyTx.tx.txOwner)
            if (isCanceled === true) {
              //console.log('Canceled')
              await db
                .pushTxHistory(
                  { field: 'pendingTxId', value: pendingTx.id as number },
                  {
                    pendingTxId: pendingTx.id as number,
                    txId: txHash,
                    txDate: txTime,
                    from: readyTx?.from as TokenAmount,
                    to: readyTx?.to as TokenAmount,
                    status: Status.CANCELED,
                  }
                )
                .then(async () => {
                  await db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                  //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
                  dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                  //console.log(`popup add ${pendingTx.round}-${pendingTx.order}`)
                  dispatch(
                    addPopup({
                      content: {
                        title: 'Canceled',
                        status: 'canceled',
                        data: { hash: txHash },
                      },
                      key: `${pendingTx.round}-${pendingTx.order}`,
                      removeAfterMs: 31536000,
                    })
                  )
                })

              continue
            } else {
              //console.log('Rejected')
              db.pushTxHistory(
                { field: 'pendingTxId', value: pendingTx.id as number },
                {
                  pendingTxId: pendingTx.id as number,
                  txId: txHash,
                  txDate: txTime,
                  status: Status.REJECTED,
                }
              ).then(() => {
                db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
                dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
                //console.log(`popup add ${pendingTx.round}-${pendingTx.order}`)
                dispatch(
                  addPopup({
                    content: {
                      title: 'Rejected',
                      status: 'rejected',
                      data: { hash: txHash },
                    },
                    key: `${pendingTx.round}-${pendingTx.order}`,
                    removeAfterMs: 31536000,
                  })
                )
              })

              continue
            }
          }
        } else {
          //console.log('reimbursement')
          db.pushTxHistory(
            { field: 'pendingTxId', value: pendingTx.id as number },
            {
              pendingTxId: pendingTx.id as number,
              txId: txHash,
              txDate: txTime,
              from: readyTx?.from as TokenAmount,
              to: readyTx?.to as TokenAmount,
              status: Status.REIMBURSE_AVAILABLE,
            }
          ).then((txHistoryId) => {
            db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
            //console.log(`popup remove ${pendingTx.round}-${pendingTx.order}`)
            dispatch(removePopup({ key: `${pendingTx.round}-${pendingTx.order}` }))
            //console.log(`popup add ${pendingTx.round}-${pendingTx.order}`)
            dispatch(
              addPopup({
                content: {
                  title: 'Reimbursement available',
                  status: 'reimbursement',
                  data: { hash: txHash, txHistoryId: parseInt(txHistoryId.toString()) },
                },
                key: `${pendingTx.round}-${pendingTx.order}`,
                removeAfterMs: 31536000,
              })
            )
          })

          //console.log(
          //  `expected: walletAddress: ${readyTx?.tx.txOwner} / round - ${pendingTx.round} / order - ${pendingTx.order} / nonce - ${readyTx?.tx.nonce}`
          //)
          //console.log(`real: address: ${address} / round - ${round} / order - ${order} / nonce - ${nonce}`)
          continue
        }
      }
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
    //console.log('has receipt', txReceipt)
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

        //console.log('dataList', dataList)

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
      //console.log('pending tx order === -1', given, from, to)
      if (flag) {
        // 내 nonce의 값을 찾았다.
        if (from.token !== '' && to.token !== '') {
          //console.log('right tx on log and success', from, to)
          //console.log('success')
        } else {
          const isCanceled = await recorder?.useOfVeto(given.txHash, account)
          if (isCanceled) {
            //console.log('canceled1')
          } else {
            //console.log('right tx on log and rejected', from, to)
            //console.log('rejected')
          }
        }
      } else {
        //console.log('no tx on log')
        const isCanceled = await recorder?.useOfVeto(given.txHash, account)
        if (isCanceled) {
          //console.log('canceled2')
          if (doneRound === given.round) {
            //console.log('doneRound is round')
            //console.log('canceled3')
          } else {
            //console.log('round++1')
          }
        } else {
          //console.log('proceed')
          //console.log('round++2')
        }
      }
    } else {
      //console.log('pending tx exist', given)
      // 2.1 HashChain 검증
      const txHashes = await recorder?.getRoundTxHashes(given.round)
      //console.log('txHashes', txHashes)

      let hashChain = '0x0000000000000000000000000000000000000000000000000000000000000000'
      for (let i = 0; i < given.order; i++) {
        hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
      }

      // 2.2 Order 검증
      //console.log('2.2 Order verify', txHashes, given.order, given.txHash, hashChain, given.proofHash)
      if (
        txHashes.length > 0 && // doneRound >= pendingTx.round &&
        txHashes[given.order] === given.txHash &&
        hashChain === given.proofHash
      ) {
        //console.log('everything is alright')
        // 2.1.1 제대로 수행 되었다면 history에 넣음
        //console.log('from, to', from, to)
        if (from.token !== '' && to.token !== '') {
          //console.log('success2')
        } else {
          //console.log('tx failed reject')
          //console.log('rejected2')
        }
      } else {
        //console.log('reimbursement')
        // 2.1.2 문제가 있다면 claim 할 수 있도록 진행
      }
    }
  }
}

export async function watcher_test2(
  recorder: Contract,
  library: Web3Provider,
  txId: string,
  walletAddress: string,
  given: { round: number; order: number; proofHash: string; txHash: string; nonce: number }, // 서버가 응답함? // 응답안할수 있고
  doneRound: number
) {
  // 확실한건 nonce / walletAddress / txHash
  // 불확실한건 round / order / proofHash / txId는 불확
  //
  // 스캔은 -> 14 -> 16
  // round = 라운드가 정확하지 않을수 있다. -> 보낸시점의 currentRound부터 current라운드까지 확인함
  // order가 -1인경우
  //
  // given: order: -1 == 자신의 order를 모름 -> proofHash x /  /
  // txHash & nonce o
  // order: -1 / 자신의 오더
  // proofHash
  // given: order: !-1: 자신의 순서를 알수 있음
  // txId: - 무조건 알수 있음 - batchTxId를 이야깋
  // account: - 지갑주소 (자신의)
  // doneRound: - 트랜잭션을 전송 했을때의 currentRound? 조회했을때의 currentRound - 1 // 스캔하는 시점부터 doneRound까지 다봤는지를 확인하기 위함 (현재 까ㅑ지 완료된 라운드)
  // 1. order는 알고 있을때
  // 2. order는 모르고 있을때
  const txReceipt = await library?.getTransactionReceipt(txId)
  if (txReceipt) {
    //console.log('has receipt', txReceipt)
    const Logs = txReceipt?.logs as Array<{ address: string; topics: Array<any>; data: string }>
    // let from: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
    // let to: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
    // let flag = false
    let currentOrderLogs = []
    let currentOrder = 0
    let round = 0
    let order = 0
    let address = '0'
    let nonce = 0
    let success = false
    let from: TokenAmount | null = null
    let to: TokenAmount | null = null
    if (given.order === UnknownOrder) {
      // 라운드에 해당하는 오더를 모르고 있을때
      for (const log of Logs) {
        currentOrderLogs.push(log)
        // order 0
        if (log.topics[0].toLowerCase() === EventLogHashSwap) {
          const dataList: any = splitBy64(log.data)
          round = BigNumber.from(`0x${dataList[0]}`).toNumber()
          order = BigNumber.from(`0x${dataList[1]}`).toNumber()
          address = BigNumber.from(`0x${dataList[2]}`).toHexString()
          nonce = BigNumber.from(`0x${dataList[3]}`).toNumber()
          success = Number(dataList[4]) === 1
          // 확실한건 nonce / walletAddress / txHash
          // 불확실한건 round / order / proofHash / txId는 불확
          if (given.round === round && address.toLowerCase() === walletAddress.toLowerCase()) {
            if (given.nonce === nonce) {
              if (success === true) {
                for (const currentLog of currentOrderLogs) {
                  // 2 , 24
                  if (currentLog.topics[0].toLowerCase() === EventLogHashTransfer && from === null) {
                    const token = new Contract(currentLog.address, ERC20_ABI, library)
                    const decimal = await token.decimals()
                    const tokenSymbol = await token.symbol()
                    from = {
                      token: tokenSymbol,
                      amount: hexToNumberString(currentLog.data),
                      decimal: '1' + '0'.repeat(decimal),
                    }
                  } else if (currentLog.topics[0].toLowerCase() === EventLogHashTransfer && to === null) {
                    const token = new Contract(currentLog.address, ERC20_ABI, library)
                    const decimal = await token.decimals()
                    const tokenSymbol = await token.symbol()
                    to = {
                      token: tokenSymbol,
                      amount: hexToNumberString(currentLog.data),
                      decimal: '1' + '0'.repeat(decimal),
                    }
                    break
                  }
                }
                //console.log('Success', from, to)
                return
              } else {
                const isCanceled = await recorder?.useOfVeto(given.txHash, walletAddress)
                if (isCanceled === true) {
                  //console.log('Canceled')
                  return
                } else {
                  //console.log('Rejected')
                  return
                }
              }
            } else if (given.nonce < nonce) {
              //console.log(`Nonce already passed (expected: ${given.nonce} / real: ${nonce})`)
              return
            }
          }
          currentOrderLogs = []
        }
      }
      if (given.round >= doneRound) {
        //console.log('Done check round - pending')
        return
      } else {
        //console.log(`Have to request - round check: ${given.round + 1}`)
        return
      }
    } else {
      // 라운드에 해당하는 오더를 알고 있을때
      for (const log of Logs) {
        currentOrderLogs.push(log)
        if (log.topics[0].toLowerCase() === EventLogHashSwap) {
          if (currentOrder === given.order) {
            const dataList: any = splitBy64(log.data)
            round = BigNumber.from(`0x${dataList[0]}`).toNumber()
            if (given.round !== round) {
              //console.log('Invalid round')
              return
            }
            order = BigNumber.from(`0x${dataList[1]}`).toNumber()
            address = BigNumber.from(`0x${dataList[2]}`).toHexString()
            nonce = BigNumber.from(`0x${dataList[3]}`).toNumber()
            success = Number(dataList[4]) === 1
            break
          }
          currentOrderLogs = []
          currentOrder++
        }
      }
      const txHashes = await recorder?.getRoundTxHashes(given.round)
      //console.log('txHashes', txHashes)

      let hashChain = '0x0000000000000000000000000000000000000000000000000000000000000000'
      for (let i = 0; i < given.order; i++) {
        hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
      }

      if (
        given.order === order &&
        address.toLowerCase() === walletAddress.toLowerCase() &&
        given.proofHash === hashChain &&
        given.nonce === nonce
      ) {
        // 스왑이 성공시
        if (success === true) {
          for (const log of currentOrderLogs) {
            if (log.topics[0].toLowerCase() === EventLogHashTransfer && from === null) {
              const token = new Contract(log.address, ERC20_ABI, library)
              const decimal = await token.decimals()
              const tokenSymbol = await token.symbol()
              from = {
                token: tokenSymbol,
                amount: hexToNumberString(log.data),
                decimal: '1' + '0'.repeat(decimal),
              }
            } else if (log.topics[0].toLowerCase() === EventLogHashTransfer && to === null) {
              const token = new Contract(log.address, ERC20_ABI, library)
              const decimal = await token.decimals()
              const tokenSymbol = await token.symbol()
              to = {
                token: tokenSymbol,
                amount: hexToNumberString(log.data),
                decimal: '1' + '0'.repeat(decimal),
              }
              break
            }
          }
          //console.log('Success', from, to)
          return
        } else {
          const isCanceled = await recorder?.useOfVeto(given.txHash, walletAddress)
          if (isCanceled === true) {
            //console.log('Canceled')
            return
          } else {
            //console.log('Rejected')
            return
          }
        }
      } else {
        //console.log('reimbursement')
        //console.log(
        //   `expected: walletAddress: ${walletAddress} / round - ${given.round} / order - ${given.order} / nonce - ${given.nonce}`
        // )
        //console.log(`real: address: ${address} / round - ${round} / order - ${order} / nonce - ${nonce}`)
        return
      }
    }
  }
}
