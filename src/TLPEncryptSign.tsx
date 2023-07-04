import { Contract } from '@ethersproject/contracts'
import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'

import { domain, SWAP_TYPE } from './constants/eip712'
import useActiveWeb3React from './hooks/useActiveWeb3React'
import { useSwapCallback } from './hooks/useSwapCallback'
import useTransactionDeadline from './hooks/useTransactionDeadline'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParameters } from './state/parameters/hooks'

import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from './hooks/useApproveCallback'
import { useV2RouterContract } from './hooks/useContract'
import { useERC20PermitFromTrade } from './hooks/useERC20Permit'
import { EncryptedSwapTx } from './lib/hooks/swap/useSendSwapTransaction'
import { Field } from './state/swap/actions'
import {
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
  usePrepareSignMessage,
  useCreateEncryptProof,
  useSignTx,
  useSendEncryptedTx,
} from './state/swap/hooks'
import { useContext } from 'react'
import SwapContext from './store/swap-context'
import {
  useCreateEncryptProofFunc,
  useGetTimeLockPuzzleParam,
  useMakeTimeLockPuzzle,
  useSendEncryptedTxFunc,
} from './state/time-lock-puzzling-encryption/hooks'
import { usePrepareSignMessageFunc, useUserSignFunc } from './state/sign/hooks'

import { useCheckAccountWhiteList } from './state/user/hooks'

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!workers/worker'

const MAXIMUM_PATH_LENGTH = 3
const swapExactTokensForTokens = '0x73a2cff1'

export const TLPEncryptSign = () => {
  const swapCTX = useContext(SwapContext)
  const { swapParams, updateSwapParams } = swapCTX

  const {
    timeLockPuzzleData,
    timeLockPuzzleDone,
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
  } = swapParams
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // TODO: add this to check account in whitelist

  const routerContract = useV2RouterContract() as Contract
  const { account, chainId } = useActiveWeb3React()
  const parameters = useParameters()

  // TODO:
  const backerIntegrity = true

  // swap state
  const { recipient } = useSwapState()

  const {
    trade: { trade },
    allowedSlippage,
  } = useDerivedSwapInfo()

  const { onUserInput } = useSwapActionHandlers()

  // approve

  const approvalOptimizedTrade = useApprovalOptimizedTrade(trade, allowedSlippage)

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(approvalOptimizedTrade, allowedSlippage)
  const transactionDeadline = useTransactionDeadline()
  const { signatureData } = useERC20PermitFromTrade(approvalOptimizedTrade, allowedSlippage, transactionDeadline)

  // Check Account in Whitelist

  useCheckAccountWhiteList(account)

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
    backerIntegrity,
    recipient,
    signatureData,
    parameters
  )

  // Time-lock puzzle creation and encryption proccesses are CPU heavy, thus, this process should happen inside worker

  const worker = useMemo(() => new Worker(), [])

  // Set initial state

  const isPuzzling = useRef<boolean>(false)

  // Define function that, when called, will return parameters for the time-lock puzzle

  const getTimeLockPuzzleParams = useGetTimeLockPuzzleParam()

  // Start making the time-lock puzzle inside worker

  useMakeTimeLockPuzzle(isPuzzling, timeLockPuzzleData, worker, getTimeLockPuzzleParams)

  // Proceed in accordance with the message passed by the worker into the main thread

  worker.onmessage = (e: MessageEvent<any>) => {
    if (e.data.target === 'timeLockPuzzle') {
      updateSwapParams({ timeLockPuzzleDone: true, timeLockPuzzleData: { ...e.data.data } })
      isPuzzling.current = false
    }
    if (e.data.target === 'encryptor' && account && chainId && timeLockPuzzleData && signMessage) {
      const encryptData = e.data.data
      const { amountIn, amountOut, backerIntegrity, availableFrom, deadline } = signMessage
      const { message_length, nonce, cipher_text, proof, tx_id } = encryptData
      const { commitment_hex, r1, r3, s1, s3, k, time_lock_puzzle_snark_proof } = timeLockPuzzleData

      const encryptedPath = {
        message_length,
        nonce,
        cipher_text: [cipher_text],
        encryption_proof: proof,
        r1,
        r3,
        s1,
        s3,
        k,
        commitment: commitment_hex,
        time_lock_puzzle_snark_proof,
      }

      const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, signMessage)
      const mimcHash = '0x' + tx_id

      const encryptedSwapTx: EncryptedSwapTx = {
        txOwner: account,
        functionSelector: swapExactTokensForTokens,
        amountIn: `${amountIn}`,
        amountOut: `${amountOut}`,
        path: encryptedPath,
        to: account,
        nonce: txNonce,
        backerIntegrity,
        availableFrom,
        deadline,
        txHash,
        mimcHash,
      }

      updateSwapParams({ encryptorDone: true, txHash, mimcHash, encryptedSwapTx })

      isEncrypting.current = false
    }
  }

  // Swap processing

  // Set initial state

  const isPreparing = useRef<boolean>(false)

  // Define function for preparing sign message

  const prepareSignMessageFunc = usePrepareSignMessageFunc(prepareSignMessage, routerContract, account, backerIntegrity)

  // When "Preview swap" is clicked, preparation of swap processing starts
  // If it is not prepared, currently not started and not done then start preparing
  usePrepareSignMessage(isPreparing, start, prepareDone, prepareSignMessageFunc)

  // Set initial state

  const isEncrypting = useRef<boolean>(false)

  // Define encryption proof creator function

  const createEncryptProofFunc = useCreateEncryptProofFunc(
    chainId,
    signMessage,
    MAXIMUM_PATH_LENGTH,
    worker,
    timeLockPuzzleData,
    idPath
  )

  // Encrypt transaction
  useCreateEncryptProof(
    isEncrypting,
    createEncryptProofFunc,
    createEncryptProof,
    timeLockPuzzleDone,
    prepareDone,
    encryptorDone
  )

  // Set initial state

  const isSigning = useRef(false)

  // Define function for user's signing

  const userSignFunc = useUserSignFunc(userSign, signMessage)

  // Sign transaction

  useSignTx(isSigning, prepareDone, signingDone, confirm, userSignFunc)

  // Set initial state

  const isSending = useRef<boolean>(false)

  // Define encrypted tx sender function

  const sendEncryptedTxFunc = useSendEncryptedTxFunc(
    sendEncryptedTx,
    txHash,
    mimcHash,
    signMessage,
    encryptedSwapTx,
    sig,
    operatorAddress,
    onUserInput,
    Field.INPUT
  )

  // Send transaction

  useSendEncryptedTx(isSending, encryptorDone, signingDone, sendEncryptedTxFunc)
  return <></>
}

export default TLPEncryptSign
