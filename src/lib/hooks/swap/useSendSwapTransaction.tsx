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
import localForage from 'localforage'
import { useMemo } from 'react'
import { useAppDispatch } from 'state/hooks'
import { fetchVdfParam, fetchVdfSnarkParam } from 'state/parameters/fetch'
import { ParameterState, setProgress, setVdfParam, setVdfSnarkParam, VdfParam } from 'state/parameters/reducer'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'
import { poseidonEncryptWithTxHash } from 'wasm/encrypt'
import { getVdfProof } from 'wasm/vdf'

import { useV2RouterContract } from '../../../hooks/useContract'
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
  available_from: string
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
  vdf_snark_proof: string
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
): { callback: null | (() => Promise<RadiusSwapResponse>) } {
  // console.log(parameters)
  const dispatch = useAppDispatch()

  const routerContract = useV2RouterContract() as Contract
  // const recorderContract = useRecorderContract() as Contract

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { callback: null }
    }
    return {
      callback: async function onSwap(): Promise<RadiusSwapResponse> {
        let vdfParam: VdfParam | null = await localForage.getItem('vdf_param')
        let vdfSnarkParam: string | null = await localForage.getItem('vdf_snark_param')

        // if save flag is false or getItem result is null
        if (!parameters.vdfParam || !vdfParam) {
          vdfParam = await fetchVdfParam((newParam: boolean) => {
            dispatch(setVdfParam({ newParam }))
          })
        }

        if (!parameters.vdfSnarkParam || !vdfSnarkParam) {
          vdfSnarkParam = await fetchVdfSnarkParam((newParam: boolean) => {
            dispatch(setVdfSnarkParam({ newParam }))
          })
        }

        const resolvedCalls = await swapCalls
        const { address, availableFrom, deadline, amountIn, amountOut, path, idPath } = resolvedCalls[0]

        const signer = library.getSigner()
        const signAddress = await signer.getAddress()

        // TODO: 한 round에 2개의 tx를 날리면 contract에서 가져오지 않고 nonce값을 ++ 해야 한다.
        // const _txNonce = await routerContract.nonces(signAddress)
        // const txNonce = BigNumber.from(_txNonce).toNumber()

        const _txNonce = window.localStorage.getItem('nonce')
        const txNonce = !_txNonce ? 0 : BigNumber.from(_txNonce).toNumber()

        // console.log('nonce from contract', txNonce)

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
          available_from: `${availableFrom}`,
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

        dispatch(setProgress({ newParam: 1 }))

        const vdfData = await getVdfProof(vdfParam, vdfSnarkParam)

        // console.log(vdfData)

        dispatch(setProgress({ newParam: 2 }))

        const encryptData = await poseidonEncryptWithTxHash(
          txInfoToHash,
          vdfData.s2_string,
          vdfData.s2_field_hex,
          vdfData.commitment_hex,
          idPath
        )

        // console.log(encryptData)

        dispatch(setProgress({ newParam: 3 }))

        const encryptedPath = {
          message_length: encryptData.message_length,
          nonce: encryptData.nonce,
          commitment: vdfData.commitment_hex,
          cipher_text: [encryptData.cipher_text],
          r1: vdfData.r1,
          r3: vdfData.r3,
          s1: vdfData.s1,
          s3: vdfData.s3,
          k: vdfData.k,
          vdf_snark_proof: vdfData.vdf_snark_proof,
          encryption_proof: encryptData.proof,
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

        await db.pendingTxs.add({
          txHash,
          mimcHash: '0x' + encryptData.tx_id,
          tx: signMessage,
          sendDate: Date.now() / 1000,
        })

        window.localStorage.setItem('nonce', (txNonce + 1).toString())

        const sendResponse = await sendEIP712Tx(chainId, routerContract, encryptedSwapTx, sig, library)

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

async function sendEIP712Tx(
  chainId: number,
  routerContract: Contract,
  encryptedSwapTx: EncryptedSwapTx,
  signature: Signature,
  library: JsonRpcProvider | undefined
): Promise<RadiusSwapResponse> {
  const sendResponse = await fetchWithTimeout(
    `${process.env.REACT_APP_360_OPERATOR}/tx`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chainId,
        routerAddress: routerContract.address,
        encryptedSwapTx,
        signature: {
          r: `${signature.r}`,
          s: `${signature.s}`,
          v: `${signature.v}`,
        },
      }),
    },
    2000
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

        // window.localStorage.setItem(res.txOrderMsg.txHash, JSON.stringify({ txOrderMsg: res.txOrderMsg, signature }))
        await db.pendingTxs
          .where({ txHash: encryptedSwapTx.txHash, mimcHash: encryptedSwapTx.mimcHash })
          .modify({ ...res.txOrderMsg, signature })

        return {
          data: res,
          msg: "Successfully received tx's order and round",
        }
      } else {
        return {
          data: res,
          msg: "Error: tx's order and round is invalid. let's cancel tx",
        }
      }
    })
    .catch((error) => {
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
