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
import { addPopup } from 'state/application/reducer'
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
import { getTimeLockPuzzleProof } from 'wasm/timeLockPuzzle'

import { useRecorderContract, useV2RouterContract } from '../../../hooks/useContract'
import { db, Status, TokenAmount } from '../../../utils/db'
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
): {
  callback: null | (() => Promise<RadiusSwapResponse>)
  split1?: () => Promise<{
    signMessage: any
    timeLockPuzzleParam: TimeLockPuzzleParam
    timeLockPuzzleSnarkParam: string
    txNonce: number
    idPath: string
  }>
  split2?: (signMessage: any) => Promise<{ sig: Signature }>
  split3?: (
    timeLockPuzzleParam: TimeLockPuzzleParam,
    timeLockPuzzleSnarkParam: string
  ) => Promise<{ timeLockPuzzleData: TimeLockPuzzleResponse }>
  split4?: (
    timeLockPuzzleData: TimeLockPuzzleResponse,
    txNonce: number,
    signMessage: any,
    idPath: string
  ) => Promise<{ txHash: string; mimcHash: string; encryptedSwapTx: any }>
  split5?: (
    txHash: string,
    mimcHash: string,
    signMessage: any,
    encryptedSwapTx: any,
    sig: Signature
  ) => Promise<RadiusSwapResponse>
} {
  const dispatch = useAppDispatch()

  const routerContract = useV2RouterContract() as Contract
  const recorderContract = useRecorderContract() as Contract
  const [cancel, setCancel] = useCancelManager()
  // const progress = useProgress()

  const emptyResponse = {
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

        console.log('resolvedCalls', resolvedCalls)

        const { deadline, availableFrom, amountIn, amountOut, path, idPath } = resolvedCalls[0]

        // TODO: 1 need
        const contractNonce = await routerContract.nonces(account)

        const operatorPendingTxCnt = await fetch(
          `${process.env.REACT_APP_360_OPERATOR}/tx/pendingTxCnt?chainId=${chainId}&walletAddress=${account}`
        )
        const text = await operatorPendingTxCnt.text()
        console.log('test', contractNonce, text)

        const txNonce = parseInt(contractNonce) + parseInt(text)
        console.log('test2', txNonce)

        const signMessage = {
          txOwner: signAddress,
          functionSelector: swapExactTokensForTokens,
          amountIn: `${amountIn}`,
          amountOut: `${amountOut}`,
          path,
          to: signAddress,
          nonce: txNonce,
          deadline,
          availableFrom,
        }

        sigHandler()

        // const disableTxHash = serialize(tx, sign)

        // console.log('disableTxHash', disableTxHash)
        // console.log(signer, signAddress)
        // const availableFrom = Math.floor(Date.now() / 1000) + 70
        dispatch(setProgress({ newParam: 1 }))

        const typedData = JSON.stringify({
          types: {
            EIP712Domain: DOMAIN_TYPE,
            Swap: SWAP_TYPE,
          },
          primaryType: 'Swap',
          domain: domain(chainId),
          message: signMessage,
        })

        const now = Date.now()

        const sig = await signWithEIP712(library, signAddress, typedData)

        if (now + 10000 < Date.now()) {
          dispatch(setProgress({ newParam: 8 }))
          return emptyResponse
        }

        dispatch(setProgress({ newParam: 2 }))

        const timeLockPuzzleData = await getTimeLockPuzzleProof(timeLockPuzzleParam, timeLockPuzzleSnarkParam)

        // console.log(timeLockPuzzleData)

        dispatch(setProgress({ newParam: 3 }))

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

        const readyTxId = await db.readyTxs.add({
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
          dispatch,
          setCancel
        )

        dispatch(
          addPopup({
            content: {
              title: 'Transaction pending',
              status: 'pending',
              data: { readyTxId },
            },
            key: `${sendResponse.data.txOrderMsg.round}-${sendResponse.data.txOrderMsg.order}`,
            removeAfterMs: 31536000000,
          })
        )

        dispatch(setProgress({ newParam: 4 }))

        return sendResponse
      },
      split1: async function split1(): Promise<{
        signMessage: any
        timeLockPuzzleParam: TimeLockPuzzleParam
        timeLockPuzzleSnarkParam: string
        txNonce: number
        idPath: string
      }> {
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

        const signer = library.getSigner()
        const signAddress = await signer.getAddress()

        const resolvedCalls = await swapCalls
        console.log('resolvedCalls', resolvedCalls)
        const { deadline, availableFrom, amountIn, amountOut, path, idPath } = resolvedCalls[0]

        // TODO: 1 need
        const contractNonce = await routerContract.nonces(account)

        const operatorPendingTxCnt = await fetch(
          `${process.env.REACT_APP_360_OPERATOR}/tx/pendingTxCnt?chainId=${chainId}&walletAddress=${account}`
        )
        const text = await operatorPendingTxCnt.text()
        console.log('test', contractNonce, text)

        const txNonce = parseInt(contractNonce) + parseInt(text)
        console.log('test2', txNonce)

        const signMessage = {
          txOwner: signAddress,
          functionSelector: swapExactTokensForTokens,
          amountIn: `${amountIn}`,
          amountOut: `${amountOut}`,
          path,
          to: signAddress,
          nonce: txNonce,
          deadline,
          availableFrom,
        }

        sigHandler()

        return { signMessage, timeLockPuzzleParam, timeLockPuzzleSnarkParam, txNonce, idPath }
      },
      split2: async function split2(signMessage: any): Promise<{ sig: Signature }> {
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

        const now = Date.now()

        const sig = await signWithEIP712(library, signAddress, typedData)

        if (now + 10000 < Date.now()) {
          dispatch(setProgress({ newParam: 8 }))
          throw Error('error progress 8')
        }

        return { sig }
      },
      split3: async function split3(
        timeLockPuzzleParam: TimeLockPuzzleParam,
        timeLockPuzzleSnarkParam: string
      ): Promise<{ timeLockPuzzleData: TimeLockPuzzleResponse }> {
        const timeLockPuzzleData = await getTimeLockPuzzleProof(timeLockPuzzleParam, timeLockPuzzleSnarkParam)
        return { timeLockPuzzleData }
      },
      split4: async function split4(
        timeLockPuzzleData: TimeLockPuzzleResponse,
        txNonce: number,
        signMessage: any,
        idPath: string
      ): Promise<{ txHash: string; mimcHash: string; encryptedSwapTx: any }> {
        console.log('signMessage', signMessage)
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
          tx_owner: signAddress.split('x')[1],
          function_selector: swapExactTokensForTokens.split('x')[1],
          amount_in: `${signMessage.amountIn}`,
          amount_out: `${signMessage.amountOut}`,
          to: signAddress.split('x')[1],
          deadline: `${deadline}`,
          nonce: `${txNonce}`,
          path: pathToHash,
        }

        const encryptData = await poseidonEncryptWithTxHash(
          txInfoToHash,
          timeLockPuzzleData.s2_string,
          timeLockPuzzleData.s2_field_hex,
          timeLockPuzzleData.commitment_hex,
          idPath
        )

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
          availableFrom: signMessage.availableFrom,
          deadline: signMessage.deadline,
          txHash,
          mimcHash,
        }

        return { txHash, mimcHash, encryptedSwapTx }
      },
      split5: async function split5(
        txHash: string,
        mimcHash: string,
        signMessage: any,
        encryptedSwapTx: any,
        sig: Signature
      ): Promise<RadiusSwapResponse> {
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

        const readyTxId = await db.readyTxs.add({
          txHash,
          mimcHash,
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
          dispatch,
          setCancel
        )

        dispatch(
          addPopup({
            content: {
              title: 'Transaction pending',
              status: 'pending',
              data: { readyTxId },
            },
            key: `${sendResponse.data.txOrderMsg.round}-${sendResponse.data.txOrderMsg.order}`,
            removeAfterMs: 31536000000,
          })
        )

        return sendResponse
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
  setCancel: (cancel: number) => void
): Promise<RadiusSwapResponse> {
  // TODO: 2 need
  const _currentRound = parseInt((await recorderContract.currentRound()).toString())
  const doneRound = _currentRound === 0 ? 0 : _currentRound - 1
  const readyTx = await db.readyTxs.where({ txHash: encryptedSwapTx.txHash }).first()
  console.log('1')
  const sendResponse = await fetchWithTimeout(
    `${process.env.REACT_APP_360_OPERATOR}/tx`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chainId,
        // TODO: 3
        routerAddress: routerContract.address,
        encryptedSwapTx,
        signature,
      }),
    },
    10000
  )
    .then(async (res) => res.json())
    .then(async (res) => {
      console.log('1.1', res)
      console.log('json response', res, res.txOrderMsg)

      const msgHash = typedDataEncoder.hash(domain(chainId), { Claim: CLAIM_TYPE }, res.txOrderMsg)

      const verifySigner = recoverAddress(msgHash, res.signature)
      // TODO: 4
      const operatorAddress = await routerContract.operator()

      if (
        verifySigner === operatorAddress &&
        encryptedSwapTx.txHash === res.txOrderMsg.txHash &&
        encryptedSwapTx.mimcHash === res.txOrderMsg.mimcHash
      ) {
        // console.log('clear disableTxHash tx')
        console.log('txOrderMsg', res.txOrderMsg)

        await db.readyTxs.where({ id: readyTx?.id }).modify({ progressHere: 0 })
        const pendingTxId = await db.pushPendingTx(
          {
            field: 'readyTxId',
            value: readyTx?.id as number,
          },
          {
            round: parseInt(res.txOrderMsg.round),
            order: parseInt(res.txOrderMsg.order),
            proofHash: res.txOrderMsg.proofHash,
            sendDate: Math.floor(Date.now() / 1000),
            operatorSignature: res.signature,
            readyTxId: readyTx?.id as number,
            progressHere: 1,
          }
        )
        await db.pushTxHistory(
          { field: 'pendingTxId', value: parseInt(pendingTxId.toString()) },
          {
            pendingTxId: parseInt(pendingTxId.toString()),
            from: readyTx?.from as TokenAmount,
            to: readyTx?.to as TokenAmount,
            status: Status.PENDING,
          }
        )

        return {
          data: res,
          msg: "Successfully received tx's order and round",
        }
      } else {
        console.log('operator sign verify error')
        // await db.readyTxs.where({ id: readyTx?.id }).modify({ progressHere: 0 })
        // const pendingTxId = await db.pushPendingTx(
        //   {
        //     field: 'readyTxId',
        //     value: readyTx?.id as number,
        //   },
        //   {
        //     round: doneRound,
        //     order: -1,
        //     proofHash: '',
        //     sendDate: Math.floor(Date.now() / 1000),
        //     operatorSignature: { r: '', s: '', v: 27 },
        //     readyTxId: readyTx?.id as number,
        //     progressHere: 1,
        //   }
        // )
        // await db.pushTxHistory(
        //   { field: 'pendingTxId', value: parseInt(pendingTxId.toString()) },
        //   {
        //     pendingTxId: parseInt(pendingTxId.toString()),
        //     from: readyTx?.from as TokenAmount,
        //     to: readyTx?.to as TokenAmount,
        //     status: Status.PENDING,
        //   }
        // )
        // setCancel(readyTx?.id as number)

        throw new Error(`Operator answered wrong response.`)
        // return {
        //   data: res,
        //   msg: "Error: tx's order and round is invalid. let's cancel tx",
        // }
      }
    })
    .catch(async (error) => {
      console.log('1.2')
      console.log(error)

      await db.readyTxs.where({ id: readyTx?.id }).modify({ progressHere: 0 })
      const pendingTxId = await db.pushPendingTx(
        { field: 'readyTxId', value: readyTx?.id as number },
        {
          round: doneRound,
          order: -1,
          proofHash: '',
          sendDate: Math.floor(Date.now() / 1000),
          operatorSignature: { r: '', s: '', v: 27 },
          readyTxId: readyTx?.id as number,
          progressHere: 1,
        }
      )
      await db.pushTxHistory(
        { field: 'pendingTxId', value: parseInt(pendingTxId.toString()) },
        {
          pendingTxId: parseInt(pendingTxId.toString()),
          from: readyTx?.from as TokenAmount,
          to: readyTx?.to as TokenAmount,
          status: Status.PENDING,
        }
      )

      setCancel(readyTx?.id as number)

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

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
