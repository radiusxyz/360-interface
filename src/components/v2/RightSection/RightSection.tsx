import { MainWrapper } from './RightSectionStyles'

// import { Contract } from '@ethersproject/contracts'
// import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'

// import { domain, SWAP_TYPE } from 'constants/eip712'
// import useActiveWeb3React from 'hooks/useActiveWeb3React'
// import { useSwapCallback } from 'hooks/useSwapCallback'
// import useTransactionDeadline from 'hooks/useTransactionDeadline'
// import { useAppDispatch } from 'state/hooks'
// import { useParameters } from 'state/parameters/hooks'
// import localForage from 'localforage'
// import { useCallback, useEffect, useMemo, useRef } from 'react'
// import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
// import { setTimeLockPuzzleParam, setTimeLockPuzzleSnarkParam, TimeLockPuzzleParam } from 'state/parameters/reducer'
// import Worker from 'worker-loader!workers/worker'

// import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
// import { useV2RouterContract } from 'hooks/useContract'
// import { useERC20PermitFromTrade } from 'hooks/useERC20Permit'
// import { TxInfo } from 'lib/hooks/swap/useSendSwapTransaction'
// import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo } from 'state/swap/hooks'

// import { useContext } from 'react'
// import SwapContext from 'store/swap-context'

// eslint-disable-next-line import/no-webpack-loader-syntax

export const RightSection = () => {
  // TODO: add this to check account in whitelist

  // const [swapParams, setSwapParams] = useState<any>({ start: false })

  // TODO:

  // swap state

  const trade = useDerivedSwapInfo()

  /* 
  useEffect(() => {
    console.log(1)
  }, [currencyBalances]) 
  */

  // const trade1 = useMemo(() => {
  //   return () => useDerivedSwapInfo
  // }, [])

  // console.log(trade1)
  // const { onUserInput } = useSwapActionHandlers()

  ///////////////////////////////
  // approve
  ///////////////////////////////
  // const approvalOptimizedTrade = useApprovalOptimizedTrade(trade, allowedSlippage)

  // check whether the user has approved the router on the input token
  // const [approvalState, approveCallback] = useApproveCallbackFromTrade(approvalOptimizedTrade, allowedSlippage)
  // const transactionDeadline = useTransactionDeadline()
  // const { signatureData } = useERC20PermitFromTrade(approvalOptimizedTrade, allowedSlippage, transactionDeadline)

  ///////////////////////////////
  // Check Account in Whitelist
  ///////////////////////////////
  // useEffect(() => {
  //   if (account) {
  //     fetch(`${process.env.REACT_APP_360_OPERATOR}/whiteList?walletAddress=` + account)
  //       .then(async (is) => {
  //         const val = await is.text()
  //         if (val === 'false') setAccountWhiteList(false)
  //         else setAccountWhiteList(true)
  //       })
  //       .catch((e) => console.error(e))
  //   }
  // }, [account, swapCTX.swapParams])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  // useEffect(() => {
  //   if (approvalState === ApprovalState.PENDING) {
  //     setApprovalSubmitted(true)
  //   }
  // }, [approvalState, approvalSubmitted])

  // the callback to execute the swap
  // const {
  //   error: swapCallbackError,
  //   prepareSignMessage,
  //   userSign,
  //   createEncryptProof,
  //   sendEncryptedTx,
  // } = useSwapCallback(
  //   approvalOptimizedTrade,
  //   allowedSlippage,
  //   backerIntegrity, //backer integrity
  //   recipient,
  //   signatureData,
  //   parameters
  // )

  // const dispatch = useAppDispatch()

  ///////////////////////////////
  // parameter loading
  ///////////////////////////////
  /*   const getTimeLockPuzzleParam = useCallback(async () => {
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

  ///////////////////////////////
  // worker
  ///////////////////////////////
  const worker = useMemo(() => new Worker(), [])

  const isPuzzling = useRef<boolean>(false)
  useEffect(() => {
    if (!swapCTX.swapParams.timeLockPuzzleData && !isPuzzling.current) {
      isPuzzling.current = true
      getTimeLockPuzzleParam().then((res) => {
        worker.postMessage({
          target: 'timeLockPuzzle',
          timeLockPuzzleParam: res.timeLockPuzzleParam,
          timeLockPuzzleSnarkParam: res.timeLockPuzzleSnarkParam,
        })
      })
    }
  }, [getTimeLockPuzzleParam, swapCTX.swapParams.timeLockPuzzleData, worker]) */

  // worker.onmessage = (e: MessageEvent<any>) => {
  //   if (e.data.target === 'timeLockPuzzle') {
  //     swapCTX.updateSwapParams({ timeLockPuzzleDone: true, timeLockPuzzleData: { ...e.data.data } })
  //     isPuzzling.current = false
  //   }
  //   if (
  //     e.data.target === 'encryptor' &&
  //     account &&
  //     chainId &&
  //     swapCTX.swapParams.timeLockPuzzleData &&
  //     swapCTX.swapParams.signMessage
  //   ) {
  //     const encryptData = e.data.data

  //     const encryptedPath = {
  //       message_length: encryptData.message_length,
  //       nonce: encryptData.nonce,
  //       commitment: swapCTX.swapParams.timeLockPuzzleData.commitment_hex,
  //       cipher_text: [encryptData.cipher_text],
  //       r1: swapCTX.swapParams.timeLockPuzzleData.r1,
  //       r3: swapCTX.swapParams.timeLockPuzzleData.r3,
  //       s1: swapCTX.swapParams.timeLockPuzzleData.s1,
  //       s3: swapCTX.swapParams.timeLockPuzzleData.s3,
  //       k: swapCTX.swapParams.timeLockPuzzleData.k,
  //       time_lock_puzzle_snark_proof: swapCTX.swapParams.timeLockPuzzleData.time_lock_puzzle_snark_proof,
  //       encryption_proof: encryptData.proof,
  //     }

  //     const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, swapCTX.swapParams.signMessage)
  //     const mimcHash = '0x' + encryptData.tx_id

  //     const encryptedSwapTx: EncryptedSwapTx = {
  //       txOwner: account,
  //       functionSelector: swapExactTokensForTokens,
  //       amountIn: `${swapCTX.swapParams.signMessage.amountIn}`,
  //       amountOut: `${swapCTX.swapParams.signMessage.amountOut}`,
  //       path: encryptedPath,
  //       to: account,
  //       nonce: swapCTX.swapParams.txNonce,
  //       backerIntegrity: swapCTX.swapParams.signMessage.backerIntegrity,
  //       availableFrom: swapCTX.swapParams.signMessage.availableFrom,
  //       deadline: swapCTX.swapParams.signMessage.deadline,
  //       txHash,
  //       mimcHash,
  //     }

  //     swapCTX.updateSwapParams({ encryptorDone: true, txHash, mimcHash, encryptedSwapTx })

  //     isEncrypting.current = false
  //   }
  // }

  ///////////////////////////////
  // declare process functions
  ///////////////////////////////
  // const prepareSignMessageFunc = useCallback(async () => {
  //   if (prepareSignMessage) {
  //     routerContract
  //       .nonces(account)
  //       .then(async (contractNonce: any) => {
  //         routerContract
  //           .operator()
  //           .then(async (operatorAddress: any) => {
  //             const res = await prepareSignMessage(backerIntegrity, contractNonce)
  //             swapCTX.updateSwapParams({ prepareDone: true, ...res, operatorAddress })
  //           })
  //           .catch(() => {
  //             swapCTX.handleLeftSection('welcome')
  //             swapCTX.handleSwapParams({
  //               start: false,
  //               errorMessage: 'RPC server is not responding, please try again',
  //             })
  //           })
  //       })
  //       .catch(() => {
  //         swapCTX.handleLeftSection('welcome')
  //         swapCTX.handleSwapParams({
  //           start: false,
  //           errorMessage: 'RPC server is not responding, please try again',
  //         })
  //       })
  //   }
  // }, [prepareSignMessage, swapCTX.swapParams, account, routerContract, backerIntegrity])

  // const createEncryptProofFunc = useCallback(async () => {
  //   if (chainId && swapCTX.swapParams.signMessage) {
  //     if (swapCTX.swapParams.signMessage.path.length > 3) {
  //       console.error('Cannot encrypt path which length is over 3')
  //     }

  //     const pathToHash: string[] = new Array(MAXIMUM_PATH_LENGTH)

  //     for (let i = 0; i < MAXIMUM_PATH_LENGTH; i++) {
  //       pathToHash[i] =
  //         i < swapCTX.swapParams.signMessage.path.length ? swapCTX.swapParams.signMessage.path[i].split('x')[1] : '0'
  //     }

  //     const txInfoToHash: TxInfo = {
  //       tx_owner: swapCTX.swapParams.signMessage.txOwner.split('x')[1],
  //       function_selector: swapCTX.swapParams.signMessage.functionSelector.split('x')[1],
  //       amount_in: `${swapCTX.swapParams.signMessage.amountIn}`,
  //       amount_out: `${swapCTX.swapParams.signMessage.amountOut}`,
  //       to: swapCTX.swapParams.signMessage.to.split('x')[1],
  //       deadline: `${swapCTX.swapParams.signMessage.deadline}`,
  //       nonce: `${swapCTX.swapParams.signMessage.nonce}`,
  //       path: pathToHash,
  //     }

  //     worker.postMessage({
  //       target: 'encryptor',
  //       txInfoToHash,
  //       s2_string: swapCTX.swapParams.timeLockPuzzleData.s2_string,
  //       s2_field_hex: swapCTX.swapParams.timeLockPuzzleData.s2_field_hex,
  //       commitment_hex: swapCTX.swapParams.timeLockPuzzleData.commitment_hex,
  //       idPath: swapCTX.swapParams.idPath,
  //     })
  //   }
  // }, [swapCTX.swapParams, chainId, worker])

  // const userSignFunc = useCallback(async () => {
  //   if (userSign) {
  //     const res = await userSign(swapCTX.swapParams.signMessage)
  //     if (res) {
  //       swapCTX.updateSwapParams({ signingDone: true, ...res })
  //       swapCTX.handleLeftSection('progress')
  //     } else {
  //       swapCTX.updateSwapParams({ confirm: false })
  //     }
  //   }
  // }, [userSign, swapCTX.swapParams])

  // const sendEncryptedTxFunc = useCallback(async () => {
  //   if (sendEncryptedTx) {
  //     sendEncryptedTx(
  //       swapCTX.swapParams.txHash,
  //       swapCTX.swapParams.mimcHash,
  //       swapCTX.swapParams.signMessage,
  //       swapCTX.swapParams.encryptedSwapTx,
  //       swapCTX.swapParams.sig,
  //       swapCTX.swapParams.operatorAddress
  //     )
  //       .then(async (res) => {
  //         onUserInput(Field.INPUT, '')
  //         swapCTX.updateSwapParams({ sent: true })
  //         // swapCTX.handleLeftSection('welcome')
  //         // swapCTX.handleSwapParams({ start: false })
  //       })
  //       .catch(async (e) => {
  //         console.error(e)
  //         onUserInput(Field.INPUT, '')
  //         swapCTX.handleLeftSection('welcome')
  //         swapCTX.handleSwapParams({ start: false })
  //       })
  //   }
  // }, [sendEncryptedTx, onUserInput, swapCTX.swapParams])

  ///////////////////////////////
  // swap processing
  ///////////////////////////////
  // const isPreparing = useRef<boolean>(false)
  // useEffect(() => {
  //   if (
  //     prepareSignMessageFunc !== null &&
  //     !isPreparing.current &&
  //     swapCTX.swapParams.start &&
  //     !swapCTX.swapParams.prepareDone
  //   ) {
  //     isPreparing.current = true
  //     prepareSignMessageFunc().then(() => {
  //       isPreparing.current = false
  //     })
  //   }
  // }, [prepareSignMessageFunc, swapCTX.swapParams.start, swapCTX.swapParams.prepareDone])

  // const isEncrypting = useRef<boolean>(false)
  // useEffect(() => {
  //   if (
  //     createEncryptProofFunc !== null &&
  //     !isEncrypting.current &&
  //     swapCTX.swapParams.timeLockPuzzleDone &&
  //     swapCTX.swapParams.prepareDone &&
  //     !swapCTX.swapParams.encryptorDone
  //   ) {
  //     isEncrypting.current = true
  //     createEncryptProofFunc()
  //   }
  // }, [swapCTX.swapParams, createEncryptProofFunc, createEncryptProof])

  // const isSigning = useRef(false)
  // useEffect(() => {
  //   if (
  //     !isSigning.current &&
  //     swapCTX.swapParams.prepareDone &&
  //     swapCTX.swapParams.confirm &&
  //     !swapCTX.swapParams.signingDone
  //   ) {
  //     isSigning.current = true
  //     swapCTX.handleLeftSection('almost-there')
  //     userSignFunc().then(() => {
  //       isSigning.current = false
  //     })
  //   }
  // }, [swapCTX.swapParams, userSignFunc])

  // const isSending = useRef<boolean>(false)
  // useEffect(() => {
  //   if (!isSending.current && swapCTX.swapParams.encryptorDone && swapCTX.swapParams.signingDone) {
  //     isSending.current = true
  //     console.log('sendEncryptedTxFunc')
  //     sendEncryptedTxFunc().then(() => {
  //       isSending.current = false
  //     })
  //   }
  // }, [swapCTX.swapParams, sendEncryptedTxFunc])

  // TODO: price impact dangerous level

  // useEffect(() => {
  //   if (swapCTX.isAtokenSelectionActive || swapCTX.isBtokenSelectionActive) {
  //     swapCTX.handleLeftSection('search-table')
  //   }
  // }, [swapCTX.isAtokenSelectionActive, swapCTX.isBtokenSelectionActive, swapCTX.handleLeftSection])

  return <MainWrapper></MainWrapper>
}

export default RightSection
