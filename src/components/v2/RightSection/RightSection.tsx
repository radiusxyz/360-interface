import { PrimaryButton, SelectTokenButton } from '../UI/Buttons'
import { NumericInput } from '../UI/Inputs'

import {
  Header,
  Aligner,
  ButtonAndBalanceWrapper,
  Cog,
  HeaderTitle,
  MainWrapper,
  SlippageOption,
  SlippageOptions,
  TokenName,
  TokenWrapper,
  TopTokenRow,
  Balance,
  Circle,
  BottomTokenRow,
  ButtonRow,
  InfoMainWrapper,
  InfoRowWrapper,
  Description,
  ValueAndIconWrapper,
  ImpactAmount,
  InfoIcon,
  Divider,
  MinimumAmount,
} from './RightSectionStyles'

import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParameters } from 'state/parameters/hooks'

import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useERC20PermitFromTrade, UseERC20PermitState } from 'hooks/useERC20Permit'
import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { warningSeverity } from 'utils/prices'
import { useCurrency } from '../../../hooks/Tokens'
import { useContext } from 'react'
import SwapContext from 'store/swap-context'
import TradePrice from '../../../components/swap/TradePrice'

// eslint-disable-next-line import/no-webpack-loader-syntax
import Settings from '../Settings/Settings'
import { useExpertModeManager } from 'state/user/hooks'
import CurrencyLogo from 'components/CurrencyLogo'
import useCurrencyBalance from 'lib/hooks/useCurrencyBalance'

export const RightSection = () => {
  const swapCTX = useContext(SwapContext)
  const {
    swapParams,
    updateSwapParams,
    handleSwapParams,
    handleLeftSection,
    isAActive,
    handleSetIsAActive,
    isBActive,
    handleSetIsBActive,
    leftSection,
    isASelected,
    isBSelected,
  } = swapCTX

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const [accountWhiteList, setAccountWhiteList] = useState<boolean>(false)

  const { account } = useActiveWeb3React()

  const parameters = useParameters()

  // TODO:
  const backerIntegrity = true

  // swap state
  const { independentField, typedValue, recipient, INPUT, OUTPUT } = useSwapState()

  const inputCurrency = useCurrency(INPUT.currencyId) || undefined
  const outputCurrency = useCurrency(OUTPUT.currencyId) || undefined

  const {
    trade: { trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
  } = useDerivedSwapInfo()

  const minimum = trade?.minimumAmountOut(allowedSlippage).toSignificant(6).toString()

  const parsedAmounts = {
    [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
    [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
  }

  const priceImpact = trade?.priceImpact

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
    },
    [onUserInput]
  )

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    }),
    [dependentField, independentField, parsedAmounts, typedValue]
  )

  ///////////////////////////////
  // approve
  ///////////////////////////////
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
    }
  }, [
    signatureState,
    gatherPermitSignature,
    approveCallback,
    approvalOptimizedTradeString,
    approvalOptimizedTrade?.inputAmount?.currency.symbol,
  ])

  ///////////////////////////////
  // Check Account in Whitelist
  ///////////////////////////////

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
  const {} = useSwapCallback(
    approvalOptimizedTrade,
    allowedSlippage,
    backerIntegrity, //backer integrity
    recipient,
    signatureData,
    parameters
  )

  const [isExpertMode] = useExpertModeManager()

  // TODO: price impact dangerous level
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

  const [showSettings, setShowSettings] = useState(false)
  const [showInverted, setShowInverted] = useState<boolean>(false)
  const [maxSelected, setMaxSelected] = useState(false)
  const [halfSelected, setHalfSelected] = useState(false)
  const [clearSelected, setClearSelected] = useState(false)

  const handleMaxInput = useCallback(() => {
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.toExact())
    setMaxSelected((prevState) => !prevState)
    setHalfSelected(false)
  }, [maxInputAmount, onUserInput])

  const handleHalfInput = useCallback(() => {
    setHalfSelected((prevState) => !prevState)
    setMaxSelected(false)
    maxInputAmount && onUserInput(Field.INPUT, maxInputAmount.divide(2).toExact())
  }, [maxInputAmount, onUserInput])

  const handleClear = useCallback(() => {
    setClearSelected((prevState) => !prevState)
    setMaxSelected(false)
    setHalfSelected(false)
    maxInputAmount && onUserInput(Field.INPUT, formattedAmounts[Field.INPUT])
  }, [maxInputAmount, onUserInput])

  const handleShowSettings = () => {
    setShowSettings((prevState) => !prevState)
  }

  const openInputTokenSelect = () => {
    handleSetIsBActive(false)
    handleSetIsAActive(true)
  }

  const openOutputTokenSelect = () => {
    handleSetIsAActive(false)
    handleSetIsBActive(true)
  }

  useEffect(() => {
    if (trade && leftSection === 'welcome') {
      handleLeftSection('preview')
    }
  }, [trade, leftSection, handleLeftSection])

  useEffect(() => {
    if (isAActive || isBActive) {
      handleLeftSection('search-table')
    }
  }, [isAActive, isBActive, handleLeftSection])

  const balanceInput = useCurrencyBalance(account ?? undefined, inputCurrency)
  const balanceOutput = useCurrencyBalance(account ?? undefined, outputCurrency)

  return leftSection === 'progress' || leftSection === 'almost-there' ? (
    <></>
  ) : !showSettings ? (
    <MainWrapper>
      <Header>
        <HeaderTitle>Swap</HeaderTitle>
        <Cog onClick={handleShowSettings} />
      </Header>
      <TopTokenRow>
        {(isASelected || isBSelected) && (
          <SlippageOptions>
            <SlippageOption selected={maxSelected} onClick={handleMaxInput}>
              MAX
            </SlippageOption>
            <SlippageOption selected={halfSelected} onClick={handleHalfInput}>
              50%
            </SlippageOption>
            <SlippageOption onClick={handleClear}>Clear</SlippageOption>
          </SlippageOptions>
        )}
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isASelected} onClick={openInputTokenSelect}>
              {isASelected ? (
                <TokenWrapper>
                  <CurrencyLogo currency={inputCurrency} size={'28px'} />
                  <TokenName>{inputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isASelected && balanceInput && <Balance>Balance: {balanceInput.toSignificant(4)}</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput value={formattedAmounts[Field.INPUT]} onUserInput={handleTypeInput} isSelected={isASelected} />
        </Aligner>
        <Circle />
      </TopTokenRow>
      <BottomTokenRow>
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isBSelected} onClick={openOutputTokenSelect}>
              {isBSelected ? (
                <TokenWrapper>
                  <CurrencyLogo currency={outputCurrency} size={'28px'} />
                  <TokenName>{outputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isBSelected && balanceOutput && <Balance>Balance: {balanceOutput.toSignificant(4)}</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={() => {
              return
            }}
            isSelected={isASelected}
          />
        </Aligner>
      </BottomTokenRow>
      <ButtonRow>
        {trade && (
          <InfoMainWrapper>
            <InfoRowWrapper>
              <Description>You receive minimum</Description>
              <ValueAndIconWrapper>
                <MinimumAmount> {minimum && minimum + ' ' + trade?.outputAmount.currency.symbol}</MinimumAmount>
                <InfoIcon />
              </ValueAndIconWrapper>
            </InfoRowWrapper>
            <Divider />
            <InfoRowWrapper>
              <Description>Price impact</Description>
              <ValueAndIconWrapper>
                <ImpactAmount priceImpactTooHigh={priceImpactTooHigh ? 1 : 0}>
                  {priceImpact?.toSignificant(3) + ' %' + `${priceImpactTooHigh ? ' (Too High)' : ''}`}
                </ImpactAmount>
                <InfoIcon />
              </ValueAndIconWrapper>
            </InfoRowWrapper>
          </InfoMainWrapper>
        )}
        {!accountWhiteList && (
          <PrimaryButton mrgn="0px 0px 12px 0px" disabled>
            you are not in whitelist
          </PrimaryButton>
        )}
        {accountWhiteList && (
          <PrimaryButton
            disabled={trade ? false : true}
            mrgn="0px 0px 12px 0px"
            onClick={() => {
              updateSwapParams({ start: true })
            }}
          >
            Swap
          </PrimaryButton>
        )}

        {trade && (
          <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
        )}
      </ButtonRow>
    </MainWrapper>
  ) : (
    <Settings placeholderSlippage={allowedSlippage} handleShowSettings={handleShowSettings} isSelected={false} />
  )
}

export default RightSection
