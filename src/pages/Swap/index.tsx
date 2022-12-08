import { Trans } from '@lingui/macro'
import contractsAddress from '@radiusxyz/tex-contracts-migration/contracts.json'
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
import { fetchVdfParam, fetchVdfSnarkParam } from 'state/parameters/fetch'
import { useParametersManager, useVdfParamManager, useVdfSnarkParamManager } from 'state/parameters/hooks'
import { TradeState } from 'state/routing/types'
import styled, { ThemeContext } from 'styled-components/macro'

import AddressInputPanel from '../../components/AddressInputPanel'
import { ButtonConfirmed, ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import CurrencyLogo from '../../components/CurrencyLogo'
import Loader from '../../components/Loader'
import { AutoRow } from '../../components/Row'
import confirmPriceImpactWithoutFee from '../../components/swap/confirmPriceImpactWithoutFee'
import ConfirmSwapModal from '../../components/swap/ConfirmSwapModal'
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
import { useAllTransactions } from '../../state/transactions/hooks'
import { addTransaction } from '../../state/transactions/reducer'
import { TransactionType } from '../../state/transactions/types'
import { useExpertModeManager } from '../../state/user/hooks'
import { LinkStyledButton, ThemedText } from '../../theme'
import { computeFiatValuePriceImpact } from '../../utils/computeFiatValuePriceImpact'
import { db, Status } from '../../utils/db'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { warningSeverity } from '../../utils/prices'
import { supportedChainId } from '../../utils/supportedChainId'
import AppBody from '../AppBody'

const AlertWrapper = styled.div`
  max-width: 460px;
  width: 100%;
`

const SwapButtonConfirmed = styled(ButtonConfirmed)`
  margin: 10px 0px 16px 0px;
  background: linear-gradient(97deg, #00ff57 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  border: 0px solid #fff;
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
  const addPending = async () => {
    await db.pendingTxs.add({
      sendDate: Date.now(),
      tx: '{}',
      round: 3,
      order: 4,
      mimcHash: 'mimcHash',
      txHash: 'txHash',
      proofHash: 'proofHash',
      operatorSignature: { r: 'r', s: 's', v: 27 },
    })
  }

  const addTx = async () => {
    await db.txHistory.add({
      round: 3,
      order: 5,
      txId: 'txId',
      txDate: Date.now(),
      from: { token: 'fromToken', amount: '123000000000000000000' },
      to: { token: 'toToken', amount: '321000000000000000000' },
      status: Status.COMPLETED,
    })
  }

  const showDB = async () => {
    const keys = await db.pendingTxs.toCollection().keys()
    const got = await db.pendingTxs.get(keys[0])
    console.log(got)
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

  // const dispatch = useAppDispatch()

  const allTransactions = useAllTransactions()
  // const recorderContract = useRecorderContract() as Contract

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

  const [parameters, updateParameters] = useParametersManager()
  const [vdfParam, updateVdfParam] = useVdfParamManager()
  const [vdfSnarkParam, updateVdfSnarkParam] = useVdfSnarkParamManager()

  useEffect(() => {
    if (!vdfParam) {
      fetchVdfParam((newParam: boolean) => {
        updateVdfParam(newParam)
      })
    }
  }, [vdfParam, updateVdfParam])

  useEffect(() => {
    if (!vdfSnarkParam) {
      fetchVdfSnarkParam((newParam: boolean) => {
        updateVdfSnarkParam(newParam)
      })
    }
  }, [updateVdfSnarkParam, vdfSnarkParam])

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
    { showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash, swapResponse, showVdf },
    setSwapState,
  ] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade<Currency, Currency, TradeType> | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
    swapResponse: RadiusSwapResponse | undefined
    showVdf: boolean
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
    swapResponse: undefined,
    showVdf: false,
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
      showVdf: true,
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
      showVdf: false,
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
          showVdf,
        })
        ReactGA.event({
          category: 'Swap',
          action:
            recipient === null
              ? 'Swap w/o Send'
              : (recipientAddress ?? recipient) === account
              ? 'Swap w/o Send + recipient'
              : 'Swap w/ Send',
          label: [
            approvalOptimizedTradeString,
            approvalOptimizedTrade?.inputAmount?.currency?.symbol,
            approvalOptimizedTrade?.outputAmount?.currency?.symbol,
            'MH',
          ].join('/'),
        })

        // TODO: add transaction to db and tracking execute result.
        // TODO: if tx success, remove tx and add result to db for history

        setTimeout(() => {
          const getTxIdPolling = setInterval(async () => {
            const roundResponse = await fetch(
              `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${contractsAddress.router}&round=${res.data.txOrderMsg.round}`
            )
            if (roundResponse.ok) {
              roundResponse.json().then(async (json) => {
                if (json?.txHash) {
                  clearInterval(getTxIdPolling)

                  // // TODO: 수동 cancel 버튼
                  // // TODO: Contract에서 getArray 함수 요청하기
                  // const txIdList = recorderContract.getRoundTxIdList(json.round)
                  // let currXor = JSBI.BigInt(txIdList[0])
                  // for (let i = 1; i < json.order - 1; i++) {
                  //   currXor = JSBI.bitwiseXor(currXor, JSBI.BigInt(txIdList[i]))
                  // }

                  // if (txIdList[json.order] !== res.txOrderMsg.txHash || currXor !== JSBI.BigInt(json.proofHash)) {
                  //   // TODO: go to challenge
                  //   console.log('there is problem. try challenge?')
                  // }

                  if (!allTransactions[json.txHash]) {
                    let input = approvalOptimizedTrade?.inputAmount?.numerator
                    let output = approvalOptimizedTrade?.outputAmount?.numerator
                    input = !input ? JSBI.BigInt(0) : input
                    output = !output ? JSBI.BigInt(0) : output

                    dispatch(
                      addTransaction({
                        hash: json.txHash,
                        from: account,
                        info: {
                          type: TransactionType.SWAP,
                          tradeType: TradeType.EXACT_OUTPUT,
                          inputCurrencyId: approvalOptimizedTrade?.inputAmount?.currency?.wrapped.address,
                          outputCurrencyId: approvalOptimizedTrade?.outputAmount?.currency?.wrapped.address,
                          outputCurrencyAmountRaw: output.toString(),
                          expectedInputCurrencyAmountRaw: input.toString(),
                          maximumInputCurrencyAmountRaw: '0',
                        },
                        chainId,
                      })
                    )

                    dispatch(
                      addPopup({
                        content: {
                          txn: { hash: json.txHash },
                        },
                        key: `this-is-popup`,
                        removeAfterMs: 10000,
                      })
                    )
                  }
                }
              })
            }
          }, 500)
          setTimeout(() => {
            clearInterval(getTxIdPolling)
          }, 30000)
        }, 10000)
      })
      .catch((error) => {
        console.log(error.message)
        // TODO: toss to send cancel tx page
        setSwapState({
          attemptingTxn: false,
          tradeToConfirm,
          showConfirm,
          swapErrorMessage: error.message,
          txHash: undefined,
          swapResponse: undefined,
          showVdf,
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
    showVdf,
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
    setSwapState({ showConfirm: false, tradeToConfirm, attemptingTxn, swapErrorMessage, txHash, swapResponse, showVdf })
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.INPUT, '')
    }
  }, [attemptingTxn, onUserInput, showVdf, swapErrorMessage, swapResponse, tradeToConfirm, txHash])

  const handleAcceptChanges = useCallback(() => {
    setSwapState({ tradeToConfirm: trade, swapErrorMessage, txHash, attemptingTxn, showConfirm, swapResponse, showVdf })
  }, [attemptingTxn, showConfirm, showVdf, swapErrorMessage, swapResponse, trade, txHash])

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
            return { height: '200px', opacity: 1, transition: { delay: 0.5, duration: 0.3 } }
          default:
            return { height: '200px', opacity: 1, transition: { delay: 0.5, duration: 0.3 } }
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

  return (
    <>
      <TokenWarningModal
        isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
        tokens={importTokensNotInDefault}
        onConfirm={handleConfirmTokenWarning}
        onDismiss={handleDismissTokenWarning}
      />
      <AppBody>
        <button onClick={() => addPending()}>inputPending</button>
        <button onClick={() => addTx()}>inputTx</button>
        <button onClick={() => showDB()}>log</button>
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
              onAcceptChanges={handleAcceptChanges}
              attemptingTxn={attemptingTxn}
              txHash={txHash}
              recipient={recipient}
              allowedSlippage={allowedSlippage}
              onConfirm={handleSwap}
              swapErrorMessage={swapErrorMessage}
              onDismiss={handleConfirmDismiss}
              swapResponse={swapResponse}
              showVdf={showVdf}
            />

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
                    <AutoRow justify="space-between" style={{ flexWrap: 'nowrap' }}>
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
                          <Trans>Allow the 360° Protocol to use your {currencies[Field.INPUT]?.symbol}</Trans>
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
                  <SwapButtonError
                    onClick={() => {
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
                          showVdf: false,
                        })
                      }
                    }}
                    width="100%"
                    id="swap-button"
                    disabled={
                      !isValid ||
                      routeIsSyncing ||
                      routeIsLoading ||
                      (approvalState !== ApprovalState.APPROVED && signatureState !== UseERC20PermitState.SIGNED) ||
                      priceImpactTooHigh
                    }
                    error={isValid && priceImpactSeverity > 2}
                  >
                    <Text fontSize={16} fontWeight={500}>
                      {priceImpactTooHigh ? (
                        <Trans>High Price Impact</Trans>
                      ) : trade && priceImpactSeverity > 2 ? (
                        <Trans>Swap Anyway</Trans>
                      ) : (
                        <Trans>Swap</Trans>
                      )}
                    </Text>
                  </SwapButtonError>
                </AutoColumn>
              </AutoRow>
            ) : (
              <SwapButtonError
                onClick={() => {
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
                      showVdf: false,
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
          transform: 'translateY(-30px) perspective(4.0em) rotateX(2deg)',
          padding: '24px',
          zIndex: 300,
          opacity: 1,
        }}
      >
        <div
          style={{
            color: '#333333',
            fontWeight: 'bold',
            fontSize: '12',
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
            <Info
              style={{
                stroke: '1px',
                width: '18px',
                height: '18px',
              }}
            />
          </div>
          <div>{minimum && minimum + trade?.outputAmount.currency.symbol}</div>
        </div>
        <div
          style={{
            color: '#333333',
            fontWeight: 'normal',
            fontSize: '12',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            padding: '4px',
          }}
        >
          <div>
            Slippage Tolerance{' '}
            <Info
              style={{
                stroke: '1px',
                width: '18px',
                height: '18px',
              }}
            />
          </div>
          <div>{allowedSlippage.toSignificant()}%</div>
        </div>
        <div
          style={{
            color: '#333333',
            fontWeight: 'normal',
            fontSize: '12',
            justifyContent: 'space-between',
            display: 'flex',
            flexDirection: 'row',
            padding: '4px',
          }}
        >
          <div>
            Price Impact{' '}
            <Info
              style={{
                stroke: '1px',
                width: '18px',
                height: '18px',
              }}
            />
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
            fontSize: '12',
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
