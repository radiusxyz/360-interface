import { BigNumber } from '@ethersproject/bignumber'
import { Signature, splitSignature } from '@ethersproject/bytes'
import { Contract } from '@ethersproject/contracts'
import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'
import { JsonRpcProvider } from '@ethersproject/providers'
import { recoverAddress } from '@ethersproject/transactions'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { CLAIM_TYPE, domain, DOMAIN_TYPE, SWAP_TYPE } from 'constants/eip712'
import { SwapCall } from 'hooks/useSwapCallArguments'
import JSBI from 'jsbi'
import localForage from 'localforage'
import { useEffect, useMemo } from 'react'
import { useAppDispatch } from 'state/hooks'
import { useCancelManager } from 'state/modal/hooks'
import { setProgress } from 'state/modal/reducer'
import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
import {
  ParameterState,
  setTimeLockPuzzleParam,
  setTimeLockPuzzleSnarkParam,
  TimeLockPuzzleParam,
} from 'state/parameters/reducer'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { poseidonEncryptWithTxHash } from 'wasm/encrypt'
import { getTimeLockPuzzleProof, TimeLockPuzzleResponse } from 'wasm/timeLockPuzzle'

import { useRecorderContract, useV2RouterContract } from '../../../hooks/useContract'
import { db } from '../../../utils/db'

type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

export interface TxInfo {
  tx_owner: string
  function_selector: string
  amount_in: string
  amount_out: string
  path: string[] // length MUST be 6 -> for compatibility with rust-wasm
  to: string
  nonce: string
  deadline: string
}

const MAXIMUM_PATH_LENGTH = 3

interface EncryptedSwapTx {
  txOwner: string
  functionSelector: string
  amountIn: string
  amountOut: string
  path: Path
  to: string
  nonce: number
  availableFrom: number
  deadline: number
  txHash: string
  mimcHash: string
}

interface Path {
  message_length: number
  nonce: string
  commitment: string
  cipher_text: string[]
  r1: string
  r3: string
  s1: string
  s3: string
  k: string
  time_lock_puzzle_snark_proof: string
  encryption_proof: string
}

export interface RadiusSwapRequest {
  sig: Signature
  encryptedSwapTx: EncryptedSwapTx
}

export interface RadiusSwapResponse {
  data: {
    txOrderMsg: {
      round: number
      order: number
      mimcHash: string
      txHash: string
      proofHash: string
    }
    signature: {
      r: string
      s: string
      v: number
    }
  }
  msg: string
}

const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' })

const swapExactTokensForTokens = '0x375734d9'

export function useTimeLockPuzzleParam(parameters: ParameterState) {
  const dispatch = useAppDispatch()

  let timeLockPuzzleParam: TimeLockPuzzleParam | null = null
  let timeLockPuzzleSnarkParam: string | null = null

  useEffect(() => {
    const load = async () => {
      timeLockPuzzleParam = await localForage.getItem('time_lock_puzzle_param')
      timeLockPuzzleSnarkParam = await localForage.getItem('time_lock_puzzle_snark_param')
      // if save flag is false or getItem result is null
      if (!parameters.timeLockPuzzleParam || !timeLockPuzzleParam) {
        timeLockPuzzleParam = await fetchTimeLockPuzzleParam((newParam: boolean) => {
          dispatch(setTimeLockPuzzleParam({ newParam }))
        })
      }

      if (!parameters.timeLockPuzzleSnarkParam || !timeLockPuzzleSnarkParam) {
        timeLockPuzzleSnarkParam = await fetchTimeLockPuzzleSnarkParam((newParam: boolean) => {
          dispatch(setTimeLockPuzzleSnarkParam({ newParam }))
        })
      }
    }
    load()
  }, [])

  return { timeLockPuzzleParam, timeLockPuzzleSnarkParam }
  // const timeLockPuzzleData = await getTimeLockPuzzleProof(timeLockPuzzleParam, timeLockPuzzleSnarkParam)
}

export async function getEncryptProof(
  routerContract: Contract | null,
  timeLockPuzzleData: TimeLockPuzzleResponse,
  chainId: number | undefined,
  signAddress: string,
  swapCalls: Promise<SwapCall[]>,
  sigHandler: () => void
) {
  const resolvedCalls = await swapCalls
  const { address, availableFrom, deadline, amountIn, amountOut, path, idPath } = resolvedCalls[0]

  // const signer = library.getSigner()
  // const signAddress = await signer.getAddress()

  const contractNonce = await routerContract?.nonces(address)
  const operatorPendingTxCnt = await fetch(
    `${process.env.REACT_APP_360_OPERATOR}/tx/pendingTxCnt?chainId=${chainId}&walletAddress=${address}`
  )
  const txNonce = parseInt(contractNonce) + parseInt(await operatorPendingTxCnt.text())

  // const _txNonce = window.localStorage.getItem(signAddress + ':nonce')
  // const txNonce = _txNonce ? BigNumber.from(_txNonce).toNumber() : 0

  // console.log('nonce from contract', txNonce)

  if (path.length > 3) {
    console.error('Cannot encrypt path which length is over 3')
  }

  const pathToHash: string[] = new Array(MAXIMUM_PATH_LENGTH)

  for (let i = 0; i < MAXIMUM_PATH_LENGTH; i++) {
    pathToHash[i] = i < path.length ? path[i].split('x')[1] : '0'
  }

  const txInfoToHash: TxInfo = {
    tx_owner: signAddress.split('x')[1],
    function_selector: swapExactTokensForTokens.split('x')[1],
    amount_in: `${amountIn}`,
    amount_out: `${amountOut}`,
    to: signAddress.split('x')[1],
    deadline: `${deadline}`,
    nonce: `${txNonce}`,
    path: pathToHash,
  }

  sigHandler()

  const encryptData = await poseidonEncryptWithTxHash(
    txInfoToHash,
    timeLockPuzzleData.s2_string,
    timeLockPuzzleData.s2_field_hex,
    timeLockPuzzleData.commitment_hex,
    idPath
  )

  return encryptData
}

export async function getSignTransaction(
  routerContract: Contract | null,
  timeLockPuzzleData: any,
  encryptData: any,
  chainId: number,
  signAddress: string,
  library: JsonRpcProvider,
  swapCalls: Promise<SwapCall[]>
) {
  const resolvedCalls = await swapCalls
  const { address, availableFrom, deadline, amountIn, amountOut, path, idPath } = resolvedCalls[0]

  const contractNonce = await routerContract?.nonces(address)
  const operatorPendingTxCnt = await fetch(
    `${process.env.REACT_APP_360_OPERATOR}/tx/pendingTxCnt?chainId=${chainId}&walletAddress=${address}`
  )
  const txNonce = parseInt(contractNonce) + parseInt(await operatorPendingTxCnt.text())

  // const _txNonce = window.localStorage.getItem(signAddress + ':nonce')
  // const txNonce = !_txNonce ? 0 : BigNumber.from(_txNonce).toNumber()

  const encryptedPath = {
    message_length: encryptData.message_length,
    nonce: encryptData.nonce,
    commitment: timeLockPuzzleData.commitment_hex,
    cipher_text: [encryptData.cipher_text],
    r1: timeLockPuzzleData.r1,
    r3: timeLockPuzzleData.r3,
    s1: timeLockPuzzleData.s1,
    s3: timeLockPuzzleData.s3,
    k: timeLockPuzzleData.k,
    time_lock_puzzle_snark_proof: timeLockPuzzleData.time_lock_puzzle_snark_proof,
    encryption_proof: encryptData.proof,
  }

  const signMessage = {
    txOwner: signAddress,
    functionSelector: swapExactTokensForTokens,
    amountIn: `${amountIn}`,
    amountOut: `${amountOut}`,
    path,
    to: signAddress,
    nonce: txNonce,
    availableFrom,
    deadline,
  }

  const typedData = JSON.stringify({
    types: {
      EIP712Domain: DOMAIN_TYPE,
      Swap: SWAP_TYPE,
    },
    primaryType: 'Swap',
    domain: domain(chainId),
    message: signMessage,
  })

  const sig = await signWithEIP712(library, signAddress, typedData)

  const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, signMessage)

  const encryptedSwapTx: EncryptedSwapTx = {
    txOwner: signAddress,
    functionSelector: swapExactTokensForTokens,
    amountIn: `${amountIn}`,
    amountOut: `${amountOut}`,
    path: encryptedPath,
    to: signAddress,
    nonce: txNonce,
    availableFrom,
    deadline,
    txHash,
    mimcHash: '0x' + encryptData.tx_id,
  }

  await db.readyTxs.add({
    txHash,
    mimcHash: '0x' + encryptData.tx_id,
    tx: signMessage,
    progressHere: 1,
    from: { token: 'fromToken', amount: '123000000000000000000', decimal: '1000000000000000000' },
    to: { token: 'toToken', amount: '321000000000000000000', decimal: '1000000000000000000' },
  })

  return { encryptedSwapTx, sig }
}

// async function useAAA() {
//   const routerContract = useV2RouterContract() as Contract

//   const sendResponse = await sendEIP712Tx(chainId, routerContract, encryptedSwapTx, sig)

//   // console.log('sendResponse', sendResponse)

//   const finalResponse: RadiusSwapResponse = {
//     data: sendResponse.data,
//     msg: sendResponse.msg,
//   }
//   return finalResponse
// }

// returns a function that will execute a swap, if the parameters are all valid
export default function useSendSwapTransaction(
  account: string | null | undefined,
  chainId: number | undefined,
  library: JsonRpcProvider | undefined,
  trade: AnyTrade | undefined, // trade to execute, required
  swapCalls: Promise<SwapCall[]>,
  deadline: BigNumber | undefined,
  allowedSlippage: Percent,
  parameters: ParameterState,
  sigHandler: () => void
): { callback: null | (() => Promise<RadiusSwapResponse>) } {
  // console.log(parameters)
  const dispatch = useAppDispatch()

  const routerContract = useV2RouterContract() as Contract
  const recorderContract = useRecorderContract() as Contract
  const [cancel, setCancel] = useCancelManager()

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { callback: null }
    }
    return {
      callback: async function onSwap(): Promise<RadiusSwapResponse> {
        let timeLockPuzzleParam: TimeLockPuzzleParam | null = await localForage.getItem('time_lock_puzzle_param')
        let timeLockPuzzleSnarkParam: string | null = await localForage.getItem('time_lock_puzzle_snark_param')

        // if save flag is false or getItem result is null
        if (!parameters.timeLockPuzzleParam || !timeLockPuzzleParam) {
          timeLockPuzzleParam = await fetchTimeLockPuzzleParam((newParam: boolean) => {
            dispatch(setTimeLockPuzzleParam({ newParam }))
          })
        }

        if (!parameters.timeLockPuzzleSnarkParam || !timeLockPuzzleSnarkParam) {
          timeLockPuzzleSnarkParam = await fetchTimeLockPuzzleSnarkParam((newParam: boolean) => {
            dispatch(setTimeLockPuzzleSnarkParam({ newParam }))
          })
        }

        const resolvedCalls = await swapCalls

        const signer = library.getSigner()
        const signAddress = await signer.getAddress()

        const contractNonce = await routerContract.nonces(account)
        const operatorPendingTxCnt = await fetch(
          `${process.env.REACT_APP_360_OPERATOR}/tx/pendingTxCnt?chainId=${chainId}&walletAddress=${account}`
        )
        const txNonce = parseInt(contractNonce) + parseInt(await operatorPendingTxCnt.text())
        // const _txNonce = window.localStorage.getItem(account + ':nonce')
        // const txNonce = !_txNonce ? 0 : BigNumber.from(_txNonce).toNumber()

        // console.log('nonce from contract', txNonce)

        const { address, deadline, amountIn, amountOut, path, idPath } = resolvedCalls[0]

        const message = {
          txOwner: signAddress,
          functionSelector: swapExactTokensForTokens,
          amountIn: `${amountIn}`,
          amountOut: `${amountOut}`,
          path,
          to: signAddress,
          nonce: txNonce,
          deadline,
        }

        if (path.length > 3) {
          console.error('Cannot encrypt path which length is over 3')
        }

        const pathToHash: string[] = new Array(MAXIMUM_PATH_LENGTH)

        for (let i = 0; i < MAXIMUM_PATH_LENGTH; i++) {
          pathToHash[i] = i < path.length ? path[i].split('x')[1] : '0'
        }

        const txInfoToHash: TxInfo = {
          tx_owner: signAddress.split('x')[1],
          function_selector: swapExactTokensForTokens.split('x')[1],
          amount_in: `${amountIn}`,
          amount_out: `${amountOut}`,
          to: signAddress.split('x')[1],
          deadline: `${deadline}`,
          nonce: `${txNonce}`,
          path: pathToHash,
        }

        // console.log('txInfoToHash: ', txInfoToHash)

        // const params = [txHash]
        // const action = 'disableTxHash'
        // const unsignedTx = await recorderContract.populateTransaction[action](...params)
        // console.log('unsignedTx', unsignedTx)

        // const nonce = await signer.provider.getTransactionCount(signAddress)

        // const feeData = await signer.getFeeData()
        // const gasLimit = await routerContract.estimateGas.disableTxHash(...params)
        // unsignedTx.gasLimit = gasLimit.mul(BigNumber.from(1.1))
        // unsignedTx.maxFeePerGas = feeData.maxFeePerGas as BigNumber
        // unsignedTx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas as BigNumber
        // unsignedTx.nonce = nonce
        // console.log('unsignedTx2', unsignedTx)

        // const tx = {
        //   nonce: unsignedTx.nonce,
        //   gasLimit: unsignedTx.gasLimit.toHexString(),
        //   maxFeePerGas: unsignedTx.maxFeePerGas.toHexString(),
        //   maxPriorityFeePerGas: unsignedTx.maxPriorityFeePerGas.toHexString(),
        //   to: unsignedTx.to,
        //   data: unsignedTx.data,
        //   chainId,
        //   type: 2,
        // }

        // console.log('tx', tx)

        // const sign = await signer.signTransaction(tx)

        // const sign = await signer.provider
        //   .send('eth_sign', [signAddress, keccak256(serialize(tx))])
        //   .then((response) => {
        //     console.log(response)
        //     const sig = splitSignature(response)
        //     return sig
        //   })
        //   .catch((error) => {
        //     // if the user rejected the sign, pass this along
        //     if (error?.code === 401) {
        //       throw new Error(`Sign rejected.`)
        //     } else {
        //       // otherwise, the error was unexpected and we need to convey that
        //       console.error(`Sign failed`, error, signAddress, typedData)

        //       throw new Error(`Sign failed: ${swapErrorToUserReadableMessage(error)}`)
        //     }
        //   })
        // console.log(sign)

        sigHandler()

        // const disableTxHash = serialize(tx, sign)

        // console.log('disableTxHash', disableTxHash)
        // console.log(signer, signAddress)
        const availableFrom = Math.floor(Date.now() / 1000) + 70
        const now = Date.now()

        const signMessage = { ...message, availableFrom }

        const typedData = JSON.stringify({
          types: {
            EIP712Domain: DOMAIN_TYPE,
            Swap: SWAP_TYPE,
          },
          primaryType: 'Swap',
          domain: domain(chainId),
          message: signMessage,
        })

        dispatch(setProgress({ newParam: 1 }))

        const sig = await signWithEIP712(library, signAddress, typedData)

        if (now + 10000 < Date.now()) {
          dispatch(setProgress({ newParam: 8 }))
          return {
            data: {
              txOrderMsg: {
                round: 0,
                order: 0,
                mimcHash: '',
                txHash: '',
                proofHash: '',
              },
              signature: {
                r: '',
                s: '',
                v: 27,
              },
            },
            msg: 'timeOver',
          }
        }

        dispatch(setProgress({ newParam: 2 }))

        const timeLockPuzzleData = await getTimeLockPuzzleProof(timeLockPuzzleParam, timeLockPuzzleSnarkParam)

        // console.log(timeLockPuzzleData)

        dispatch(setProgress({ newParam: 3 }))

        const encryptData = await poseidonEncryptWithTxHash(
          txInfoToHash,
          timeLockPuzzleData.s2_string,
          timeLockPuzzleData.s2_field_hex,
          timeLockPuzzleData.commitment_hex,
          idPath
        )

        // console.log(encryptData)

        const encryptedPath = {
          message_length: encryptData.message_length,
          nonce: encryptData.nonce,
          commitment: timeLockPuzzleData.commitment_hex,
          cipher_text: [encryptData.cipher_text],
          r1: timeLockPuzzleData.r1,
          r3: timeLockPuzzleData.r3,
          s1: timeLockPuzzleData.s1,
          s3: timeLockPuzzleData.s3,
          k: timeLockPuzzleData.k,
          time_lock_puzzle_snark_proof: timeLockPuzzleData.time_lock_puzzle_snark_proof,
          encryption_proof: encryptData.proof,
        }

        // console.log(sig)

        const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, signMessage)

        const encryptedSwapTx: EncryptedSwapTx = {
          txOwner: signAddress,
          functionSelector: swapExactTokensForTokens,
          amountIn: `${amountIn}`,
          amountOut: `${amountOut}`,
          path: encryptedPath,
          to: signAddress,
          nonce: txNonce,
          availableFrom,
          deadline,
          txHash,
          mimcHash: '0x' + encryptData.tx_id,
        }

        let input = trade?.inputAmount?.numerator
        let output = trade?.outputAmount?.numerator
        input = !input ? JSBI.BigInt(0) : input
        output = !output ? JSBI.BigInt(0) : output

        const inDecimal =
          trade?.inputAmount?.decimalScale !== undefined ? trade?.inputAmount?.decimalScale : JSBI.BigInt(1)
        const outDecimal =
          trade?.outputAmount?.decimalScale !== undefined ? trade?.outputAmount?.decimalScale : JSBI.BigInt(1)

        const inSymbol = trade?.inputAmount?.currency?.symbol !== undefined ? trade?.inputAmount?.currency?.symbol : ''
        const outSymbol =
          trade?.outputAmount?.currency?.symbol !== undefined ? trade?.outputAmount?.currency?.symbol : ''

        await db.readyTxs.add({
          txHash,
          mimcHash: '0x' + encryptData.tx_id,
          tx: signMessage,
          progressHere: 1,
          from: { token: inSymbol, amount: input.toString(), decimal: inDecimal.toString() },
          to: { token: outSymbol, amount: output.toString(), decimal: outDecimal.toString() },
        })

        const sendResponse = await sendEIP712Tx(
          chainId,
          routerContract,
          recorderContract,
          encryptedSwapTx,
          sig,
          setCancel
        )

        dispatch(setProgress({ newParam: 4 }))

        // console.log('sendResponse', sendResponse)

        const finalResponse: RadiusSwapResponse = {
          data: sendResponse.data,
          msg: sendResponse.msg,
        }
        return finalResponse
      },
    }
  }, [trade, library, account, chainId, parameters, swapCalls, sigHandler, dispatch])
}

async function fetchWithTimeout(resource: any, options: any, timeout = 1000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  })
  clearTimeout(id)
  return response
}

async function signWithEIP712(library: JsonRpcProvider, signAddress: string, typedData: string): Promise<Signature> {
  const signer = library.getSigner()
  const sig = await signer.provider
    .send('eth_signTypedData_v4', [signAddress, typedData])
    .then((response) => {
      const sig = splitSignature(response)
      return sig
    })
    .catch((error) => {
      // if the user rejected the sign, pass this along
      if (error?.code === 401) {
        throw new Error(`Sign rejected.`)
      } else {
        // otherwise, the error was unexpected and we need to convey that
        console.error(`Sign failed`, error, signAddress, typedData)

        throw new Error(`Sign failed: ${swapErrorToUserReadableMessage(error)}`)
      }
    })

  return sig
}

export async function sendEIP712Tx(
  chainId: number,
  routerContract: Contract,
  recorderContract: Contract,
  encryptedSwapTx: EncryptedSwapTx,
  signature: Signature,
  setCancel: (cancel: number) => void
): Promise<RadiusSwapResponse> {
  const readyTx = await db.readyTxs.where({ txHash: encryptedSwapTx.txHash }).first()
  const sendResponse = await fetchWithTimeout(
    `${process.env.REACT_APP_360_OPERATOR}/tx`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chainId,
        routerAddress: routerContract.address,
        encryptedSwapTx,
        signature,
      }),
    },
    5000
  )
    .then(async (res) => res.json())
    .then(async (res) => {
      // console.log('json response', res)

      const signature = {
        r: res.signature.r,
        s: res.signature.s,
        v: res.signature.v,
      }

      const msgHash = typedDataEncoder.hash(domain(chainId), { Claim: CLAIM_TYPE }, res.txOrderMsg)

      const verifySigner = recoverAddress(msgHash, signature)
      const operatorAddress = await routerContract.operator()

      // console.log('verifySigner', verifySigner)
      // console.log('operatorAddress from router', operatorAddress)

      if (
        verifySigner === operatorAddress &&
        encryptedSwapTx.txHash === res.txOrderMsg.txHash &&
        encryptedSwapTx.mimcHash === res.txOrderMsg.mimcHash
      ) {
        // console.log('clear disableTxHash tx')
        console.log('txOrderMsg', res.txOrderMsg)

        await db.readyTxs.where({ id: readyTx?.id }).modify({ progressHere: 0 })
        await db.pendingTxs.add({
          round: parseInt(res.txOrderMsg.round),
          order: parseInt(res.txOrderMsg.order),
          proofHash: res.txOrderMsg.proofHash,
          sendDate: Date.now(),
          operatorSignature: signature,
          readyTxId: readyTx?.id as number,
          progressHere: 1,
        })

        return {
          data: res,
          msg: "Successfully received tx's order and round",
        }
      } else {
        const currentRound = await recorderContract.currentRound()
        await db.readyTxs.where({ id: readyTx?.id }).modify({ progressHere: 0 })
        await db.pendingTxs.add({
          round: parseInt(currentRound),
          order: -1,
          proofHash: '',
          sendDate: Date.now(),
          operatorSignature: { r: '', s: '', v: 27 },
          readyTxId: readyTx?.id as number,
          progressHere: 1,
        })
        setCancel(readyTx?.id as number)

        throw new Error(`Operator answered wrong response.`)
        // return {
        //   data: res,
        //   msg: "Error: tx's order and round is invalid. let's cancel tx",
        // }
      }
    })
    .catch(async (error) => {
      console.log(error)

      const currentRound = await recorderContract.currentRound()
      await db.readyTxs.where({ id: readyTx?.id }).modify({ progressHere: 0 })
      await db.pendingTxs.add({
        round: parseInt(currentRound),
        order: -1,
        proofHash: '',
        sendDate: Date.now(),
        operatorSignature: { r: '', s: '', v: 27 },
        readyTxId: readyTx?.id as number,
        progressHere: 1,
      })
      setCancel(readyTx?.id as number)

      if (error.name === 'AbortError') {
        throw new Error(
          `Operator is not respond: ${swapErrorToUserReadableMessage({ ...error, message: 'Operator is not respond' })}`
        )
      } else {
        console.error(error)
        throw new Error(`Send failed: ${swapErrorToUserReadableMessage(error)}`)
      }
    })

  return sendResponse
}
