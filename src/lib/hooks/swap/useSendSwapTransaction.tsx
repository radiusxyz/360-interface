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
import { useMemo } from 'react'
import { useAppDispatch } from 'state/hooks'
import { useCancelManager } from 'state/modal/hooks'
import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
import {
  ParameterState,
  setTimeLockPuzzleParam,
  setTimeLockPuzzleSnarkParam,
  TimeLockPuzzleParam,
} from 'state/parameters/reducer'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { poseidonEncryptWithTxHash } from 'wasm/encrypt'
import { getTimeLockPuzzleProof } from 'wasm/timeLockPuzzle'

import { useRecorderContract, useV2RouterContract } from '../../../hooks/useContract'
import { db, Status } from '../../../utils/db'
import { TimeLockPuzzleResponse } from '../../../wasm/timeLockPuzzle'

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

export interface EncryptedSwapTx {
  txOwner: string
  functionSelector: string
  amountIn: string
  amountOut: string
  path: Path
  to: string
  nonce: number
  backerIntegrity: boolean
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

const swapExactTokensForTokens = '0x73a2cff1'

// returns a function that will execute a swap, if the parameters are all valid
export default function useSendSwapTransaction(
  account: string | null | undefined,
  chainId: number | undefined,
  library: JsonRpcProvider | undefined,
  trade: AnyTrade | undefined, // trade to execute, required
  swapCalls: Promise<SwapCall[]>,
  deadline: BigNumber | undefined,
  allowedSlippage: Percent,
  parameters: ParameterState
): {
  prepareSignMessage?: (
    backerIntegrity: boolean,
    nonce: string
  ) => Promise<{
    signMessage: any
    txNonce: number
    idPath: string
  }>
  userSign?: (signMessage: any) => Promise<{ sig: Signature } | null>
  getTimeLockPuzzle?: () => Promise<{ timeLockPuzzleData: TimeLockPuzzleResponse }>
  createEncryptProof?: (
    timeLockPuzzleData: TimeLockPuzzleResponse,
    txNonce: number,
    signMessage: any,
    idPath: string
  ) => Promise<{ txHash: string; mimcHash: string; encryptedSwapTx: any }>
  sendEncryptedTx?: (
    txHash: string,
    mimcHash: string,
    signMessage: any,
    encryptedSwapTx: any,
    sig: Signature,
    operatorAddress: string
  ) => Promise<RadiusSwapResponse | undefined>
} {
  const dispatch = useAppDispatch()

  const routerContract = useV2RouterContract() as Contract
  const recorderContract = useRecorderContract() as Contract
  const [cancel, setCancel] = useCancelManager()

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { callback: null }
    }
    return {
      prepareSignMessage: async function prepareSignMessage(
        backerIntegrity: boolean,
        nonce: string
      ): Promise<{
        signMessage: any
        txNonce: number
        idPath: string
      }> {
        const signer = library.getSigner()
        const signAddress = await signer.getAddress()

        const resolvedCalls = await swapCalls
        console.log('resolvedCalls', resolvedCalls)
        const { deadline, availableFrom, amountIn, amountOut, path, idPath } = resolvedCalls[0]

        const contractNonce = nonce

        const operatorPendingTxCnt = await fetch(
          `${process.env.REACT_APP_360_OPERATOR}/tx/pendingTxCnt?chainId=${chainId}&walletAddress=${account}`
        )
        const text = await operatorPendingTxCnt.text()
        // console.log('test', contractNonce, text)

        const txNonce = parseInt(contractNonce) + parseInt(text)
        // console.log('test2', txNonce)

        const signMessage = {
          txOwner: signAddress,
          functionSelector: swapExactTokensForTokens,
          amountIn: `${amountIn}`,
          amountOut: `${amountOut}`,
          path,
          to: signAddress,
          nonce: txNonce,
          backerIntegrity,
          deadline,
          availableFrom,
        }

        return { signMessage, txNonce, idPath }
      },
      userSign: async function userSign(signMessage: any): Promise<{ sig: Signature } | null> {
        console.log('userSign')
        const typedData = JSON.stringify({
          types: {
            EIP712Domain: DOMAIN_TYPE,
            Swap: SWAP_TYPE,
          },
          primaryType: 'Swap',
          domain: domain(chainId),
          message: signMessage,
        })
        const signer = library.getSigner()
        const signAddress = await signer.getAddress()
        // console.log('aaa')

        // const now = Date.now()

        // console.log('now', now)
        const sig = await signWithEIP712(library, signAddress, typedData).catch((e) => {
          console.log(e)
          return null
        })

        // if (now + 10000 < Date.now()) {
        //   return null
        // }

        return sig ? { sig } : null
      },
      getTimeLockPuzzle: async function getTimeLockPuzzle(): Promise<{ timeLockPuzzleData: TimeLockPuzzleResponse }> {
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

        const timeLockPuzzleData = await getTimeLockPuzzleProof(timeLockPuzzleParam, timeLockPuzzleSnarkParam)
        return { timeLockPuzzleData }
      },
      createEncryptProof: async function createEncryptProof(
        timeLockPuzzleData: TimeLockPuzzleResponse,
        txNonce: number,
        signMessage: any,
        idPath: string
      ): Promise<{ txHash: string; mimcHash: string; encryptedSwapTx: any }> {
        console.log('signMessage', signMessage, signMessage.path.length)
        console.log('timeLockPuzzleData', timeLockPuzzleData)
        console.log('idPath', idPath)
        const signer = library.getSigner()
        const signAddress = await signer.getAddress()

        if (signMessage.path.length > 3) {
          console.error('Cannot encrypt path which length is over 3')
        }

        const pathToHash: string[] = new Array(MAXIMUM_PATH_LENGTH)

        for (let i = 0; i < MAXIMUM_PATH_LENGTH; i++) {
          pathToHash[i] = i < signMessage.path.length ? signMessage.path[i].split('x')[1] : '0'
        }

        const txInfoToHash: TxInfo = {
          tx_owner: signMessage.txOwner.split('x')[1],
          function_selector: signMessage.functionSelector.split('x')[1],
          amount_in: `${signMessage.amountIn}`,
          amount_out: `${signMessage.amountOut}`,
          to: signMessage.to.split('x')[1],
          deadline: `${signMessage.deadline}`,
          nonce: `${signMessage.nonce}`,
          path: pathToHash,
        }
        // console.log('🚀 ~ file: useSendSwapTransaction.tsx:511 ~ returnuseMemo ~ txInfoToHash', txInfoToHash)

        const time = Date.now()
        const encryptData = await poseidonEncryptWithTxHash(
          txInfoToHash,
          timeLockPuzzleData.s2_string,
          timeLockPuzzleData.s2_field_hex,
          timeLockPuzzleData.commitment_hex,
          idPath
        )
        console.log('encrypt time', Date.now() - time)
        // console.log('🚀 ~ file: useSendSwapTransaction.tsx:520 ~ returnuseMemo ~ encryptData', encryptData)

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
        const mimcHash = '0x' + encryptData.tx_id

        const encryptedSwapTx: EncryptedSwapTx = {
          txOwner: signAddress,
          functionSelector: swapExactTokensForTokens,
          amountIn: `${signMessage.amountIn}`,
          amountOut: `${signMessage.amountOut}`,
          path: encryptedPath,
          to: signAddress,
          nonce: txNonce,
          backerIntegrity: signMessage.backerIntegrity,
          availableFrom: signMessage.availableFrom,
          deadline: signMessage.deadline,
          txHash,
          mimcHash,
        }

        return { txHash, mimcHash, encryptedSwapTx }
      },
      sendEncryptedTx: async function sendEncryptedTx(
        txHash: string,
        mimcHash: string,
        signMessage: any,
        encryptedSwapTx: any,
        sig: Signature,
        operatorAddress: string
      ): Promise<RadiusSwapResponse | undefined> {
        console.log('run sendEncryptedTx', txHash, mimcHash, signMessage, encryptedSwapTx, sig, operatorAddress)
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

        // db.transaction('rw', db.swap, async () => {
        const sendResponse = await db
          .setSwap({
            txHash,
            mimcHash,
            tx: signMessage,
            from: { token: inSymbol, amount: input.toString(), decimal: inDecimal.toString() },
            to: { token: outSymbol, amount: output.toString(), decimal: outDecimal.toString() },
          })
          .then(async (i) => {
            const sendResponse = await sendEIP712Tx(
              chainId,
              routerContract,
              recorderContract,
              encryptedSwapTx,
              sig,
              dispatch,
              setCancel,
              operatorAddress
            )

            return { ...sendResponse, dbId: i }
          })
        return sendResponse
        // })

        // return undefined
      },
    }
  }, [trade, library, account, chainId, parameters, swapCalls, dispatch])
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
  console.log('signWithEIP712')
  const signer = library.getSigner()
  console.log('signer', signer)
  const sig = await signer.provider
    .send('eth_signTypedData_v4', [signAddress, typedData])
    .then((response) => {
      const sig = splitSignature(response)
      console.log('sig', sig)
      return sig
    })
    .catch((error) => {
      // if the user rejected the sign, pass this along
      if (error?.code === 401) {
        throw new Error(`Sign rejected.`)
      } else {
        // otherwise, the error was unexpected and we need to convey that
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
  dispatch: any,
  setCancel: (cancel: number) => void,
  operatorAddress: string
): Promise<RadiusSwapResponse> {
  const swap = await db.swap.where({ txHash: encryptedSwapTx.txHash }).first()
  const time = Date.now()
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
    10000
  )
    .then(async (res) => {
      console.log('get Tx time', Date.now() - time)
      return res.json()
    })
    .then(async (res) => {
      console.log('json response', res, res.txOrderMsg)

      const msgHash = typedDataEncoder.hash(domain(chainId), { Claim: CLAIM_TYPE }, res.txOrderMsg)

      const verifySigner = recoverAddress(msgHash, res.signature)
      // const operatorAddress = await routerContract.operator()

      if (
        verifySigner === operatorAddress &&
        encryptedSwapTx.txHash === res.txOrderMsg.txHash &&
        encryptedSwapTx.mimcHash === res.txOrderMsg.mimcHash
      ) {
        // console.log('clear disableTxHash tx')
        console.log('txOrderMsg', res.txOrderMsg, swap)

        await db.updateSwap(
          {
            field: 'id',
            value: swap?.id as number,
          },
          {
            round: parseInt(res.txOrderMsg.round),
            order: parseInt(res.txOrderMsg.order),
            proofHash: res.txOrderMsg.proofHash,
            sendDate: Math.floor(Date.now() / 1000),
            operatorSignature: res.signature,
            status: Status.PENDING,
          }
        )

        return {
          data: res,
          msg: "Successfully received tx's order and round",
        }
      } else {
        console.log('operator sign verify error')

        throw new Error(`Operator answered wrong response.`)
        // return {
        //   data: res,
        //   msg: "Error: tx's order and round is invalid. let's cancel tx",
        // }
      }
    })
    .catch(async (error) => {
      console.log(error)
      const _currentRound = parseInt((await recorderContract.currentRound()).toString())
      const doneRound = _currentRound === 0 ? 0 : _currentRound - 1

      const id = await db.updateSwap(
        {
          field: 'id',
          value: swap?.id as number,
        },
        {
          round: doneRound,
          order: -1,
          proofHash: '',
          sendDate: Math.floor(Date.now() / 1000),
          operatorSignature: { r: '', s: '', v: 27 },
          status: Status.PENDING,
        }
      )

      setCancel(id as number)

      if (error.name === 'AbortError') {
        throw new Error(
          `Operator is not respond: ${swapErrorToUserReadableMessage({ ...error, message: 'Operator is not respond' })}`
        )
      } else {
        throw new Error(`Send failed: ${swapErrorToUserReadableMessage(error)}`)
      }
    })

  return sendResponse
}
