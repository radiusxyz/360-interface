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
  Logo,
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

import { Contract } from '@ethersproject/contracts'
import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import { domain, SWAP_TYPE } from 'constants/eip712'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import localForage from 'localforage'
import { MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppDispatch } from 'state/hooks'
import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
import { useParameters } from 'state/parameters/hooks'
import { setTimeLockPuzzleParam, setTimeLockPuzzleSnarkParam, TimeLockPuzzleParam } from 'state/parameters/reducer'

import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useV2RouterContract } from 'hooks/useContract'
import { useERC20PermitFromTrade, UseERC20PermitState } from 'hooks/useERC20Permit'
import { useUSDCValue } from 'hooks/useUSDCPrice'
import { EncryptedSwapTx, TxInfo } from 'lib/hooks/swap/useSendSwapTransaction'
import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { warningSeverity } from 'utils/prices'
import { useAllLists } from 'state/lists/hooks'
import { useCurrency } from 'hooks/Tokens'
import { useContext } from 'react'
import SwapContext from 'store/swap-context'
import TradePrice from '../../../components/swap/TradePrice'

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!workers/worker'
import Settings from '../Settings/Settings'
import { useExpertModeManager } from 'state/user/hooks'

const MAXIMUM_PATH_LENGTH = 3
const swapExactTokensForTokens = '0x73a2cff1'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const RightSection = () => {
  const swapCTX = useContext(SwapContext)
  const {
    swapParams,
    updateSwapParams,
    handleSwapParams,
    handleLeftSection,
    isAtokenSelectionActive,
    handleSetIsAtokenSelectionActive,
    isBtokenSelectionActive,
    handleSetIsBtokenSelectionActive,
    leftSection,
    isAtokenSelected,
    isBtokenSelected,
  } = swapCTX
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // TODO: add this to check account in whitelist
  const [accountWhiteList, setAccountWhiteList] = useState<boolean>(false)

  const routerContract = useV2RouterContract() as Contract
  const { account, chainId } = useActiveWeb3React()
  const parameters = useParameters()

  // const [swapParams, setSwapParams] = useState<any>({ start: false })

  const lists = useAllLists()

  // TODO:
  const backerIntegrity = true

  // swap state
  const { independentField, typedValue, recipient, INPUT, OUTPUT } = useSwapState()

  const inputCurrency = useCurrency(INPUT.currencyId)
  const outputCurrency = useCurrency(OUTPUT.currencyId)

  const {
    trade: { trade },
    allowedSlippage,
    currencyBalances,
    parsedAmount,
    currencies,
  } = useDerivedSwapInfo()

  const minimum = trade?.minimumAmountOut(allowedSlippage).toSignificant(6).toString()

  const parsedAmounts = {
    [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
    [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
  }

  const fiatValueInput = useUSDCValue(trade?.inputAmount)
  const fiatValueOutput = useUSDCValue(trade?.outputAmount)
  const priceImpact = trade?.priceImpact

  const { onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
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
  const {
    error: swapCallbackError,
    prepareSignMessage,
    userSign,
    createEncryptProof,
    sendEncryptedTx,
  } = useSwapCallback(
    approvalOptimizedTrade,
    allowedSlippage,
    backerIntegrity, //backer integrity
    recipient,
    signatureData,
    parameters
  )

  const handleSwap = () => {
    updateSwapParams({ confirm: true })
  }
  const dispatch = useAppDispatch()

  ///////////////////////////////
  // parameter loading
  ///////////////////////////////
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

  ///////////////////////////////
  // worker
  ///////////////////////////////
  const worker = useMemo(() => new Worker(), [])

  const isPuzzling = useRef<boolean>(false)
  useEffect(() => {
    if (!swapParams.timeLockPuzzleData && !isPuzzling.current) {
      isPuzzling.current = true
      getTimeLockPuzzleParam().then((res) => {
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
      updateSwapParams({ timeLockPuzzleDone: true, timeLockPuzzleData: { ...e.data.data } })
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

      worker.postMessage({
        target: 'encryptor',
        txInfoToHash,
        s2_string: swapParams.timeLockPuzzleData.s2_string,
        s2_field_hex: swapParams.timeLockPuzzleData.s2_field_hex,
        commitment_hex: swapParams.timeLockPuzzleData.commitment_hex,
        idPath: swapParams.idPath,
      })
    }
  }, [swapParams, chainId, worker])

  const userSignFunc = useCallback(async () => {
    if (userSign) {
      const res = await userSign(swapParams.signMessage)
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
          updateSwapParams({ sent: true })
          // handleLeftSection('welcome')
          // handleSwapParams({ start: false })
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
      isEncrypting.current = true
      createEncryptProofFunc()
    }
  }, [swapParams, createEncryptProofFunc, createEncryptProof])

  const isSigning = useRef(false)
  useEffect(() => {
    if (!isSigning.current && swapParams.prepareDone && swapParams.confirm && !swapParams.signingDone) {
      isSigning.current = true
      handleLeftSection('almost-there')
      userSignFunc().then(() => {
        isSigning.current = false
      })
    }
  }, [swapParams, userSignFunc])

  const isSending = useRef<boolean>(false)
  useEffect(() => {
    if (!isSending.current && swapParams.encryptorDone && swapParams.signingDone) {
      isSending.current = true
      console.log('sendEncryptedTxFunc')
      sendEncryptedTxFunc().then(() => {
        isSending.current = false
      })
    }
  }, [swapParams, sendEncryptedTxFunc])

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

  const handleConfirmDismiss = useCallback(() => {
    handleLeftSection('welcome')
    handleSwapParams({
      start: false,
      timeLockPuzzleData: swapParams.timeLockPuzzleData,
      timeLockPuzzleDone: swapParams.timeLockPuzzleDone,
    })

    // if there was a tx hash, we want to clear the input
    // if (txHash) {
    //   onUserInput(Field.INPUT, '')
    // }
  }, [onUserInput, swapParams])

  const handleInputSelect = useCallback(
    (inputCurrency: any) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
    },
    [onCurrencySelection]
  )

  const handleOutputSelect = useCallback(
    (outputCurrency: any) => {
      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [onCurrencySelection]
  )
  const [showSettings, setShowSettings] = useState(false)
  const [showInverted, setShowInverted] = useState<boolean>(false)

  const handleShowSettings: MouseEventHandler<SVGSVGElement | HTMLImageElement> = () => {
    setShowSettings((prevState) => !prevState)
  }

  const openInputTokenSelect = () => {
    handleSetIsBtokenSelectionActive(false)
    handleSetIsAtokenSelectionActive(true)
  }

  const openOutputTokenSelect = () => {
    handleSetIsAtokenSelectionActive(false)
    handleSetIsBtokenSelectionActive(true)
  }

  useEffect(() => {
    if (isAtokenSelectionActive || isBtokenSelectionActive) {
      handleLeftSection('search-table')
    }
  }, [isAtokenSelectionActive, isBtokenSelectionActive, handleLeftSection])

  return leftSection === 'progress' ? (
    <></>
  ) : !showSettings ? (
    <MainWrapper>
      <Header>
        <HeaderTitle>Swap</HeaderTitle>
        <Cog onClick={handleShowSettings} />
      </Header>
      <TopTokenRow>
        {isAtokenSelected && (
          <SlippageOptions>
            <SlippageOption>MAX</SlippageOption>
            <SlippageOption>50%</SlippageOption>
            <SlippageOption>Clear</SlippageOption>
          </SlippageOptions>
        )}
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isAtokenSelected} onClick={openInputTokenSelect}>
              {isAtokenSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>{inputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isAtokenSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput
            value={formattedAmounts[Field.INPUT]}
            onUserInput={handleTypeInput}
            isSelected={isAtokenSelected}
          />
        </Aligner>
        <Circle />
      </TopTokenRow>
      <BottomTokenRow>
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isBtokenSelected} onClick={openOutputTokenSelect}>
              {isBtokenSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>{outputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isBtokenSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={() => {
              return
            }}
            isSelected={isAtokenSelected}
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
        {accountWhiteList && !swapParams.start && (
          <PrimaryButton
            mrgn="0px 0px 12px 0px"
            onClick={() => {
              handleLeftSection('preview')
              updateSwapParams({ start: true })
            }}
          >
            Preview Swap
          </PrimaryButton>
        )}
        {accountWhiteList && swapParams.start && !swapParams.confirm && (
          <PrimaryButton mrgn="0px 0px 12px 0px" onClick={() => updateSwapParams({ confirm: true })}>
            Swap
          </PrimaryButton>
        )}

        {trade && (
          <TradePrice price={trade.executionPrice} showInverted={showInverted} setShowInverted={setShowInverted} />
        )}
      </ButtonRow>
    </MainWrapper>
  ) : (
    <Settings handleShowSettings={handleShowSettings} isSelected={false} />
  )
}

export default RightSection
