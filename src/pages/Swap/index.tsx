import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token, TradeType } from '@uniswap/sdk-core'
import { Percent } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import SwapDetailsDropdown from 'components/swap/SwapDetailsDropdown'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { MouseoverTooltip } from 'components/Tooltip'
import { motion, useAnimationControls } from 'framer-motion'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import JSBI from 'jsbi'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown, CheckCircle, HelpCircle, Info } from 'react-feather'
import ReactGA from 'react-ga4'
import { BsArrowDown, BsArrowDownUp } from 'react-icons/bs'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { addPopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { useCancelManager, useReimbursementManager, useShowHistoryManager } from 'state/modal/hooks'
import { setProgress } from 'state/modal/reducer'
import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
import {
  useParameters,
  useTimeLockPuzzleParamManager,
  useTimeLockPuzzleSnarkParamManager,
} from 'state/parameters/hooks'
import { TradeState } from 'state/routing/types'
import styled, { ThemeContext } from 'styled-components/macro'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import Loader from '../../components/Loader'
import { AutoRow } from '../../components/Row'
import { CancelSuggestModal } from '../../components/swap/CancelModal'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
import { HistoryModal } from '../../components/swap/HistoryModal'
import { ReimbursementModal } from '../../components/swap/ReimburseModal'
import { ArrowWrapper, SwapCallbackError, Wrapper } from '../../components/swap/styleds'
import SwapHeader from '../../components/swap/SwapHeader'
import TokenWarningModal from '../../components/TokenWarningModal'
import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useAllTokens, useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from '../../hooks/useApproveCallback'
import useENSAddress from '../../hooks/useENSAddress'
import { useERC20PermitFromTrade, UseERC20PermitState } from '../../hooks/useERC20Permit'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import useWrapCallback, { WrapErrorText, WrapType } from '../../hooks/useWrapCallback'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/swap/actions'
import {
  useDefaultsFromURLSearch,
  useDerivedSwapInfo,
  useSwapActionHandlers,
  useSwapState,
} from '../../state/swap/hooks'
import { useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton, ThemedText } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { db, Status } from '../../utils/db'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { warningSeverity } from '../../utils/prices'
import { supportedChainId } from '../../utils/supportedChainId'
import AppBody from '../AppBody'

const SwapButtonConfirmed = styled(ButtonConfirmed)`
  margin: 10px 0px 16px 0px;
  background: #ff3187;
  border-radius: 4px;
  border: 0px solid #fff;
  &:hover {
    background: #1cde81;
  }
`
const SwapButtonError = styled(ButtonError)`
  margin: 10px 0px 16px 0px;
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
`
const SwapButtonLight = styled(ButtonLight)`
  margin: 10px 0px 16px 0px;
  background: linear-gradient(97deg, #ff0057%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  border: 0px solid #fff;
`
const SwapButtonPrimary = styled(ButtonPrimary)`
  margin: 10px 0px 16px 0px;
  background: #cccccc;
  border-radius: 4px;
  border: 0px solid #fff;
`

export const RotateWrapper = styled.div`
  height: 24px;
  width: 24px;
  padding: 4px;
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
    animation: rotate linear 0.5s;
    animation-fill-mode: forwards;
  }
`

export const FadeWrapper = styled.div`
  height: 24px;
  width: 24px;
  border-radius: 12px;
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
    animation: fade linear 0.5s;
    animation-fill-mode: forwards;
  }
`

export default function Swap({ history }: RouteComponentProps) {
  const addReady = async () => {
    await db.readyTxs.add({
      tx: {
        txOwner: '',
        functionSelector: '',
        amountIn: '',
        amountOut: '',
        path: [],
        to: '',
        nonce: 0,
        availableFrom: 0,
        deadline: 0,
      },
      mimcHash: 'mimcHash',
      txHash: 'txHash',
      progressHere: 0,
      from: {
        token: '',
        amount: '0',
        decimal: '1000000000000000000',
      },
      to: {
        token: '',
        amount: '0',
        decimal: '1000000000000000000',
      },
    })
  }

  const addPending = async () => {
    await db.pendingTxs.add({
      readyTxId: 1,
      sendDate: Date.now(),
      round: 3,
      order: 4,
      proofHash: 'proofHash',
      operatorSignature: { r: 'r', s: 's', v: 27 },
      progressHere: 1,
    })
  }

  const addTxHistory = async () => {
    await db.txHistory.add({
      pendingTxId: 1,
      txId: 'txId',
      txDate: Date.now(),
      status: Status.COMPLETED,
      from: { token: 'fromToken', amount: '123345222222000000000', decimal: '1000000000000000000' },
      to: { token: 'toToken', amount: '321333388888000000000', decimal: '1000000000000000000' },
    })
  }

  const showDB = async () => {
    const keys = await db.pendingTxs.toCollection().keys()
    const got = await db.pendingTxs.get(keys[0])
    console.log(got)
  }

  const showPopUp = () => {
    dispatch(
      addPopup({
        content: {
          title: 'Transaction pending',
          status: 'success',
          data: { hash: '0x1111111111111111111111111111111111111111' },
        },
        key: `popup-test`,
        removeAfterMs: 1000000,
      })
    )
  }

  const showCancel = () => {
    console.log(cancel)
    setCancel(1)
    console.log(cancel)
  }

  const dispatch = useAppDispatch()

  useEffect(() => {
    dispatch(setProgress({ newParam: 0 }))
  }, [])

  const [cancel, setCancel] = useCancelManager()
  const [reimbursement, setReimbursement] = useReimbursementManager()
  const [showHistory, setShowHistory] = useShowHistoryManager()

  const [showTest, setShowTest] = useState(false)
  const [showReimbursement, setShowReimbursement] = useState(false)

  const showModal = () => {
    setShowTest(!showTest)
  }
  const showReimbursementModal = () => {
    setShowReimbursement(!showReimbursement)
  }

  const { account, chainId } = useActiveWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()

  const controls = useAnimationControls()

  const [toggle, setToggle] = useState(false)

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.[Field.INPUT]?.currencyId),
    useCurrency(loadedUrlParams?.[Field.OUTPUT]?.currencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  // dismiss warning if all imported tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault = useMemo(
    () =>
      urlLoadedTokens &&
      urlLoadedTokens
        .filter((token: Token) => {
          return !Boolean(token.address in defaultTokens)
        })
        .filter((token: Token) => {
          // Any token addresses that are loaded from the shorthands map do not need to show the import URL
          const supported = supportedChainId(chainId)
          if (!supported) return true
          return !Object.keys(TOKEN_SHORTHANDS).some((shorthand) => {
            const shorthandTokenAddress = TOKEN_SHORTHANDS[shorthand][supported]
            return shorthandTokenAddress && shorthandTokenAddress === token.address
          })
        }),
    [chainId, defaultTokens, urlLoadedTokens]
  )

  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // for expert mode
  const [isExpertMode] = useExpertModeManager()

  const parameters = useParameters()
  const [timeLockPuzzleParam, updateTimeLockPuzzleParam] = useTimeLockPuzzleParamManager()
  const [timeLockPuzzleSnarkParam, updateTimeLockPuzzleSnarkParam] = useTimeLockPuzzleSnarkParamManager()

  useEffect(() => {
    if (!timeLockPuzzleParam) {
      fetchTimeLockPuzzleParam((newParam: boolean) => {
        updateTimeLockPuzzleParam(newParam)
      })
    }
  }, [timeLockPuzzleParam, updateTimeLockPuzzleParam])

  useEffect(() => {
    if (!timeLockPuzzleSnarkParam) {
      fetchTimeLockPuzzleSnarkParam((newParam: boolean) => {
        updateTimeLockPuzzleSnarkParam(newParam)
      })
    }
  }, [updateTimeLockPuzzleSnarkParam, timeLockPuzzleSnarkParam])

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

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const { address: recipientAddress } = useENSAddress(recipient)

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
  const priceImpact = useMemo(
    () => (routeIsSyncing ? undefined : computeFiatValuePriceImpact(fiatValueInput, fiatValueOutput)),
    [fiatValueInput, fiatValueOutput, routeIsSyncing]
  )

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      onUserInput(Field.OUTPUT, value)
    },
    [onUserInput]
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    history.push('/swap/')
  }, [history])

  // modal and loading
  const [
    { showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash, swapResponse, showTimeLockPuzzle },
    setSwapState,
  ] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
    swapResponse: RadiusSwapResponse | undefined
    showTimeLockPuzzle: boolean
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
    swapResponse: undefined,
    showTimeLockPuzzle: false,
  })

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

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

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
  const showMaxButton = true // Boolean(maxInputAmount?.greaterThan(0) && !parsedAmounts[Field.INPUT]?.equalTo(maxInputAmount))

  const sigHandler = () => {
    setSwapState({
      attemptingTxn: false,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash,
      swapResponse: undefined,
      showTimeLockPuzzle: true,
    })
  }

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    approvalOptimizedTrade,
    allowedSlippage,
    recipient,
    signatureData,
    sigHandler,
    parameters
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (priceImpact && !confirmPriceImpactWithoutFee(priceImpact)) {
      return
    }

    setSwapState({
      attemptingTxn: true,
      tradeToConfirm,
      showConfirm,
      swapErrorMessage: undefined,
      txHash: undefined,
      swapResponse: undefined,
      showTimeLockPuzzle: false,
    })
    swapCallback()
      .then((res) => {
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm: false,
          swapErrorMessage: undefined,
          txHash: 'test',
          swapResponse: res,
          showTimeLockPuzzle,
        })
        // ReactGA.event({
        //   category: 'Swap',
        //   action:
        //     recipient === null
        //       ? 'Swap w/o Send'
        //       : (recipientAddress ?? recipient) === account
        //       ? 'Swap w/o Send + recipient'
        //       : 'Swap w/ Send',
        //   label: [
        //     approvalOptimizedTradeString,
        //     approvalOptimizedTrade?.inputAmount?.currency?.symbol,
        //     approvalOptimizedTrade?.outputAmount?.currency?.symbol,
        //     'MH',
        //   ].join('/'),
        // })
      })
      .catch((error) => {
        dispatch(setProgress({ newParam: 0 }))
        console.log(error.message)
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm: false,
          swapErrorMessage: error.message,
          txHash: undefined,
          swapResponse: undefined,
          showTimeLockPuzzle,
        })
      })
  }, [
    swapCallback,
    priceImpact,
    tradeToConfirm,
    showConfirm,
    recipient,
    recipientAddress,
    account,
    approvalOptimizedTradeString,
    approvalOptimizedTrade?.inputAmount?.currency?.symbol,
    approvalOptimizedTrade?.outputAmount?.currency?.symbol,
    showTimeLockPuzzle,
  ])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

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
    setSwapState({
      showConfirm: false,
      tradeToConfirm,
      attemptingTxn,
      swapErrorMessage,
      txHash,
      swapResponse,
      showTimeLockPuzzle,
    })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, showTimeLockPuzzle, swapErrorMessage, swapResponse, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({
      tradeToConfirm: trade,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
      swapResponse,
      showTimeLockPuzzle,
    })
  }, [attemptingTxn, showConfirm, showTimeLockPuzzle, swapErrorMessage, swapResponse, trade, txHash])

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
    (outputCurrency) => onCurrencySelection(Field.OUTPUT, outputCurrency),
    [onCurrencySelection]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  const priceImpactTooHigh = priceImpactSeverity > 3 && !isExpertMode

  useEffect(() => {
    const a = !(!isValid || routeIsSyncing || routeIsLoading || !!swapCallbackError)
    const b = !toggle
    if (a && b) {
      controls.start((i) => {
        switch (i) {
          case 'out':
            return { height: '24px', padding: '6px', transition: { duration: 0.3 } }
          case 'in':
            return { height: '12px', transition: { duration: 0.4 } }
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
            return { height: '0px', transition: { delay: 0.4, duration: 0.3 } }
          case 'paper':
            return { height: '0px', opacity: 0, transition: { duration: 0.3 } }
          default:
            return { height: '0px', opacity: 0, transition: { duration: 0.3 } }
        }
      })
      setToggle(false)
    }
  }, [isValid, routeIsSyncing, routeIsLoading, swapCallbackError, controls])

  const minimum = trade
    ?.minimumAmountOut(new Percent((100 - parseInt(allowedSlippage.toSignificant())).toString()))
    .multiply('100')
    .toSignificant()
    .toString()

  function openProgress() {
    dispatch(setProgress({ newParam: 2 }))
    setSwapState({
      tradeToConfirm: trade,
      swapErrorMessage,
      txHash,
      attemptingTxn,
      showConfirm,
      swapResponse,
      showTimeLockPuzzle,
    })
  }

  return (
    <>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <HistoryModal isOpen={showHistory} onDismiss={() => setShowHistory(false)} />
      <AppBody>
        {/* <button onClick={() => addPending()}>inputPending</button>
        <button onClick={() => addTxHistory()}>inputTx</button>
        <button onClick={() => showDB()}>log</button>
        <button onClick={() => showModal()}>modal</button>
        <button onClick={() => showPopUp()}>popup</button>
        <button onClick={() => showReimbursementModal()}>reimbursement</button>
        <button onClick={() => showCancel()}>cancel</button> */}
        <button onClick={() => openProgress()}>Open Progress</button>
        <div
          style={{
            background: '#000000',
            borderRadius: '6px',
            padding: '4px',
            border: '1.5px solid #5560a3',
          }}
        >
          <SwapHeader allowedSlippage={allowedSlippage} />
          <Wrapper id="swap-page">
            <ConfirmSwapModal
              isOpen={showConfirm}
              trade={trade}
              originalTrade={tradeToConfirm}
              inputCurrency={currencies[Field.INPUT]}
              outputCurrency={currencies[Field.OUTPUT]}
              onAcceptChanges={handleAcceptChanges}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              allowedSlippage={allowedSlippage}
              onConfirm={handleSwap}
              swapErrorMessage={swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              swapResponse={swapResponse}
              showTimeLockPuzzle={showTimeLockPuzzle}
            />
            <ReimbursementModal
              isOpen={reimbursement !== 0}
              historyId={reimbursement}
              onDismiss={() => setReimbursement(0)}
            />
            <CancelSuggestModal isOpen={cancel !== 0} readyTxId={cancel} onDismiss={() => setCancel(0)} />
            <AutoColumn gap={'sm'}>
              <div style={{ display: 'relative' }}>
                <CurrencyInputPanel
                  label={
                    independentField === Field.OUTPUT && !showWrap ? <Trans>From (at most)</Trans> : <Trans>From</Trans>
                  }
                  value={formattedAmounts[Field.INPUT]}
                  showMaxButton={showMaxButton}
                  currency={currencies[Field.INPUT]}
                  onUserInput={handleTypeInput}
                  onMax={handleMaxInput}
                  onHalf={handleHalfInput}
                  fiatValue={fiatValueInput ?? undefined}
                  onCurrencySelect={handleInputSelect}
                  otherCurrency={currencies[Field.OUTPUT]}
                  showCommonBases={false}
                  id="swap-currency-input"
                  loading={independentField === Field.OUTPUT && routeIsSyncing}
                />
                <ArrowWrapper clickable>
                  <div style={{ position: 'absolute', margin: '4px' }}>
                    <BsArrowDownUp
                      size="16"
                      color={
                        '#ffffff' /*currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.text1 : theme.text3*/
                      }
                    />
                  </div>
                  <FadeWrapper>
                    <RotateWrapper>
                      <BsArrowDown
                        size="16"
                        onClick={() => {
                          setApprovalSubmitted(false) // reset 2 step UI for approvals
                          onSwitchTokens()
                        }}
                        color={
                          '#ffffff' /*currencies[Field.INPUT] && currencies[Field.OUTPUT] ? theme.text1 : theme.text3*/
                        }
                      />
                    </RotateWrapper>
                  </FadeWrapper>
                </ArrowWrapper>
                <CurrencyInputPanel
                  value={formattedAmounts[Field.OUTPUT]}
                  onUserInput={handleTypeOutput}
                  label={
                    independentField === Field.INPUT && !showWrap ? <Trans>To (at least)</Trans> : <Trans>To</Trans>
                  }
                  showMaxButton={false}
                  hideBalance={false}
                  fiatValue={fiatValueOutput ?? undefined}
                  priceImpact={priceImpact}
                  currency={currencies[Field.OUTPUT]}
                  onCurrencySelect={handleOutputSelect}
                  otherCurrency={currencies[Field.INPUT]}
                  showCommonBases={false}
                  id="swap-currency-output"
                  loading={independentField === Field.INPUT && routeIsSyncing}
                />
              </div>
            </AutoColumn>
          </Wrapper>
        </div>

        <div style={{ margin: '10px 35px 0px 35px' }}>
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
          {!showWrap && userHasSpecifiedInputOutput && (trade || routeIsLoading || routeIsSyncing) && (
            <SwapDetailsDropdown
              trade={trade}
              syncing={routeIsSyncing}
              loading={routeIsLoading}
              showInverted={showInverted}
              setShowInverted={setShowInverted}
              allowedSlippage={allowedSlippage}
            />
          )}
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
                        {approvalState === ApprovalState.APPROVED || signatureState === UseERC20PermitState.SIGNED ? (
                          <Trans>You can now trade {currencies[Field.INPUT]?.symbol}</Trans>
                        ) : (
                          <Trans>Allow the 360° to use your {currencies[Field.INPUT]?.symbol}</Trans>
                        )}
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
                  dispatch(setProgress({ newParam: 0 }))
                  if (isExpertMode) {
                    handleSwap()
                  } else {
                    setSwapState({
                      tradeToConfirm: trade,
                      attemptingTxn: false,
                      swapErrorMessage: undefined,
                      showConfirm: true,
                      txHash: undefined,
                      swapResponse: undefined,
                      showTimeLockPuzzle: false,
                    })
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
            {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
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
            }}
          >
            <motion.div
              custom={'in'}
              animate={controls}
              initial={{ height: '0px' }}
              style={{
                background: 'black',
                width: '98%',
                height: '12px',
              }}
            ></motion.div>
          </motion.div>
        </div>
      </AppBody>
      <motion.div
        custom={'paper'}
        animate={controls}
        initial={{ height: '0px', opacity: 0 }}
        style={{
          background: 'linear-gradient(180deg, #000000 0%, #cdcdcd 6.31%)',
          overflow: 'hidden',
          maxWidth: '400px',
          width: '80%',
          transform: 'translateY(-30px) perspective(4.0em) rotateX(1deg)',
          padding: '24px',
          zIndex: 300,
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
          <div
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            You receive minimum{' '}
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
          <div>
            Slippage Tolerance{' '}
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
          <div>
            Price Impact{' '}
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
                <span style={{ fontSize: '12', fontWeight: 'bold' }}>{trade?.priceImpact.toSignificant(3) + ' %'}</span>
              </div>
            ) : (
              <div style={{ color: '#008c27', fontSize: '12', fontWeight: 'bold' }}>
                {trade?.priceImpact.toSignificant(3) + ' %'}
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
    </>
  )
}
function dispatch(arg0: any) {
  throw new Error('Function not implemented.')
}
