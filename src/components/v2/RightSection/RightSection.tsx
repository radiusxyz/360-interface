import { Contract } from '@ethersproject/contracts'
import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'

import { domain, SWAP_TYPE } from 'constants/eip712'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParameters } from 'state/parameters/hooks'

import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useV2RouterContract } from 'hooks/useContract'
import { useERC20PermitFromTrade } from 'hooks/useERC20Permit'
import { EncryptedSwapTx, TxInfo } from 'lib/hooks/swap/useSendSwapTransaction'
import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useContext } from 'react'
import SwapContext from 'store/swap-context'
import {
  useGetTimeLockPuzzleParam,
  // useCreateEncryptProofFunc,
  // useSendEncryptedTxFunc,
  useMakeTimeLockPuzzle,
} from '../../../state/time-lock-puzzling-encryption/hooks'
// import { usePrepareSignature } from '../../../state/sign/hooks'

import { useCheckAccountWhiteList } from 'state/user/hooks'

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!workers/worker'

const MAXIMUM_PATH_LENGTH = 3
const swapExactTokensForTokens = '0x73a2cff1'

export const RightSection = () => {
  const swapCTX = useContext(SwapContext)
  const { swapParams, updateSwapParams, handleSwapParams, handleLeftSection } = swapCTX

  const {
    timeLockPuzzleData,
    signMessage,
    txNonce,
    idPath,
    txHash,
    mimcHash,
    encryptedSwapTx,
    sig,
    operatorAddress,
    prepareDone,
    encryptorDone,
    start,
    confirm,
    signingDone,
    timeLockPuzzleDone,
  } = swapParams
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // TODO: add this to check account in whitelist

  const routerContract = useV2RouterContract() as Contract
  const { account, chainId } = useActiveWeb3React()
  const parameters = useParameters()

  // const [swapParams, setSwapParams] = useState<any>({ start: false })

  // TODO:
  const backerIntegrity = true

  // swap state
  const { recipient } = useSwapState()

  const {
    trade: { trade },
    allowedSlippage,
  } = useDerivedSwapInfo()

  const priceImpact = trade?.priceImpact

  const { onUserInput } = useSwapActionHandlers()

  ///////////////////////////////
  // approve
  ///////////////////////////////
  const approvalOptimizedTrade = useApprovalOptimizedTrade(trade, allowedSlippage)

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(approvalOptimizedTrade, allowedSlippage)
  const transactionDeadline = useTransactionDeadline()
  const { signatureData } = useERC20PermitFromTrade(approvalOptimizedTrade, allowedSlippage, transactionDeadline)

  ///////////////////////////////
  // Check Account in Whitelist
  ///////////////////////////////
  useCheckAccountWhiteList(account, swapParams)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  // the callback to execute the swap
  const { prepareSignMessage, userSign, createEncryptProof, sendEncryptedTx } = useSwapCallback(
    approvalOptimizedTrade,
    allowedSlippage,
    backerIntegrity, //backer integrity
    recipient,
    signatureData,
    parameters
  )

  ///////////////////////////////
  // Time-lock puzzle creation and encryption proccesses are CPU heavy, thus, this process should happen inside worker
  ///////////////////////////////
  const worker = useMemo(() => new Worker(), [])

  ///////////////////////////////
  // Function that returns parameters for the time-lock puzzle
  ///////////////////////////////
  const timeLockPuzzleParams = useGetTimeLockPuzzleParam()

  ///////////////////////////////
  // Set initial state
  ///////////////////////////////
  const isPuzzling = useRef<boolean>(false)

  ///////////////////////////////
  // Start making the time-lock puzzle inside worker
  ///////////////////////////////
  useMakeTimeLockPuzzle(isPuzzling, timeLockPuzzleData, timeLockPuzzleParams, worker)

  ///////////////////////////////
  // Proceed in accordance with the message passed by the worker into the main thread
  ///////////////////////////////
  worker.onmessage = (e: MessageEvent<any>) => {
    if (e.data.target === 'timeLockPuzzle') {
      updateSwapParams({ timeLockPuzzleDone: true, timeLockPuzzleData: { ...e.data.data } })
      isPuzzling.current = false
    }
    if (e.data.target === 'encryptor' && account && chainId && timeLockPuzzleData && signMessage) {
      const encryptData = e.data.data

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

      const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, signMessage)
      const mimcHash = '0x' + encryptData.tx_id

      const encryptedSwapTx: EncryptedSwapTx = {
        txOwner: account,
        functionSelector: swapExactTokensForTokens,
        amountIn: `${signMessage.amountIn}`,
        amountOut: `${signMessage.amountOut}`,
        path: encryptedPath,
        to: account,
        nonce: txNonce,
        backerIntegrity: signMessage.backerIntegrity,
        availableFrom: signMessage.availableFrom,
        deadline: signMessage.deadline,
        txHash,
        mimcHash,
      }

      updateSwapParams({ encryptorDone: true, txHash, mimcHash, encryptedSwapTx })

      isEncrypting.current = false
    }
  }

  ///////////////////////////////
  // declare process functions
  ///////////////////////////////
  const prepareSignMessageFunc = useCallback(async () => {
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

  const userSignFunc = useCallback(async () => {
    if (userSign) {
      const res = await userSign(signMessage)
      if (res) {
        updateSwapParams({ signingDone: true, ...res })
        handleLeftSection('progress')
      } else {
        updateSwapParams({ confirm: false })
      }
    }
  }, [userSign, swapParams])

  const sendEncryptedTxFunc = useCallback(async () => {
    if (sendEncryptedTx) {
      sendEncryptedTx(txHash, mimcHash, signMessage, encryptedSwapTx, sig, operatorAddress)
        .then(async (res) => {
          onUserInput(Field.INPUT, '')
          updateSwapParams({ sent: true })
        })
        .catch(async (e) => {
          console.error(e)
          onUserInput(Field.INPUT, '')
          handleLeftSection('welcome')
          handleSwapParams({ start: false })
        })
    }
  }, [sendEncryptedTx, onUserInput, swapParams])

  ///////////////////////////////
  // swap processing
  ///////////////////////////////
  const isPreparing = useRef<boolean>(false)
  // When "Preview swap" is clicked, preparation of swap processing starts

  // If it is not prepared, currently not started and not done then start preparing

  useEffect(() => {
    if (prepareSignMessageFunc !== null && !isPreparing.current && start && !prepareDone) {
      isPreparing.current = true
      prepareSignMessageFunc().then(() => {
        isPreparing.current = false
      })
    }
  }, [prepareSignMessageFunc, start, prepareDone])

  const isEncrypting = useRef<boolean>(false)
  // Encrypt it
  useEffect(() => {
    if (
      createEncryptProofFunc !== null &&
      !isEncrypting.current &&
      timeLockPuzzleDone &&
      prepareDone &&
      !encryptorDone
    ) {
      isEncrypting.current = true
      createEncryptProofFunc()
    }
  }, [swapParams, createEncryptProofFunc, createEncryptProof])

  const isSigning = useRef(false)

  // Sign it
  useEffect(() => {
    if (!isSigning.current && prepareDone && confirm && !signingDone) {
      isSigning.current = true
      handleLeftSection('almost-there')
      userSignFunc().then(() => {
        isSigning.current = false
      })
    }
  }, [swapParams, userSignFunc])

  const isSending = useRef<boolean>(false)

  // Send it
  useEffect(() => {
    if (!isSending.current && encryptorDone && signingDone) {
      isSending.current = true
      console.log('sendEncryptedTxFunc')
      sendEncryptedTxFunc().then(() => {
        isSending.current = false
      })
    }
  }, [swapParams, sendEncryptedTxFunc])

  return <></>
}

export default RightSection
