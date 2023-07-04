import { useCallback, useContext } from 'react'
import { Contract } from '@ethersproject/contracts'
import { Signature } from '@ethersproject/bytes'
import SwapContext from '../../store/swap-context'

export const usePrepareSignMessageFunc = (
  prepareSignMessage:
    | ((
        backerIntegrity: boolean,
        nonce: string
      ) => Promise<{
        signMessage: any
        txNonce: number
        idPath: string
      }>)
    | undefined,
  routerContract: Contract,
  account: string | null | undefined,
  backerIntegrity: true
) => {
  const swapCTX = useContext(SwapContext)

  const { updateSwapParams, handleLeftSection, handleSwapParams, swapParams } = swapCTX

  const prepareSignFunc = useCallback(async () => {
    if (prepareSignMessage) {
      routerContract
        .nonces(account)
        .then(async (contractNonce: any) => {
          routerContract
            .operator()
            .then(async (operatorAddress: any) => {
              const res = await prepareSignMessage(backerIntegrity, contractNonce)
              updateSwapParams({ prepareDone: true, ...res, operatorAddress })
            })
            .catch(() => {
              handleLeftSection('welcome')
              handleSwapParams({
                start: false,
                errorMessage: 'RPC server is not responding, please try again',
              })
            })
        })
        .catch(() => {
          handleLeftSection('welcome')
          handleSwapParams({
            start: false,
            errorMessage: 'RPC server is not responding, please try again',
          })
        })
    }
  }, [prepareSignMessage, swapParams, account, routerContract, backerIntegrity])
  return prepareSignFunc
}

export const useUserSignFunc = (
  userSign:
    | ((signMessage: any) => Promise<{
        sig: Signature
      } | null>)
    | undefined,
  signMessage: any
) => {
  const swapCTX = useContext(SwapContext)

  const { updateSwapParams, handleLeftSection, swapParams } = swapCTX

  const userSignFunc = useCallback(async () => {
    if (userSign) {
      const res = await userSign(signMessage)
      if (res) {
        updateSwapParams({ signingDone: true, ...res })
        handleLeftSection('progress')
      } else {
        updateSwapParams({ start: false })
      }
    }
  }, [userSign, swapParams])
  return userSignFunc
}
