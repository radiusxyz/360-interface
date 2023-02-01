// eslint-disable-next-line no-restricted-imports
import { BigNumber } from '@ethersproject/bignumber'
import { Signature } from '@ethersproject/bytes'
// import { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useENS from 'hooks/useENS'
import { SignatureData } from 'hooks/useERC20Permit'
import { AnyTrade, useSwapCallArguments } from 'hooks/useSwapCallArguments'
import { ReactNode, useMemo } from 'react'
import { ParameterState } from 'state/parameters/reducer'

import { TimeLockPuzzleParam } from '../../../state/parameters/reducer'
import { TimeLockPuzzleResponse } from '../../../wasm/timeLockPuzzle'
import useSendSwapTransaction, { RadiusSwapResponse } from './useSendSwapTransaction'

export enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface UseSwapCallbackReturns {
  state: SwapCallbackState
  callback?: () => Promise<RadiusSwapResponse>
  split1?: (
    backerIntegrity: boolean,
    nonce: string
  ) => Promise<{
    signMessage: any
    timeLockPuzzleParam: TimeLockPuzzleParam
    timeLockPuzzleSnarkParam: string
    txNonce: number
    idPath: string
  }>
  split2?: (signMessage: any) => Promise<{ sig: Signature } | null>
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
    sig: Signature,
    operatorAddress: string
  ) => Promise<RadiusSwapResponse>
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
  sigHandler: () => void
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
  sigHandler,
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
  const { callback, split1, split2, split3, split4, split5 } = useSendSwapTransaction(
    account,
    chainId,
    library,
    trade,
    swapCalls,
    deadline,
    allowedSlippage,
    parameters,
    sigHandler
  )

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (
      !trade ||
      !library ||
      !account ||
      !chainId ||
      !callback ||
      !split1 ||
      !split2 ||
      !split3 ||
      !split4 ||
      !split5
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
      callback: async () => callback(),
      split1: async (a: any, b: any) => split1(a, b),
      split2: async (a: any) => split2(a),
      split3: async (a: any, b: any) => split3(a, b),
      split4: async (a: any, b: any, c: any, d: any) => split4(a, b, c, d),
      split5: async (a: any, b: any, c: any, d: any, e: any, f: any) => split5(a, b, c, d, e, f),
    }
  }, [trade, library, account, chainId, callback, recipient, recipientAddressOrName])
}
