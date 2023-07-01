import { useCallback, useEffect, useMemo } from 'react'
import { Currency } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { ParsedQs } from 'qs'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import useENS from '../../hooks/useENS'
import useParsedQueryString from '../../hooks/useParsedQueryString'
import { isAddress } from '../../utils'
import { AppState } from '../index'
// import { useCurrencyBalances } from '../wallet/hooks'
import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies, typeInput } from './actions'
import { SwapState } from './reducer'

export function useSwapState(): AppState['swap'] {
  return useAppSelector((state) => state.swap)
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void
  onSwitchTokens: () => void
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useAppDispatch()
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency | null) => {
      if (currency !== null) {
        dispatch(
          selectCurrency({
            field,
            currencyId: currency.isToken ? currency.address : currency.isNative ? 'ETH' : '',
          })
        )
      } else {
        dispatch(
          selectCurrency({
            field,
            currencyId: '',
          })
        )
      }
    },
    [dispatch]
  )

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies())
  }, [dispatch])

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
  }
}

const BAD_RECIPIENT_ADDRESSES: { [address: string]: true } = {
  '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f': true, // v2 factory
  '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a': true, // v2 router 01
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': true, // v2 router 02
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): boolean {
  const { recipient } = useSwapState()

  const recipientLookup = useENS(recipient ?? undefined)
  console.log('useDerivedSwapInfo')

  // const relevantTokenBalances = useCurrencyBalances(
  //   account ?? undefined,
  //   useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency])
  // )

  /*   const isExactIn: boolean = independentField === Field.INPUT

  const parsedAmount = useMemo(
    () => tryParseCurrencyAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined),
    [inputCurrency, isExactIn, outputCurrency, typedValue]
  )

  const trade = useBestTrade(
    isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    parsedAmount,
    (isExactIn ? outputCurrency : inputCurrency) ?? undefined
  ) */

  // console.log('TradeType', isExactIn, parsedAmount, inputCurrency, outputCurrency)

  // const currencyBalances = useMemo(
  //   () => ({
  //     [Field.INPUT]: relevantTokenBalances[0],
  //     [Field.OUTPUT]: relevantTokenBalances[1],
  //   }),
  //   [relevantTokenBalances]
  // )

  // const currencies: { [field in Field]?: Currency | null } = useMemo(
  //   () => ({
  //     [Field.INPUT]: inputCurrency,
  //     [Field.OUTPUT]: outputCurrency,
  //   }),
  //   [inputCurrency, outputCurrency]
  // )

  // allowed slippage is either auto slippage, or custom user defined slippage if auto slippage disabled

  /*   const inputError = useMemo(() => {
    let inputError: ReactNode | undefined

    if (!account) {
      inputError = <Trans>Connect Wallet</Trans>
    }

    // if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    //   inputError = inputError ?? <Trans>Select a token</Trans>
    // }

    if (!parsedAmount) {
      inputError = inputError ?? <Trans>Enter an amount</Trans>
    }

    const formattedTo = isAddress(to)
    if (!to || !formattedTo) {
      inputError = inputError ?? <Trans>Enter a recipient</Trans>
    } else {
      if (BAD_RECIPIENT_ADDRESSES[formattedTo]) {
        inputError = inputError ?? <Trans>Invalid recipient</Trans>
      }
    }

    // compare input balance to max input based on version
    // const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade.trade?.maximumAmountIn(allowedSlippage)]

    // if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    //   inputError = <Trans>Insufficient {amountIn.currency.symbol} balance</Trans>
    // }

    return inputError
  }, [account, allowedSlippage, parsedAmount, to]) */

  /* useEffect(() => {
    console.log('useDerivedSwapInfo')
  }, [
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    trade,
    allowedSlippage,
    account,
    independentField,
    typedValue,
    inputCurrencyId,
    outputCurrencyId,
    recipient,
    inputCurrency,
    outputCurrency,
    recipientLookup,
    to,
    relevantTokenBalances,
    isExactIn,
    parsedAmount,
    trade,
    currencyBalances,
    currencies,
    inputCurrency,
    outputCurrency,
    autoSlippageTolerance,
    allowedSlippage,
    inputError,
    Field.INPUT,
    Field.OUTPUT,
    TradeType.EXACT_OUTPUT,
    TradeType.EXACT_INPUT,
  ]) */
  return true
}

function parseCurrencyFromURLParameter(urlParam: ParsedQs[string]): string {
  if (typeof urlParam === 'string') {
    const valid = isAddress(urlParam)
    if (valid) return valid
    const upper = urlParam.toUpperCase()
    if (upper === 'ETH') return 'ETH'
    if (upper in TOKEN_SHORTHANDS) return upper
  }
  return ''
}

function parseTokenAmountURLParameter(urlParam: any): string {
  return typeof urlParam === 'string' && !isNaN(parseFloat(urlParam)) ? urlParam : ''
}

function parseIndependentFieldURLParameter(urlParam: any): Field {
  return typeof urlParam === 'string' && urlParam.toLowerCase() === 'output' ? Field.OUTPUT : Field.INPUT
}

const ENS_NAME_REGEX = /^[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)?$/
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/
function validatedRecipient(recipient: any): string | null {
  if (typeof recipient !== 'string') return null
  const address = isAddress(recipient)
  if (address) return address
  if (ENS_NAME_REGEX.test(recipient)) return recipient
  if (ADDRESS_REGEX.test(recipient)) return recipient
  return null
}

export function queryParametersToSwapState(parsedQs: ParsedQs): SwapState {
  let inputCurrency = parseCurrencyFromURLParameter(parsedQs.inputCurrency)
  let outputCurrency = parseCurrencyFromURLParameter(parsedQs.outputCurrency)
  const typedValue = parseTokenAmountURLParameter(parsedQs.exactAmount)
  const independentField = parseIndependentFieldURLParameter(parsedQs.exactField)

  if (inputCurrency === '' && outputCurrency === '' && typedValue === '' && independentField === Field.INPUT) {
    // Defaults to having the native currency selected
    inputCurrency = ''
  } else if (inputCurrency === outputCurrency) {
    // clear output if identical
    outputCurrency = ''
  }

  const recipient = validatedRecipient(parsedQs.recipient)

  return {
    [Field.INPUT]: {
      currencyId: inputCurrency === '' ? null : inputCurrency ?? null,
    },
    [Field.OUTPUT]: {
      currencyId: outputCurrency === '' ? null : outputCurrency ?? null,
    },
    typedValue,
    independentField,
    recipient,
  }
}

// updates the swap state to use the defaults for a given network
export function useDefaultsFromURLSearch(): SwapState {
  const { chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const parsedQs = useParsedQueryString()

  const parsedSwapState = useMemo(() => {
    return queryParametersToSwapState(parsedQs)
  }, [parsedQs])

  useEffect(() => {
    if (!chainId) return
    const inputCurrencyId = parsedSwapState[Field.INPUT].currencyId ?? undefined
    const outputCurrencyId = parsedSwapState[Field.OUTPUT].currencyId ?? undefined

    dispatch(
      replaceSwapState({
        typedValue: parsedSwapState.typedValue,
        field: parsedSwapState.independentField,
        inputCurrencyId,
        outputCurrencyId,
        recipient: parsedSwapState.recipient,
      })
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, chainId])

  return parsedSwapState
}

/* 
TransactionSummary

  Transaction.tsx
    AccountDetails
      WalletModal
        Web3Status
          src/components/header - not used
          AppBar

  TransactionPopup
    PopupItem
      src/components/Popups - App.tsx - not used
      src/pages/App.tsx - not used

  TransactionConfirmationModal/index.tsx
    ConfirmSwapModal
      pages/swap - not-used
      
      

Web3Status
  done

useENSAvatar
  Identicon - deleted
  

*/
