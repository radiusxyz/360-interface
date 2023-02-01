// eslint-disable-next-line no-restricted-imports
// import { TransactionResponse } from '@ethersproject/providers'
import { Signature } from '@ethersproject/bytes'
import { Percent } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { SwapCallbackState, useSwapCallback as useLibSwapCallBack } from 'lib/hooks/swap/useSwapCallback'
import { ReactNode, useMemo } from 'react'
import { ParameterState } from 'state/parameters/reducer'
import { TimeLockPuzzleParam } from 'state/parameters/reducer'

import { TimeLockPuzzleResponse } from '../wasm/timeLockPuzzle'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'
import { AnyTrade } from './useSwapCallArguments'
import useTransactionDeadline from './useTransactionDeadline'

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: AnyTrade | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  backerIntegrity: boolean,
  recipientAddressOrName: string | null, // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
  signatureData: SignatureData | undefined | null,
  sigHandler: () => void,
  parameters: ParameterState
): {
  state: SwapCallbackState
  callback: null | (() => Promise<RadiusSwapResponse>)
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
  error: ReactNode | null
} {
  const { account } = useActiveWeb3React()

  const deadline = useTransactionDeadline()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  const {
    state,
    callback: libCallback,
    split1,
    split2,
    split3,
    split4,
    split5,
    error,
  } = useLibSwapCallBack({
    trade,
    allowedSlippage,
    recipientAddressOrName: recipient,
    signatureData,
    backerIntegrity,
    deadline,
    sigHandler,
    parameters,
  })

  const callback = useMemo(() => {
    if (!libCallback || !trade) {
      return null
    }
    return () =>
      libCallback().then((response) => {
        return response
      })
  }, [libCallback, trade])

  return {
    state,
    callback,
    split1,
    split2,
    split3,
    split4,
    split5,
    error,
  }
}
