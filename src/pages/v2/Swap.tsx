import ferris_wheel from '../../assets/v2/images/ferris_wheel.png'
import cog from '../../assets/v2/images/cog.png'
import { PrimaryButton, SelectTokenButton } from 'components/v2/UI/Buttons'
import { NumericInput } from 'components/v2/UI/Inputs'
import Search from 'components/v2/Search/Search'
import Preview from 'components/v2/Preview/Preview'
import AlmostThere from 'components/v2/AlmostThere/AlmostThere'
import React from 'react'
// import Switch from '../../components/v2/UI/Switch'
import { Contract } from '@ethersproject/contracts'
import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { domain, SWAP_TYPE } from 'constants/eip712'
import { useAnimationControls } from 'framer-motion'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import JSBI from 'jsbi'
import localForage from 'localforage'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactGA from 'react-ga4'
import { useAppDispatch } from 'state/hooks'
import { useCancelManager, useReimbursementManager, useShowHistoryManager } from 'state/modal/hooks'
import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
import { useParameters } from 'state/parameters/hooks'
import { setTimeLockPuzzleParam, setTimeLockPuzzleSnarkParam, TimeLockPuzzleParam } from 'state/parameters/reducer'
import { TradeState } from 'state/routing/types'
import styled from 'styled-components/macro'
// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!../../workers/worker'

import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import { useV2RouterContract } from '../../hooks/useContract'
import { useERC20PermitFromTrade, UseERC20PermitState } from '../../hooks/useERC20Permit'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapType } from '../../hooks/useWrapCallback'
import { EncryptedSwapTx, TxInfo } from '../../lib/hooks/swap/useSendSwapTransaction'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from '../../state/swap/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { warningSeverity } from '../../utils/prices'

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: start;
  height: auto;
  gap: 12px;
  width: 100%;
  height: 100%;
  @media (max-width: 634px) {
    flex-direction: column;
    align-items: center;
  }
`

const LeftSection = styled.div`
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
  min-height: 381px;
  height: 100%;
`

const FerrisWheel = styled.img.attrs(() => ({
  src: ferris_wheel,
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

const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  max-width: 372px;
  width: 100%;
  min-height: 381px;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
  align-items: center;
  border-bottom: 1px solid #dde0ff;
  max-height: 44px;
`

const HeaderTitle = styled.span`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 144.52%;
  color: #000000;
`

const Cog = styled.img.attrs({ src: cog, width: 20 })``

const TopTokenRow = styled.div`
  display: flex;
  align-items: center;
  min-height: 118px;
  height: 100%;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px;
  gap: 8px;
  position: relative;
`

const Aligner = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 8px;
`

const Circle = styled.div`
  border-radius: 50%;
  width: 31px;
  height: 31px;
  position: absolute;
  top: 100%;
  left: 50%;
  border: 1px solid #dde0ff;
  transform: translate(-50%, -50%);
  background: #ffffff;
  cursor: pointer;
`

const BottomTokenRow = styled.div`
  display: flex;
  align-items: start;
  flex-grow: 1;
  justify-content: space-between;
  min-height: 75px;
  height: 100%;
  border-bottom: 1px solid #dde0ff;
  padding: 0 24px;
  gap: 8px;
  margin-top: 25px;
`

const ButtonRow = styled.div`
  display: flex;
  height: 100%;
  align-items: end;
  min-height: 116px;
  padding: 0 24px 24px 24px;
`

const MAXIMUM_PATH_LENGTH = 3
const swapExactTokensForTokens = '0x73a2cff1'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const Swap = () => {
  const [leftSection, setLeftSection] = useState('welcome')
  const handleClickSelect = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLButtonElement

    if (target.textContent === 'Select Token') setLeftSection('search-table')
    if (target.textContent === 'Connect Wallet') setLeftSection('preview')
    if (target.textContent === '') setLeftSection('almost-there')
  }
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
        console.log('post to timeLockPuzzle', res)
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
      console.log('🚀 ~ file: useSendSwapTransaction.tsx:520 ~ return useMemo ~ encryptData', encryptData)

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

      // console.log(sig)

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
          console.log('after get nonce', Date.now() - time1)

          const time2 = Date.now()
          routerContract
            .operator()
            .then(async (operatorAddress: any) => {
              console.log('after get operator', Date.now() - time2)

              const time3 = Date.now()
              const res = await prepareSignMessage(swapState.backerIntegrity, contractNonce)
              console.log('after prepareSignMessage', Date.now() - time3)
              console.log('res1', res)
              setSwapParams({ ...swapParams, prepareDone: true, ...res, operatorAddress })
            })
            .catch(() => {
              console.log('after get operator', Date.now() - time2)
              console.log('failed to load operator')
              setSwapParams({
                ...swapParams,
                start: false,
                errorMessage: 'RPC server is not responding, please try again',
              })
            })
        })
        .catch(() => {
          console.log('after get nonce', Date.now() - time1)
          console.log('failed to load nonce')
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
      console.log('🚀 ~ file: useSendSwapTransaction.tsx:511 ~ return useMemo ~ txInfoToHash', txInfoToHash, swapParams)

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
      console.log('call userSign', swapParams)
      const time = Date.now()
      const res = await userSign(swapParams.signMessage)
      console.log('after userSign', Date.now() - time)
      console.log('res2', res)
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
          console.log('after sendEncryptedTx', Date.now() - time)
          console.log('res5', res)
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
          console.log('after sendEncryptedTx', Date.now() - time)
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
      console.log('2', swapParams, createEncryptProofFunc, createEncryptProof)
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
      console.log('4', swapParams, sendEncryptedTxFunc, sendEncryptedTx)
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
    console.log('on dismiss')
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
    (inputCurrency: any) => {
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
    (outputCurrency: any) => {
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  return (
    <Wrapper>
      {(leftSection === 'welcome' && (
        <LeftSection>
          <FerrisWheel />
          <GreetingMessage>Welcome to 360</GreetingMessage>
        </LeftSection>
      )) ||
        (leftSection === 'search-table' && <Search />) ||
        (leftSection === 'preview' && <Preview />) ||
        (leftSection === 'almost-there' && <AlmostThere />)}
      <RightSection>
        <Header>
          <HeaderTitle>Swap</HeaderTitle>
          <Cog />
        </Header>
        <TopTokenRow>
          <Aligner>
            <SelectTokenButton mrgn="6px 0px 0px 0px" onClick={handleClickSelect}>
              Select Token
            </SelectTokenButton>
            <NumericInput />
          </Aligner>
          <Circle onClick={handleClickSelect} />
        </TopTokenRow>
        <BottomTokenRow>
          <Aligner>
            <SelectTokenButton mrgn="6px 0px 0px 0px" onClick={handleClickSelect}>
              Select Token
            </SelectTokenButton>
            <NumericInput />
          </Aligner>
        </BottomTokenRow>
        <ButtonRow>
          <PrimaryButton onClick={handleClickSelect}>Connect Wallet</PrimaryButton>
        </ButtonRow>
      </RightSection>
    </Wrapper>
  )
}

export default Swap
