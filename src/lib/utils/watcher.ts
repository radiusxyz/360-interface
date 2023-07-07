// eslint-disable-next-line no-restricted-imports
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Web3Provider } from '@ethersproject/providers'
import ERC20_ABI from '../../abis/erc20.json'
import { solidityKeccak256 } from 'ethers/lib/utils'
import JSBI from 'jsbi'

import { db, Status, TokenAmount } from 'utils/db'

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
    console.log(`isSaved(${round}) ${isSaved}, currentRound: ${currentRound}`)

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
  library,
  router,
  recorder,
}: {
  chainId: number | undefined
  library: Web3Provider | undefined
  router: Contract | null
  recorder: Contract | null
}) {
  const swapCnt = await db.swap.count()

  if (swapCnt === 0) return

  const swapTxs = await db.swap.where({ status: Status.PENDING }).toArray()

  for (const swapTx of swapTxs) {
    // 1. round에 해당하는 txId 받아오기
    console.log('get', swapTx.round, swapTx)
    if (swapTx.round) {
      const txHash = await getTxId(recorder, chainId, router?.address, swapTx.round)
      if (txHash === null) continue

      console.log('has txHash', txHash)
      // 2. txId 실행되었는지 확인
      const txReceipt = await library?.getTransactionReceipt(txHash)

      if (txReceipt) {
        console.log('has receipt', txReceipt)

        const block = await library?.getBlock(txReceipt.blockNumber)
        const txTime = block?.timestamp as number

        const Logs = txReceipt?.logs as Array<{ address: string; topics: Array<any>; data: string }>
        let currentOrderLogs: any = []
        let currentOrder = 0
        let round = 0
        let order = 0
        let address = '0'
        let nonce = 0
        let success = false
        let fromResult: TokenAmount | undefined = undefined
        let toResult: TokenAmount | undefined = undefined
        if (swapTx.order === UnknownOrder) {
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
              if (swapTx.round === round && address.toLowerCase() === swapTx?.tx?.txOwner.toLowerCase()) {
                if (swapTx?.tx.nonce === nonce) {
                  if (success === true) {
                    for (const currentLog of currentOrderLogs) {
                      // 2 , 24
                      if (currentLog.topics[0].toLowerCase() === EventLogHashTransfer && fromResult === null) {
                        const token = new Contract(currentLog.address, ERC20_ABI, library)
                        const decimal = await token.decimals()
                        const tokenSymbol = await token.symbol()
                        fromResult = {
                          token: tokenSymbol,
                          amount: hexToNumberString(currentLog.data),
                          decimal: '1' + '0'.repeat(decimal),
                        }
                      } else if (currentLog.topics[0].toLowerCase() === EventLogHashTransfer && toResult === null) {
                        const token = new Contract(currentLog.address, ERC20_ABI, library)
                        const decimal = await token.decimals()
                        const tokenSymbol = await token.symbol()
                        toResult = {
                          token: tokenSymbol,
                          amount: hexToNumberString(currentLog.data),
                          decimal: '1' + '0'.repeat(decimal),
                        }
                        break
                      }
                    }
                    console.log('Success', fromResult, toResult)
                    await db.updateSwap(
                      { field: 'id', value: swapTx.id as number },
                      {
                        txId: txHash,
                        txDate: txTime,
                        fromResult,
                        toResult,
                        round,
                        order,
                        status: Status.COMPLETED,
                      }
                    )
                    continue
                  } else {
                    const isCanceled = await recorder?.useOfVeto(swapTx.txHash, swapTx.tx.txOwner)
                    if (isCanceled === true) {
                      console.log('Canceled')
                      await db.updateSwap(
                        { field: 'id', value: swapTx.id as number },
                        {
                          txId: txHash,
                          txDate: txTime,
                          round,
                          order,
                          status: Status.CANCELED,
                        }
                      )
                      continue
                    } else {
                      console.log('Rejected')
                      await db.updateSwap(
                        { field: 'id', value: swapTx.id as number },
                        {
                          txId: txHash,
                          txDate: txTime,
                          round,
                          order,
                          status: Status.REJECTED,
                        }
                      )
                      continue
                    }
                  }
                } else if (swapTx.tx.nonce < nonce) {
                  console.log(`Nonce already passed (expected: ${swapTx.tx.nonce} / real: ${nonce})`)
                  await db.updateSwap({ field: 'id', value: swapTx.id as number }, { round: 0 })
                  throw Error(`Error: re scan from first`)
                }
              }
              currentOrderLogs = []
            }
          }

          const currentRound = await recorder?.currentRound()
          console.log(`currentRound: ${currentRound} ${swapTx.round}`)
          // doneRound까지 봤으면
          if (parseInt(currentRound) === swapTx.round + 1) {
            const isCanceled = await recorder?.useOfVeto(swapTx?.txHash, swapTx?.tx?.txOwner)
            if (isCanceled === true) {
              console.log('Canceled')
              await db.updateSwap(
                { field: 'id', value: swapTx.id as number },
                {
                  txId: txHash,
                  txDate: txTime,
                  status: Status.CANCELED,
                  round: swapTx.round,
                  order: swapTx.order,
                }
              )
            }
            continue
          }
          console.log(`check next round: ${swapTx.round + 1}`)
          await db.updateSwap({ field: 'id', value: swapTx.id as number }, { round: swapTx.round + 1 })

          continue
        } else {
          // 라운드에 해당하는 오더를 알고 있을때
          for (const log of Logs) {
            currentOrderLogs.push(log)
            if (log.topics[0].toLowerCase() === EventLogHashSwap) {
              if (currentOrder === swapTx.order) {
                const dataList: any = splitBy64(log.data)
                round = BigNumber.from(`0x${dataList[0]}`).toNumber()
                if (swapTx.round !== round) {
                  console.log('Invalid round')
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
          const txHashes = await recorder?.getRoundTxHashes(swapTx.round)
          console.log('txHashes', txHashes)

          let hashChain = '0x0000000000000000000000000000000000000000000000000000000000000000'
          if (swapTx.order !== undefined && swapTx.order + 1 <= txHashes.length) {
            for (let i = 0; i < swapTx.order; i++) {
              hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
            }
          } else {
            hashChain = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'
          }

          if (
            swapTx.order === order &&
            address.toLowerCase() === swapTx?.tx?.txOwner.toLowerCase() &&
            swapTx.proofHash === hashChain &&
            swapTx.tx.nonce === nonce
          ) {
            // 스왑이 성공시
            if (success === true) {
              console.log('Success', fromResult, toResult)
              for (const log of currentOrderLogs) {
                if (log.topics[0].toLowerCase() === EventLogHashTransfer && fromResult === null) {
                  const token = new Contract(log.address, ERC20_ABI, library)
                  const decimal = await token.decimals()
                  const tokenSymbol = await token.symbol()
                  fromResult = {
                    token: tokenSymbol,
                    amount: hexToNumberString(log.data),
                    decimal: '1' + '0'.repeat(decimal),
                  }
                } else if (log.topics[0].toLowerCase() === EventLogHashTransfer && toResult === null) {
                  const token = new Contract(log.address, ERC20_ABI, library)
                  const decimal = await token.decimals()
                  const tokenSymbol = await token.symbol()
                  toResult = {
                    token: tokenSymbol,
                    amount: hexToNumberString(log.data),
                    decimal: '1' + '0'.repeat(decimal),
                  }
                  break
                }
              }
              await db.updateSwap(
                { field: 'id', value: swapTx.id as number },
                {
                  txId: txHash,
                  txDate: txTime,
                  fromResult,
                  toResult,
                  status: Status.COMPLETED,
                }
              )

              continue
            } else {
              const isCanceled = await recorder?.useOfVeto(swapTx.txHash, swapTx.tx.txOwner)
              if (isCanceled === true) {
                console.log('Canceled')
                await db.updateSwap(
                  { field: 'id', value: swapTx.id as number },
                  {
                    txId: txHash,
                    txDate: txTime,
                    status: Status.CANCELED,
                  }
                )

                continue
              } else {
                console.log('Rejected')
                await db.updateSwap(
                  { field: 'id', value: swapTx.id as number },
                  {
                    txId: txHash,
                    txDate: txTime,
                    status: Status.REJECTED,
                  }
                )
                continue
              }
            }
          } else {
            console.log('reimbursement')
            await db.updateSwap(
              { field: 'id', value: swapTx.id as number },
              {
                txId: txHash,
                txDate: txTime,
                status: Status.REIMBURSE_AVAILABLE,
              }
            )
            console.log(
              `expected: walletAddress: ${swapTx?.tx?.txOwner} / round - ${swapTx.round} / order - ${swapTx.order} / nonce - ${swapTx?.tx?.nonce}`
            )
            console.log(`real: address: ${address} / round - ${round} / order - ${order} / nonce - ${nonce}`)
            continue
          }
        }
      }
    }
  }
}

export async function CheckPendingTx2({
  chainId,
  library,
  router,
  recorder,
}: {
  chainId: number | undefined
  library: Web3Provider | undefined
  router: Contract | null
  recorder: Contract | null
}) {
  const pendingTxs = await db.pendingTxs.where('progressHere').equals(1).toArray()

  for (const pendingTx of pendingTxs) {
    // 1. round에 해당하는 txId 받아오기
    const readyTx = await db.readyTxs.get(pendingTx.readyTxId)

    console.log('get', pendingTx.round, pendingTx)
    const txHash = await getTxId(recorder, chainId, router?.address, pendingTx.round)
    if (txHash === null) continue

    console.log('has txHash', txHash)
    // 2. txId 실행되었는지 확인
    const txReceipt = await library?.getTransactionReceipt(txHash)

    if (txReceipt) {
      console.log('has receipt', txReceipt)

      const block = await library?.getBlock(txReceipt.blockNumber)
      const txTime = block?.timestamp as number

      const Logs = txReceipt?.logs as Array<{ address: string; topics: Array<any>; data: string }>
      let currentOrderLogs: any = []
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
                  console.log('Success', from, to)
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
                  })
                  continue
                } else {
                  const isCanceled = await recorder?.useOfVeto(readyTx.txHash, readyTx.tx.txOwner)
                  if (isCanceled === true) {
                    console.log('Canceled')
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
                      })
                    continue
                  } else {
                    console.log('Rejected')
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
                    })
                    continue
                  }
                }
              } else if (readyTx.tx.nonce < nonce) {
                console.log(`Nonce already passed (expected: ${readyTx.tx.nonce} / real: ${nonce})`)
                await db.pendingTxs.update(pendingTx.id as number, { round: 0 })
                throw Error(`Error: re scan from first`)
              }
            }
            currentOrderLogs = []
          }
        }

        const currentRound = await recorder?.currentRound()
        console.log(`currentRound: ${currentRound} ${pendingTx.round}`)
        // doneRound까지 봤으면
        if (parseInt(currentRound) === pendingTx.round + 1) {
          const isCanceled = await recorder?.useOfVeto(readyTx?.txHash, readyTx?.tx.txOwner)
          if (isCanceled === true) {
            console.log('Canceled')
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
              })
          }
          continue
        }
        console.log(`check next round: ${pendingTx.round + 1}`)
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
                console.log('Invalid round')
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
        console.log('txHashes', txHashes)

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
            console.log('Success', from, to)
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
            })

            continue
          } else {
            const isCanceled = await recorder?.useOfVeto(readyTx.txHash, readyTx.tx.txOwner)
            if (isCanceled === true) {
              console.log('Canceled')
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
                })

              continue
            } else {
              console.log('Rejected')
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
              })

              continue
            }
          }
        } else {
          console.log('reimbursement')
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
          })

          console.log(
            `expected: walletAddress: ${readyTx?.tx.txOwner} / round - ${pendingTx.round} / order - ${pendingTx.order} / nonce - ${readyTx?.tx.nonce}`
          )
          console.log(`real: address: ${address} / round - ${round} / order - ${order} / nonce - ${nonce}`)
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
