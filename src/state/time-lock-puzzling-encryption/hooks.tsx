import Worker from 'worker-loader!workers/worker'
import { useCallback, useEffect } from 'react'
import { TxInfo } from '../../lib/hooks/swap/useSendSwapTransaction'

import {
  setTimeLockPuzzleParam,
  setTimeLockPuzzleSnarkParam,
  TimeLockPuzzleParam,
} from '../../state/parameters/reducer'
import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from '../../state/parameters/fetch'
import { useAppDispatch, useAppSelector } from '../../state/hooks'
import localForage from 'localforage'
import { Field } from '../../state/swap/actions'

///////////////////////////////
// parameter loading
///////////////////////////////

export const useGetTimeLockPuzzleParam = () => {
  const dispatch = useAppDispatch()
  const parameters = useAppSelector((state) => state.parameters)

  const getTimeLockPuzzleParam = useCallback(async () => {
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

    return { timeLockPuzzleParam, timeLockPuzzleSnarkParam }
  }, [dispatch, parameters.timeLockPuzzleParam, parameters.timeLockPuzzleSnarkParam])
  return getTimeLockPuzzleParam()
}

///////////////////////////////
// Create a zk proof for time-lock puzzle validity
///////////////////////////////

export const useCreateEncryptProofFunc = (
  chainId: number | undefined,
  signMessage: any,
  MAXIMUM_PATH_LENGTH: number,
  worker: Worker,
  timeLockPuzzleData: any,
  idPath: any,
  swapParams: any
) => {
  const createEncryptProofFunc = useCallback(async () => {
    if (chainId && signMessage) {
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

      worker.postMessage({
        target: 'encryptor',
        txInfoToHash,
        s2_string: timeLockPuzzleData.s2_string,
        s2_field_hex: timeLockPuzzleData.s2_field_hex,
        commitment_hex: timeLockPuzzleData.commitment_hex,
        idPath,
      })
    }
  }, [swapParams, chainId, worker])
  return createEncryptProofFunc
}

///////////////////////////////
// Create a function for sending the encrypted transaction to the operator
///////////////////////////////

export const useSendEncryptedTxFunc = (
  sendEncryptedTx: any,
  txHash: any,
  mimcHash: any,
  signMessage: any,
  encryptedSwapTx: any,
  sig: any,
  operatorAddress: any,
  onUserInput: (field: Field, typedValue: string) => void,
  updateSwapParams: any,
  fieldInput: Field,
  handleLeftSection: any,
  handleSwapParams: any,
  swapParams: any
) => {
  const sendEncryptedTxFunc = useCallback(async () => {
    if (sendEncryptedTx) {
      sendEncryptedTx(txHash, mimcHash, signMessage, encryptedSwapTx, sig, operatorAddress)
        .then(async () => {
          onUserInput(fieldInput, '')
          updateSwapParams({ sent: true })
          // handleLeftSection('welcome')
          // handleSwapParams({ start: false })
        })
        .catch(async () => {
          onUserInput(fieldInput, '')
          handleLeftSection('welcome')
          handleSwapParams({ start: false })
        })
    }
  }, [sendEncryptedTx, onUserInput, swapParams])
  return sendEncryptedTxFunc
}

export function useMakeTimeLockPuzzle(
  isPuzzling: React.MutableRefObject<boolean>,
  timeLockPuzzleData: any,
  timeLockPuzzleParams: any,
  worker: Worker
) {
  // If there is no timeLockPuzzleData or currently not being made, then  start making it
  useEffect(() => {
    if (!timeLockPuzzleData && !isPuzzling.current) {
      isPuzzling.current = true
      worker.postMessage({
        target: 'timeLockPuzzle',
        timeLockPuzzleParam: timeLockPuzzleParams.timeLockPuzzleParam,
        timeLockPuzzleSnarkParam: timeLockPuzzleParams.timeLockPuzzleSnarkParam,
      })
    }
  }, [timeLockPuzzleParams, timeLockPuzzleData, worker])
}
