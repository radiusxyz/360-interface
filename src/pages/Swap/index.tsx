import { Contract } from '@ethersproject/contracts'
import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'
import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import Off from 'assets/images/off.png'
import On from 'assets/images/on.png'
import ferrisWheel from 'assets/images/ferris_wheel.png'
import SwapDetailsDropdown from 'components/swap/SwapDetailsDropdown'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { MouseoverTooltip } from 'components/Tooltip'
import { domain, SWAP_TYPE } from 'constants/eip712'
import { motion, useAnimationControls } from 'framer-motion'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import JSBI from 'jsbi'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import localForage from 'localforage'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, CheckCircle, HelpCircle, Info } from 'react-feather'
import ReactGA from 'react-ga4'
import { BsArrowDown } from 'react-icons/bs'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { useAppDispatch } from 'state/hooks'
import { useCancelManager, useReimbursementManager, useShowHistoryManager } from 'state/modal/hooks'
import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
import { useParameters } from 'state/parameters/hooks'
import { setTimeLockPuzzleParam, setTimeLockPuzzleSnarkParam, TimeLockPuzzleParam } from 'state/parameters/reducer'
import { TradeState } from 'state/routing/types'
import styled, { ThemeContext } from 'styled-components/macro'
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!../../workers/worker'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary, ButtonPrimaryV2 } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import Loader from '../../components/Loader'
import { AutoRow } from '../../components/Row'
import { CancelSuggestModal } from '../../components/swap/CancelModal'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import { HistoryModal } from '../../components/swap/HistoryModal'
import { ReimbursementModal } from '../../components/swap/ReimburseModal'
import { ArrowWrapper, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import { SupportedChainId as SupportedChainIds } from '../../constants/chains'
import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import { useV2RouterContract } from '../../hooks/useContract'
import { useERC20PermitFromTrade, UseERC20PermitState } from '../../hooks/useERC20Permit'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapErrorText, WrapType } from '../../hooks/useWrapCallback'
import { EncryptedSwapTx, TxInfo } from '../../lib/hooks/swap/useSendSwapTransaction'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton, ThemedText } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { warningSeverity } from '../../utils/prices'
import SwapSection from '../SwapSection'
import SwapContext from 'contexts/swap-context'

const MAXIMUM_PATH_LENGTH = 3
const swapExactTokensForTokens = '0x73a2cff1'

const InfoAndSwapWrapper = styled.div`
  display: flex;
  justify-content: center;
  max-height: 381px;
  gap: 12px;
  width: 100%;
  height: 100%;
`

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border: 1px solid #dde0ff;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  width: 100%;
  max-width: 500px;
`

const FerrisWheel = styled.img.attrs(() => ({
  src: ferrisWheel,
  height: '60px',
  width: '60px',
}))``

const GreetingMessage = styled.p`
  font-weight: 500;
  font-size: 20px;
  line-height: 26.97px;
  color: #5800af;
  margin: 0;
`

const SwapButtonConfirmed = styled(ButtonConfirmed)`
  margin: 10px 0px 24px 0px;
  background: #ff3187;
  border-radius: 4px;
  border: 0px solid #fff;
  &:hover {
    background: #1cde81;
    border: 0px solid #fff;
  }
`
const SwapButtonError = styled(ButtonError)`
  margin: 10px 0px 24px 0px;
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
  &:hover {
    background: #0066ff;
  }
`
// const SwapButtonLight = styled(ButtonLight)`
//   background: #6b11ff;
//   color: #ffffff;
//   padding: 13px;
//   font-weight: 500;
//   width: 100%;
//   font-size: 18px;
//   line-height: 144.52%;
//   border-radius: 0;
// `

const SwapButtonLight = styled(ButtonPrimaryV2)`
  margin: 0;
`

const SwapButtonPrimary = styled(ButtonPrimary)`
  margin: 10px 0px 24px 0px;
  background: #cccccc;
  border-radius: 4px;
  border: 0px solid #fff;
`

export const RotateWrapper = styled.div`
  height: 32px;
  width: 32px;
  padding: 8px;
  position: absolute;

  @keyframes rotate {
    0% {
      -webkit-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }
    100% {
      -webkit-transform: rotate(-180deg) translateX(-4px);
      -o-transform: rotate(-180deg) translateX(-4px);
      transform: rotate(-180deg) translateX(-4px);
    }
  }

  :hover {
    cursor: pointer;
    animation: rotate linear 0.3s;
    animation-fill-mode: forwards;
  }
`

export const FadeWrapper = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 16px;
  position: absolute;
  background: #383b49;

  @keyframes fade {
    0% {
      opacity: 1;
    }
    90% {
      opacity: 0.7;
    }
    100% {
      opacity: 0;
    }
  }

  :hover {
    cursor: pointer;
    animation: fade linear 0.3s;
    animation-fill-mode: forwards;
  }
`
const Divider = styled.div`
  outline: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  width: 100%;
  height: 1px;
`

function emptyCache() {
  if ('caches' in window) {
    caches.keys().then((names) => {
      // Delete all the cache files
      names.forEach((name) => {
        caches.delete(name)
      })
    })

    // Makes sure the page reloads. Changes are only visible after you refresh.
    window.location.reload()
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export default function Swap({ history }: RouteComponentProps) {
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const [swapState, setSwapState] = useState<{
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined
    swapErrorMessage: string | undefined
    txHash: string | undefined
    swapResponse: RadiusSwapResponse | undefined
    backerIntegrity: boolean
  }>({
    tradeToConfirm: undefined,
    swapErrorMessage: undefined,
    txHash: undefined,
    swapResponse: undefined,
    backerIntegrity: false,
  })

  const [accountWhiteList, setAccountWhiteList] = useState<boolean>(false)

  const [toggle, setToggle] = useState<boolean>(false)

  const [swapParams, setSwapParams] = useState<any>({ start: false })

  const routerContract = useV2RouterContract() as Contract
  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const [cancel, setCancel] = useCancelManager()
  const [reimbursement, setReimbursement] = useReimbursementManager()
  const [showHistory, setShowHistory] = useShowHistoryManager()

  const { account, chainId } = useActiveWeb3React()

  const controls = useAnimationControls()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  const parameters = useParameters()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const {
    trade: { state: tradeState, trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = useDerivedSwapInfo()

  const minimum = trade?.minimumAmountOut(allowedSlippage).toSignificant(6).toString()

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  // const { address: recipientAddress } = useENSAddress(recipient)

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, trade]
  )

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [!trade?.swaps, TradeState.LOADING === tradeState, TradeState.SYNCING === tradeState],
    [trade, tradeState]
  )

  const fiatValueInput = useUSDCValue(trade?.inputAmount)
  const fiatValueOutput = useUSDCValue(trade?.outputAmount)
  const priceImpact = trade?.priceImpact

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  // reset if they close warning without tokens in params
  // const handleDismissTokenWarning = useCallback(() => {
  //   setDismissTokenWarning(true)
  //   history.push('/swap/')
  // }, [history])

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: showWrap
        ? parsedAmounts[independentField]?.toExact() ?? ''
        : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    }),
    [dependentField, independentField, parsedAmounts, showWrap, typedValue]
  )

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const approvalOptimizedTrade = useApprovalOptimizedTrade(trade, allowedSlippage)
  const approvalOptimizedTradeString =
    approvalOptimizedTrade instanceof V2Trade
      ? 'V2SwapRouter'
      : approvalOptimizedTrade instanceof V3Trade
      ? 'V3SwapRouter'
      : 'SwapRouter'

  // check whether the user has approved the router on the input token
  const [approvalState, approveCallback] = useApproveCallbackFromTrade(approvalOptimizedTrade, allowedSlippage)
  const transactionDeadline = useTransactionDeadline()
  const {
    state: signatureState,
    signatureData,
    gatherPermitSignature,
  } = useERC20PermitFromTrade(approvalOptimizedTrade, allowedSlippage, transactionDeadline)

  const handleApprove = useCallback(async () => {
    if (signatureState === UseERC20PermitState.NOT_SIGNED && gatherPermitSignature) {
      try {
        await gatherPermitSignature()
      } catch (error) {
        // try to approve if gatherPermitSignature failed for any reason other than the user rejecting it
        if (error?.code !== 4001) {
          await approveCallback()
        }
      }
    } else {
      await approveCallback()

      ReactGA.event({
        category: 'Swap',
        action: 'Approve',
        label: [approvalOptimizedTradeString, approvalOptimizedTrade?.inputAmount?.currency.symbol].join('/'),
      })
    }
  }, [
    signatureState,
    gatherPermitSignature,
    approveCallback,
    approvalOptimizedTradeString,
    approvalOptimizedTrade?.inputAmount?.currency.symbol,
  ])

  // Check Account in Whitelist
  useEffect(() => {
    if (account) {
      fetch(`${process.env.REACT_APP_360_OPERATOR}/whiteList?walletAddress=` + account)
        .then(async (is) => {
          const val = await is.text()
          if (val === 'false') setAccountWhiteList(false)
          else setAccountWhiteList(true)
        })
        .catch((e) => console.error(e))
    }
  }, [account, swapParams])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const maxInputAmount: CurrencyAmount<Currency> | undefined = useMemo(
    () => maxAmountSpend(currencyBalances[Field.INPUT]),
    [currencyBalances]
  )

  // the callback to execute the swap
  const {
    error: swapCallbackError,
    prepareSignMessage,
    userSign,
    createEncryptProof,
    sendEncryptedTx,
  } = useSwapCallback(
    approvalOptimizedTrade,
    allowedSlippage,
    swapState.backerIntegrity,
    recipient,
    signatureData,
    parameters
  )

  const handleSwap = () => {
    setSwapParams({ ...swapParams, confirm: true })
  }
  const dispatch = useAppDispatch()

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

  const worker = useMemo(() => new Worker(), [])

  const isPuzzling = useRef<boolean>(false)
  useEffect(() => {
    if (!swapParams.timeLockPuzzleData && !isPuzzling.current) {
      isPuzzling.current = true
      getTimeLockPuzzleParam().then((res) => {
        //console.log('post to timeLockPuzzle', res)
        worker.postMessage({
          target: 'timeLockPuzzle',
          timeLockPuzzleParam: res.timeLockPuzzleParam,
          timeLockPuzzleSnarkParam: res.timeLockPuzzleSnarkParam,
        })
      })
    }
  }, [getTimeLockPuzzleParam, swapParams.timeLockPuzzleData, worker])

  worker.onmessage = (e: MessageEvent<any>) => {
    if (e.data.target === 'timeLockPuzzle') {
      setSwapParams({ ...swapParams, timeLockPuzzleDone: true, timeLockPuzzleData: { ...e.data.data } })
      isPuzzling.current = false
    }
    if (
      e.data.target === 'encryptor' &&
      account &&
      chainId &&
      swapParams.timeLockPuzzleData &&
      swapParams.signMessage
    ) {
      const encryptData = e.data.data
      //console.log('🚀 ~ file: useSendSwapTransaction.tsx:520 ~ returnuseMemo ~ encryptData', encryptData)

      const encryptedPath = {
        message_length: encryptData.message_length,
        nonce: encryptData.nonce,
        commitment: swapParams.timeLockPuzzleData.commitment_hex,
        cipher_text: [encryptData.cipher_text],
        r1: swapParams.timeLockPuzzleData.r1,
        r3: swapParams.timeLockPuzzleData.r3,
        s1: swapParams.timeLockPuzzleData.s1,
        s3: swapParams.timeLockPuzzleData.s3,
        k: swapParams.timeLockPuzzleData.k,
        time_lock_puzzle_snark_proof: swapParams.timeLockPuzzleData.time_lock_puzzle_snark_proof,
        encryption_proof: encryptData.proof,
      }

      // //console.log(sig)

      const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, swapParams.signMessage)
      const mimcHash = '0x' + encryptData.tx_id

      const encryptedSwapTx: EncryptedSwapTx = {
        txOwner: account,
        functionSelector: swapExactTokensForTokens,
        amountIn: `${swapParams.signMessage.amountIn}`,
        amountOut: `${swapParams.signMessage.amountOut}`,
        path: encryptedPath,
        to: account,
        nonce: swapParams.txNonce,
        backerIntegrity: swapParams.signMessage.backerIntegrity,
        availableFrom: swapParams.signMessage.availableFrom,
        deadline: swapParams.signMessage.deadline,
        txHash,
        mimcHash,
      }

      setSwapParams({ ...swapParams, encryptorDone: true, txHash, mimcHash, encryptedSwapTx })

      isEncrypting.current = false
    }
  }

  const prepareSignMessageFunc = useCallback(async () => {
    if (prepareSignMessage) {
      const time1 = Date.now()
      routerContract
        .nonces(account)
        .then(async (contractNonce: any) => {
          //console.log('after get nonce', Date.now() - time1)

          const time2 = Date.now()
          routerContract
            .operator()
            .then(async (operatorAddress: any) => {
              //console.log('after get operator', Date.now() - time2)

              const time3 = Date.now()
              const res = await prepareSignMessage(swapState.backerIntegrity, contractNonce)
              //console.log('after prepareSignMessage', Date.now() - time3)
              //console.log('res1', res)
              setSwapParams({ ...swapParams, prepareDone: true, ...res, operatorAddress })
            })
            .catch(() => {
              //console.log('after get operator', Date.now() - time2)
              //console.log('failed to load operator')
              setSwapParams({
                ...swapParams,
                start: false,
                errorMessage: 'RPC server is not responding, please try again',
              })
            })
        })
        .catch(() => {
          //console.log('after get nonce', Date.now() - time1)
          //console.log('failed to load nonce')
          setSwapParams({
            ...swapParams,
            start: false,
            errorMessage: 'RPC server is not responding, please try again',
          })
        })
    }
  }, [prepareSignMessage, swapParams, account, routerContract, swapState.backerIntegrity])

  const createEncryptProofFunc = useCallback(async () => {
    if (chainId && swapParams.signMessage) {
      if (swapParams.signMessage.path.length > 3) {
        console.error('Cannot encrypt path which length is over 3')
      }

      const pathToHash: string[] = new Array(MAXIMUM_PATH_LENGTH)

      for (let i = 0; i < MAXIMUM_PATH_LENGTH; i++) {
        pathToHash[i] = i < swapParams.signMessage.path.length ? swapParams.signMessage.path[i].split('x')[1] : '0'
      }

      const txInfoToHash: TxInfo = {
        tx_owner: swapParams.signMessage.txOwner.split('x')[1],
        function_selector: swapParams.signMessage.functionSelector.split('x')[1],
        amount_in: `${swapParams.signMessage.amountIn}`,
        amount_out: `${swapParams.signMessage.amountOut}`,
        to: swapParams.signMessage.to.split('x')[1],
        deadline: `${swapParams.signMessage.deadline}`,
        nonce: `${swapParams.signMessage.nonce}`,
        path: pathToHash,
      }
      //console.log('🚀 ~ file: useSendSwapTransaction.tsx:511 ~ returnuseMemo ~ txInfoToHash', txInfoToHash, swapParams)

      worker.postMessage({
        target: 'encryptor',
        txInfoToHash,
        s2_string: swapParams.timeLockPuzzleData.s2_string,
        s2_field_hex: swapParams.timeLockPuzzleData.s2_field_hex,
        commitment_hex: swapParams.timeLockPuzzleData.commitment_hex,
        idPath: swapParams.idPath,
      })
    }
  }, [swapParams])

  const userSignFunc = useCallback(async () => {
    if (userSign) {
      //console.log('call userSign', swapParams)
      const time = Date.now()
      const res = await userSign(swapParams.signMessage)
      //console.log('after userSign', Date.now() - time)
      //console.log('res2', res)
      if (res) {
        setSwapParams({ ...swapParams, signingDone: true, ...res })
      } else {
        setSwapParams({ ...swapParams, confirm: false })
      }
    }
  }, [userSign, swapParams])

  const sendEncryptedTxFunc = useCallback(async () => {
    if (sendEncryptedTx) {
      const time = Date.now()

      sendEncryptedTx(
        swapParams.txHash,
        swapParams.mimcHash,
        swapParams.signMessage,
        swapParams.encryptedSwapTx,
        swapParams.sig,
        swapParams.operatorAddress
      )
        .then(async (res) => {
          onUserInput(Field.INPUT, '')
          //console.log('after sendEncryptedTx', Date.now() - time)
          //console.log('res5', res)
          setSwapParams({ ...swapParams, sent: true })

          await sleep(10000)
          setSwapState({
            ...swapState,
            swapErrorMessage: undefined,
            txHash: undefined,
            swapResponse: res,
          })
          setSwapParams({ start: false })
        })
        .catch(async (e) => {
          console.error(e)
          //console.log('after sendEncryptedTx', Date.now() - time)
          onUserInput(Field.INPUT, '')
          setSwapState({
            ...swapState,
            swapErrorMessage: e.message,
            txHash: undefined,
            swapResponse: undefined,
          })
          setSwapParams({ start: false })
        })
    }
  }, [sendEncryptedTx, onUserInput, swapParams, swapState])

  const isPreparing = useRef<boolean>(false)

  useEffect(() => {
    if (prepareSignMessageFunc !== null && !isPreparing.current && swapParams.start && !swapParams.prepareDone) {
      isPreparing.current = true
      prepareSignMessageFunc().then(() => {
        isPreparing.current = false
      })
    }
  }, [prepareSignMessageFunc, swapParams.start, swapParams.prepareDone])

  const isEncrypting = useRef<boolean>(false)

  useEffect(() => {
    if (
      createEncryptProofFunc !== null &&
      !isEncrypting.current &&
      swapParams.timeLockPuzzleDone &&
      swapParams.prepareDone &&
      !swapParams.encryptorDone
    ) {
      //console.log('2', swapParams, createEncryptProofFunc, createEncryptProof)
      isEncrypting.current = true
      createEncryptProofFunc()
    }
  }, [swapParams, createEncryptProofFunc, createEncryptProof])

  const isSigning = useRef(false)
  useEffect(() => {
    if (!isSigning.current && swapParams.prepareDone && swapParams.confirm && !swapParams.signingDone) {
      isSigning.current = true
      userSignFunc().then(() => {
        isSigning.current = false
      })
    }
  }, [swapParams, userSignFunc])

  const isSending = useRef<boolean>(false)

  useEffect(() => {
    if (!isSending.current && swapParams.encryptorDone && swapParams.signingDone) {
      //console.log('4', swapParams, sendEncryptedTxFunc, sendEncryptedTx)
      isSending.current = true
      sendEncryptedTxFunc().then(() => {
        isSending.current = false
      })
    }
  }, [swapParams, sendEncryptedTxFunc, sendEncryptedTx])

  // warnings on the greater of fiat value price impact and execution price impact
  const priceImpactSeverity = useMemo(() => {
    const executionPriceImpact = trade?.priceImpact
    return warningSeverity(
      executionPriceImpact && priceImpact
        ? executionPriceImpact.greaterThan(priceImpact)
          ? executionPriceImpact
          : priceImpact
        : executionPriceImpact ?? priceImpact
    )
  }, [priceImpact, trade])

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode

  const isArgentWallet = useIsArgentWallet()

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !isArgentWallet &&
    !swapInputError &&
    (approvalState === ApprovalState.NOT_APPROVED ||
      approvalState === ApprovalState.PENDING ||
      (approvalSubmitted && approvalState === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  const handleConfirmDismiss = useCallback(() => {
    //console.log('on dismiss')
    setSwapParams({
      start: false,
      timeLockPuzzleData: swapParams.timeLockPuzzleData,
      timeLockPuzzleDone: swapParams.timeLockPuzzleDone,
    })

    // if there was a tx hash, we want to clear the input
    if (swapState.txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [onUserInput, swapState, swapParams])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      ...swapState,
      tradeToConfirm: trade,
    })
  }, [swapState, trade])

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
    ReactGA.event({
      category: 'Swap',
      action: 'Max',
    })
  }, [maxInputAmount, onUserInput])

  const handleHalfInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.divide(2).toExact())
    ReactGA.event({
      category: 'Swap',
      action: 'Half',
    })
  }, [maxInputAmount, onUserInput])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  useEffect(() => {
    const a = !(!isValid || routeIsSyncing || routeIsLoading || !!swapCallbackError)
    const b = !toggle
    if (a && b) {
      controls.start((i) => {
        switch (i) {
          case 'out':
            return { height: '24px', padding: '6px', transition: { duration: 0.3 } }
          case 'in':
            return { height: '12px', background: 'black', border: '1px solid #323860', transition: { duration: 0.4 } }
          case 'paper':
            return { height: '100%', opacity: 1, transition: { delay: 0.5, duration: 0.3 } }
          default:
            return { height: '100%', opacity: 1, transition: { delay: 0.5, duration: 0.3 } }
        }
      })
      setToggle(true)
    } else if (toggle) {
      controls.start((i) => {
        switch (i) {
          case 'out':
            return { height: '0px', padding: '0px', transition: { delay: 0.5, duration: 0.3 } }
          case 'in':
            return {
              height: '0px',
              background: 'transparent',
              border: '1px solid transparent',
              transition: { delay: 0.4, duration: 0.3 },
            }
          case 'paper':
            return { height: '0px', opacity: 0, transition: { duration: 0.3 } }
          default:
            return { height: '0px', opacity: 0, transition: { duration: 0.3 } }
        }
      })
      setToggle(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid, routeIsSyncing, routeIsLoading, swapCallbackError, controls])

  // TODO: CLEAR CACHE 자동로딩

  const SwapCTX = useContext(SwapContext)

  return (
    <InfoAndSwapWrapper>
      {SwapCTX.leftSection === 'welcome' && (
        <InfoSection>
          <FerrisWheel />
          <GreetingMessage>Welcome to 360°</GreetingMessage>
        </InfoSection>
      )}

      <SwapSection maxWidth="372px">
        <>
          <SwapHeader allowedSlippage={allowedSlippage} />
          <Wrapper id="swap-page">
            <HistoryModal isOpen={showHistory} onDismiss={() => setShowHistory(false)} />
            <ConfirmSwapModal
              isOpen={swapParams.start}
              trade={trade}
              progress={
                !swapParams.start
                  ? 0
                  : !swapParams.confirm
                  ? 1
                  : !swapParams.signingDone
                  ? 2
                  : !swapParams.timeLockPuzzleDone
                  ? 3
                  : !swapParams.encryptorDone
                  ? 4
                  : !swapParams.sent
                  ? 5
                  : 6
              }
              originalTrade={swapState.tradeToConfirm}
              inputCurrency={currencies[Field.INPUT]}
              outputCurrency={currencies[Field.OUTPUT]}
              onAcceptChanges={handleAcceptChanges}
              errorMessage={swapParams?.errorMessage}
              txHash={swapState.txHash}
              recipient={recipient}
              allowedSlippage={allowedSlippage}
              onConfirm={handleSwap}
              swapErrorMessage={swapState.swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              swapResponse={swapState.swapResponse}
            />
            <ReimbursementModal
              isOpen={reimbursement !== 0}
              historyId={reimbursement}
              onDismiss={() => setReimbursement(0)}
            />
            <CancelSuggestModal isOpen={cancel !== 0} txHistoryId={cancel} onDismiss={() => setCancel(0)} />
            <AutoColumn gap={'sm'}>
              <div style={{ display: 'relative' }}>
                <CurrencyInputPanel
                  label={
                    independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
                  }
                  value={formattedAmounts[Field.INPUT]}
                  disableNonToken={true}
                  showMaxButton={false}
                  currency={currencies[Field.INPUT]}
                  onUserInput={handleTypeInput}
                  onMax={handleMaxInput}
                  onHalf={handleHalfInput}
                  fiatValue={fiatValueInput ?? undefined}
                  onCurrencySelect={handleInputSelect}
                  otherCurrency={currencies[Field.OUTPUT]}
                  isA={true}
                  id="swap-currency-input"
                  loading={independentField === Field.OUTPUT && routeIsSyncing}
                />
                <ArrowWrapper clickable={false}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'absolute',
                      margin: '8px',
                    }}
                  >
                    <BsArrowDown size="16" color={'#DDE0FF'} />
                  </div>
                </ArrowWrapper>
                <CurrencyInputPanel
                  value={formattedAmounts[Field.OUTPUT]}
                  disableNonToken={true}
                  onUserInput={() => {
                    return
                  }}
                  label={
                    independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>
                  }
                  showMaxButton={false}
                  hideBalance={false}
                  fiatValue={fiatValueOutput ?? undefined}
                  currency={currencies[Field.OUTPUT]}
                  onCurrencySelect={handleOutputSelect}
                  otherCurrency={currencies[Field.INPUT]}
                  isA={false}
                  id="swap-currency-output"
                  loading={independentField === Field.INPUT && routeIsSyncing}
                />
              </div>
            </AutoColumn>
          </Wrapper>
        </>
        <div style={{ padding: '40px 24px 24px 24px' }}>
          {recipient !== null && !showWrap ? (
            <>
              <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                <ArrowWrapper clickable={false}>
                  <ArrowDown size="16" color={theme.text2} />
                </ArrowWrapper>
                <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                  <Trans>- Remove recipient</Trans>
                </LinkStyledButton>
              </AutoRow>
              <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
            </>
          ) : null}
          {!showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing) ? (
            <SwapDetailsDropdown
              trade={trade}
              syncing={routeIsSyncing}
              loading={routeIsLoading}
              showInverted={showInverted}
              setShowInverted={setShowInverted}
              allowedSlippage={allowedSlippage}
            />
          ) : null}
          <div style={{ border: 'none' }}>
            {swapIsUnsupported ? (
              <SwapButtonPrimary disabled={true}>
                <ThemedText.Main mb="4px">
                  <Trans>Unsupported Asset</Trans>
                </ThemedText.Main>
              </SwapButtonPrimary>
            ) : !account ? (
              <SwapButtonLight onClick={toggleWalletModal}>
                <Trans>Connect Wallet</Trans>
              </SwapButtonLight>
            ) : chainId !== SupportedChainIds.POLYGON && chainId !== SupportedChainIds.POLYGON_MUMBAI ? (
              <SwapButtonPrimary disabled={true}>
                <ThemedText.Main mb="4px">
                  <Trans>Unsupported Network</Trans>
                </ThemedText.Main>
              </SwapButtonPrimary>
            ) : !accountWhiteList ? (
              <SwapButtonPrimary disabled={true}>
                <ThemedText.Main mb="4px">
                  <Trans>Your address is not whitelisted</Trans>
                </ThemedText.Main>
              </SwapButtonPrimary>
            ) : showWrap ? (
              <SwapButtonPrimary disabled={Boolean(wrapInputError)} onClick={onWrap}>
                {wrapInputError ? (
                  <WrapErrorText wrapInputError={wrapInputError} />
                ) : wrapType === WrapType.WRAP ? (
                  <Trans>Wrap</Trans>
                ) : wrapType === WrapType.UNWRAP ? (
                  <Trans>Unwrap</Trans>
                ) : null}
              </SwapButtonPrimary>
            ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
              <SwapButtonPrimary disabled={true} onClick={onWrap}>
                {/** TODO: Not exist path 반영 */}
                <Trans>Insufficient liquidity for this trade.</Trans>
              </SwapButtonPrimary>
            ) : showApproveFlow ? (
              <AutoRow style={{ flexWrap: 'nowrap', width: '100%' }}>
                <AutoColumn style={{ width: '100%' }} gap="12px">
                  <SwapButtonConfirmed
                    onClick={handleApprove}
                    disabled={
                      approvalState !== ApprovalState.NOT_APPROVED ||
                      approvalSubmitted ||
                      signatureState === UseERC20PermitState.SIGNED
                    }
                    width="100%"
                    altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
                    confirmed={
                      approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED
                    }
                  >
                    <AutoRow justify="center" style={{ flexWrap: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center' }}>
                        <CurrencyLogo
                          currency={currencies[Field.INPUT]}
                          size={'20px'}
                          style={{ marginRight: '8px', flexShrink: 0 }}
                        />
                        {/* we need to shorten this string on mobile */}
                        {approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED
                          ? `You can now trade ${currencies[Field.INPUT]?.symbol}`
                          : `Allow the 360° to use your ${currencies[Field.INPUT]?.symbol}`}
                      </span>
                      {approvalState === ApprovalState.PENDING ? (
                        <Loader stroke="white" />
                      ) : (approvalSubmitted && approvalState === ApprovalState.APPROVED) ||
                        signatureState === UseERC20PermitState.SIGNED ? (
                        <CheckCircle size="20" color={theme.green1} />
                      ) : (
                        <MouseoverTooltip
                          text={
                            <Trans>
                              You must give the 360° smart contracts permission to use your{' '}
                              {currencies[Field.INPUT]?.symbol}. You only have to do this once per token.
                            </Trans>
                          }
                        >
                          <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
                        </MouseoverTooltip>
                      )}
                    </AutoRow>
                  </SwapButtonConfirmed>
                </AutoColumn>
              </AutoRow>
            ) : (
              <SwapButtonError
                onClick={() => {
                  //console.log('button click', isExpertMode, swapParams)
                  if (isExpertMode) {
                    handleSwap()
                  } else {
                    setSwapState({
                      ...swapState,
                      tradeToConfirm: trade,
                      swapErrorMessage: undefined,
                      txHash: undefined,
                      swapResponse: undefined,
                    })
                    setSwapParams({ ...swapParams, start: true })
                  }
                }}
                id="swap-button"
                disabled={!isValid || routeIsSyncing || routeIsLoading || priceImpactTooHigh || !!swapCallbackError}
                error={isValid && priceImpactSeverity > 2 && !swapCallbackError}
                style={swapInputError ? { background: '#888' } : {}}
              >
                <Text fontSize={16} fontWeight={600}>
                  {swapInputError ? (
                    swapInputError
                  ) : routeIsSyncing || routeIsLoading ? (
                    <Trans>Preview Swap</Trans>
                  ) : priceImpactSeverity > 2 ? (
                    <Trans>Swap Anyway</Trans>
                  ) : priceImpactTooHigh ? (
                    <Trans>Price Impact Too High</Trans>
                  ) : (
                    <Trans>Preview Swap</Trans>
                  )}
                </Text>
              </SwapButtonError>
            )}
            {isExpertMode && swapState.swapErrorMessage ? (
              <SwapCallbackError error={swapState.swapErrorMessage} />
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <motion.div
            custom={'out'}
            animate={controls}
            initial={{ height: '0px', padding: '0px' }}
            style={{
              background: '#3c4270',
              width: '90%',
              height: '24px',
              padding: '6px',
              boxShadow: '0px 4px 18px rgba(15, 16, 24, 0.5)',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '10px',
            }}
          >
            <motion.div
              custom={'in'}
              animate={controls}
              initial={{
                background: 'transparent',
                height: '0px',
                width: '100%',
                border: '1px solid transparent',
              }}
            ></motion.div>
          </motion.div>
        </div>
      </SwapSection>
      <motion.div
        custom={'paper'}
        animate={controls}
        initial={{ height: '0px', opacity: 0 }}
        style={{
          display: 'none',
          background: 'linear-gradient(180deg, #000000 0%, #cdcdcd 6.31%)',
          overflow: 'hidden',
          maxWidth: '400px',
          width: '80%',
          transform: 'translateY(-40px) perspective(4.0em) rotateX(2deg)',
          padding: '24px',
          zIndex: 9,
          opacity: 1,
        }}
      >
        <div
          style={{
            color: '#333333',
            fontWeight: 'bold',
            fontSize: '14px',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            padding: '4px',
          }}
        >
          <div style={{ display: 'flex', verticalAlign: 'bottom' }}>
            You receive minimum&nbsp;
            <MouseoverTooltip
              text={
                <Trans>
                  The minimum amount of tokens you will receive after slippage. You may receive a greater amount
                  depending on the market conditions as your transaction is pending.
                </Trans>
              }
            >
              <Info
                style={{
                  stroke: '1px',
                  width: '18px',
                  height: '18px',
                }}
              />
            </MouseoverTooltip>
          </div>
          <div>{minimum && minimum + ' ' + trade?.outputAmount.currency.symbol}</div>
        </div>
        <div
          style={{
            color: '#333333',
            fontWeight: 'normal',
            fontSize: '14px',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            padding: '4px',
          }}
        >
          <div style={{ display: 'flex', verticalAlign: 'bottom' }}>
            Slippage Tolerance&nbsp;
            <MouseoverTooltip
              text={
                <Trans>
                  The maximum change in price you are willing to accept. Your transaction will revert if the price
                  decreases further.
                </Trans>
              }
            >
              <Info
                style={{
                  stroke: '1px',
                  width: '18px',
                  height: '18px',
                }}
              />
            </MouseoverTooltip>
          </div>
          <div>{allowedSlippage.toSignificant()}%</div>
        </div>
        <div
          style={{
            color: '#333333',
            fontWeight: 'normal',
            fontSize: '14px',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            padding: '4px',
          }}
        >
          <div style={{ display: 'flex', verticalAlign: 'bottom' }}>
            Price Impact&nbsp;
            <MouseoverTooltip
              text={<Trans>The change in market price of the asset due to the impact of your trade.</Trans>}
            >
              <Info
                style={{
                  stroke: '1px',
                  width: '18px',
                  height: '18px',
                }}
              />
            </MouseoverTooltip>
          </div>{' '}
          <div>
            {priceImpactTooHigh ? (
              <div style={{ color: 'red', fontSize: '10', fontWeight: 'normal' }}>
                {'Warning: Price Impact High '}
                <span style={{ fontSize: '12', fontWeight: 'bold' }}>{priceImpact?.toSignificant(3) + ' %'}</span>
              </div>
            ) : (
              <div style={{ color: '#008c27', fontSize: '12', fontWeight: 'bold' }}>
                {priceImpact?.toSignificant(3) + ' %'}
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            color: '#333333',
            fontWeight: 'normal',
            fontSize: '14px',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            padding: '4px',
          }}
        >
          <div>Total Fee (including gas fee)</div>
          <div style={{ color: '#0075FF', fontWeight: 'bold' }}>NO FEE</div>
        </div>
      </motion.div>

      {/* <AlertWrapper>
        <NetworkAlert />
      </AlertWrapper>
      <SwitchLocaleLink /> */}
      {!swapIsUnsupported ? null : (
        <UnsupportedCurrencyFooter
          show={swapIsUnsupported}
          currencies={[currencies[Field.INPUT], currencies[Field.OUTPUT]]}
        />
      )}
    </InfoAndSwapWrapper>
  )
}
