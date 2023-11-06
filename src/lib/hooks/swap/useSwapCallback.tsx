// eslint-disable-next-line no-restricted-imports
import { BigNumber } from '@ethersproject/bignumber'
import { Signature } from '@ethersproject/bytes'
// import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from 'utils/trans'
import { Percent } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useENS from 'hooks/useENS'
import { SignatureData } from 'hooks/useERC20Permit'
import { AnyTrade, useSwapCallArguments } from 'hooks/useSwapCallArguments'
import { ReactNode, useMemo } from 'react'
import { ParameterState } from 'state/parameters/reducer'

// import { TimeLockPuzzleParam } from '../../../state/parameters/reducer'
import { TimeLockPuzzleResponse } from '../../../wasm/timeLockPuzzle'
import useSendSwapTransaction, { RadiusSwapResponse } from './useSendSwapTransaction'

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface UseSwapCallbackReturns {
  state: SwapCallbackState
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
  error?: ReactNode
}
interface UseSwapCallbackArgs {
  trade: AnyTrade | undefined // trade to execute, required
  allowedSlippage: Percent // in bips
  recipientAddressOrName: string | null | undefined // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | null | undefined
  backerIntegrity: boolean
  deadline: BigNumber | undefined
  feeOptions?: FeeOptions
  parameters: ParameterState
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback({
  trade,
  allowedSlippage,
  recipientAddressOrName,
  signatureData,
  backerIntegrity,
  deadline,
  feeOptions,
  parameters,
}: UseSwapCallbackArgs): UseSwapCallbackReturns {
  const { account, chainId, library } = useActiveWeb3React()

  const swapCalls = useSwapCallArguments(
    trade,
    allowedSlippage,
    recipientAddressOrName,
    signatureData,
    backerIntegrity,
    deadline,
    feeOptions
  )
  const { prepareSignMessage, userSign, getTimeLockPuzzle, createEncryptProof, sendEncryptedTx } =
    useSendSwapTransaction(account, chainId, library, trade, swapCalls, deadline, allowedSlippage, parameters)

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (
      !trade ||
      !library ||
      !account ||
      !chainId ||
      !prepareSignMessage ||
      !userSign ||
      !getTimeLockPuzzle ||
      !createEncryptProof ||
      !sendEncryptedTx
    ) {
      return { state: SwapCallbackState.INVALID, error: <Trans>Missing dependencies</Trans> }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, error: <Trans>Invalid recipient</Trans> }
      } else {
        return { state: SwapCallbackState.LOADING }
      }
    }

    return {
      state: SwapCallbackState.VALID,
      prepareSignMessage: async (a: any, b: any) => prepareSignMessage(a, b),
      userSign: async (a: any) => userSign(a),
      getTimeLockPuzzle: async () => getTimeLockPuzzle(),
      createEncryptProof: async (a: any, b: any, c: any, d: any) => createEncryptProof(a, b, c, d),
      sendEncryptedTx: async (a: any, b: any, c: any, d: any, e: any, f: any) => sendEncryptedTx(a, b, c, d, e, f),
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName])
}
