import { BigNumber } from '@ethersproject/bignumber'
import { Signature, splitSignature } from '@ethersproject/bytes'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { domain, DOMAIN_TYPE, SWAP_TYPE } from 'constants/eip712'
import { solidityKeccak256 } from 'ethers/lib/utils'
import { SwapCall } from 'hooks/useSwapCallArguments'
import localForage from 'localforage'
import { useMemo } from 'react'
import { useAppDispatch } from 'state/hooks'
import {
  ParameterState,
  setEncryptionParam,
  setEncryptionProverKey,
  setEncryptionVerifierData,
  setProgress,
  setVdfParam,
  setVdfSnarkParam,
  VdfParam,
} from 'state/parameters/reducer'
import { swapErrorToUserReadableMessage } from 'utils/swapErrorToUserReadableMessage'

type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

interface EncryptResponse {
  message_length: number
  cipher_text: string
  proof: string
  nonce: string
}

interface VdfResponse {
  r1: string
  r3: string
  s1: string
  s3: string
  k: string
  vdf_snark_proof: string
  s2_string: string
  s2_field_hex: string
  commitment_hex: string
}

interface EncryptedTx {
  txOwner: string
  amountIn: string
  amountOutMin: string
  path: Path
  to: string
  deadline: number
  txId: string
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
  encryptedTx: EncryptedTx
}

export interface RadiusSwapResponse {
  data: {
    round: number
    order: number
    mmr_size: number
    proof: string[]
    hash: string
  }
  msg: string
}

const headers = new Headers({ 'content-type': 'application/json', accept: 'application/json' })

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
  const dispatch = useAppDispatch()

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { callback: null }
    }
    return {
      callback: async function onSwap(): Promise<RadiusSwapResponse> {
        let vdfParam: VdfParam | null = await localForage.getItem('vdf_param')
        let vdfSnarkParam: string | null = await localForage.getItem('vdf_snark_param')
        let encryptionParam: string | null = await localForage.getItem('encryption_param')
        let encryptionProverKey: string | null = await localForage.getItem('encryption_prover_key')
        let encryptionVerifierData: string | null = await localForage.getItem('encryption_verifier_data')

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

        if (!parameters.encryptionParam || !encryptionParam) {
          encryptionParam = await fetchEncryptionParam((newParam: boolean) => {
            dispatch(setEncryptionParam({ newParam }))
          })
        }

        if (!parameters.encryptionProverKey || !encryptionProverKey) {
          encryptionProverKey = await fetchEncryptionProverKey((newParam: boolean) => {
            dispatch(setEncryptionProverKey({ newParam }))
          })
        }

        if (!parameters.encryptionVerifierData || !encryptionVerifierData) {
          encryptionVerifierData = await fetchEncryptionVerifierData((newParam: boolean) => {
            dispatch(setEncryptionVerifierData({ newParam }))
          })
        }

        const resolvedCalls = await swapCalls
        const { address, deadline, amountIn, amountoutMin, path } = resolvedCalls[0]

        const signer = library.getSigner()
        const signAddress = await signer.getAddress()

        const signMessage = {
          txOwner: signAddress,
          amountIn: `${amountIn}`,
          amountOutMin: `${amountoutMin}`,
          path,
          to: signAddress,
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

        dispatch(setProgress({ newParam: 1 }))

        const sig = await signWithEIP712(library, signAddress, typedData)

        console.log(sig)

        sigHandler()

        dispatch(setProgress({ newParam: 2 }))

        // const vdfData = await getVdfProof(parameters.vdfParam || vdfParam, parameters.vdfSnarkParam || vdfSnarkParam)
        const vdfData = await getVdfProof(vdfParam, vdfSnarkParam)

        console.log(vdfData)

        dispatch(setProgress({ newParam: 3 }))

        console.log(
          encryptionParam,
          encryptionProverKey,
          encryptionVerifierData,
          vdfData.s2_string,
          vdfData.s2_field_hex,
          vdfData.commitment_hex,
          `${path[0]},${path[1]}`
        )

        const encryptData = await poseidonEncrypt(
          encryptionParam,
          encryptionProverKey,
          encryptionVerifierData,
          vdfData.s2_string,
          vdfData.s2_field_hex,
          vdfData.commitment_hex,
          `${path[0]},${path[1]}`
        )

        console.log(encryptData)

        dispatch(setProgress({ newParam: 4 }))

        const txId = solidityKeccak256(
          ['address', 'uint256', 'uint256', 'address[]', 'address', 'uint256'],
          [account.toLowerCase(), `${amountIn}`, `${amountoutMin}`, path, account.toLowerCase(), `${deadline}`]
        )

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

        const encryptedTx: EncryptedTx = {
          txOwner: signAddress,
          amountIn: `${amountIn}`,
          amountOutMin: `${amountoutMin}`,
          path: encryptedPath,
          to: signAddress,
          deadline,
          txId,
        }

        const sendResponse = await sendEIP712Tx(address, encryptedTx, sig)

        dispatch(setProgress({ newParam: 5 }))

        const finalResponse: RadiusSwapResponse = {
          data: sendResponse.data,
          msg: sendResponse.msg,
        }
        return finalResponse
      },
    }
  }, [trade, library, account, chainId, parameters, swapCalls, sigHandler, dispatch])
}

async function fetchVdfParam(callback: (res: boolean) => void): Promise<VdfParam> {
  return await fetch('/parameters/vdf_zkp_parameter.data.bin', {
    method: 'GET',
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res)
      localForage.setItem('vdf_param', res)
      callback(true)
      return res
    })
}

async function fetchVdfSnarkParam(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/vdf_zkp_snark_parameter.data.bin', {
    method: 'GET',
  }).then(async (res) => {
    const bytes = await res.arrayBuffer()
    const uint8bytes = new Uint8Array(bytes)
    const string = Buffer.from(uint8bytes).toString('hex')
    localForage.setItem('vdf_snark_param', string)
    callback(true)
    return string
  })
}

async function fetchEncryptionParam(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/encryption_zkp_parameter.data.bin', {
    method: 'GET',
  }).then(async (res) => {
    const bytes = await res.arrayBuffer()
    const uint8bytes = new Uint8Array(bytes)
    const string = Buffer.from(uint8bytes).toString('hex')
    localForage.setItem('encryption_param', string)
    callback(true)
    return string
  })
}

async function fetchEncryptionProverKey(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/encryption_prover_key.data.bin', {
    method: 'GET',
  }).then(async (res) => {
    const bytes = await res.arrayBuffer()
    const uint8bytes = new Uint8Array(bytes)
    const string = Buffer.from(uint8bytes).toString('hex')
    localForage.setItem('encryption_prover_key', string)
    callback(true)
    return string
  })
}

async function fetchEncryptionVerifierData(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/encryption_verifier_data.data.bin', {
    method: 'GET',
  }).then(async (res) => {
    const bytes = await res.arrayBuffer()
    const uint8bytes = new Uint8Array(bytes)
    const string = Buffer.from(uint8bytes).toString('hex')
    localForage.setItem('encryption_verifier_data', string)
    callback(true)
    return string
  })
}

async function signWithEIP712(library: JsonRpcProvider, signAddress: string, typedData: string): Promise<Signature> {
  console.log(signAddress, typedData)
  const signer = library.getSigner()
  const sig = await signer.provider
    .send('eth_signTypedData_v4', [signAddress, typedData])
    .then((response) => {
      console.log(response)
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

async function getVdfProof(vdfParam: VdfParam, vdfSnarkParam: string): Promise<VdfResponse> {
  console.log('CALL WASM!', vdfParam, vdfSnarkParam)
  const vdf = await import('wasm-vdf-zkp')
  const data = await vdf
    .get_vdf_proof(vdfParam, vdfSnarkParam)
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return data
}

async function poseidonEncrypt(
  param: string,
  proverKey: string,
  verifierData: string,
  s2_string: string,
  s2_field_hex: string,
  commitment: string,
  plainText: string
): Promise<EncryptResponse> {
  console.log(s2_string, commitment, plainText)
  const poseidon = await import('wasm-encryptor-zkp')
  const data = await poseidon
    .encrypt(param, proverKey, verifierData, s2_string, s2_field_hex, commitment, plainText)
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return data
}

async function sendEIP712Tx(
  routerAddress: string,
  encryptedTx: EncryptedTx,
  signature: Signature
): Promise<RadiusSwapResponse> {
  const sendResponse = await fetch('http://147.46.240.248:40002/txs/send/EIP712Tx', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      txType: 'swap',
      routerAddress,
      encryptedTx,
      signature: {
        r: `${signature.r}`,
        s: `${signature.s}`,
        v: `${signature.v}`,
      },
    }),
  })
    .then((res) => res.json())
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      throw new Error(`Send failed: ${swapErrorToUserReadableMessage(error)}`)
    })

  return sendResponse
}
