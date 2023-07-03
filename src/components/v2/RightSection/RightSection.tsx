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
  }, [account, swapCTX.swapParams])

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
    swapCTX.updateSwapParams({ confirm: true })
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
  }, [getTimeLockPuzzleParam, swapCTX.swapParams.timeLockPuzzleData, worker])

  worker.onmessage = (e: MessageEvent<any>) => {
    if (e.data.target === 'timeLockPuzzle') {
      swapCTX.updateSwapParams({ timeLockPuzzleDone: true, timeLockPuzzleData: { ...e.data.data } })
      isPuzzling.current = false
    }
    if (
      e.data.target === 'encryptor' &&
      account &&
      chainId &&
      swapCTX.swapParams.timeLockPuzzleData &&
      swapCTX.swapParams.signMessage
    ) {
      const encryptData = e.data.data

      const encryptedPath = {
        message_length: encryptData.message_length,
        nonce: encryptData.nonce,
        commitment: swapCTX.swapParams.timeLockPuzzleData.commitment_hex,
        cipher_text: [encryptData.cipher_text],
        r1: swapCTX.swapParams.timeLockPuzzleData.r1,
        r3: swapCTX.swapParams.timeLockPuzzleData.r3,
        s1: swapCTX.swapParams.timeLockPuzzleData.s1,
        s3: swapCTX.swapParams.timeLockPuzzleData.s3,
        k: swapCTX.swapParams.timeLockPuzzleData.k,
        time_lock_puzzle_snark_proof: swapCTX.swapParams.timeLockPuzzleData.time_lock_puzzle_snark_proof,
        encryption_proof: encryptData.proof,
      }

      const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, swapCTX.swapParams.signMessage)
      const mimcHash = '0x' + encryptData.tx_id

      const encryptedSwapTx: EncryptedSwapTx = {
        txOwner: account,
        functionSelector: swapExactTokensForTokens,
        amountIn: `${swapCTX.swapParams.signMessage.amountIn}`,
        amountOut: `${swapCTX.swapParams.signMessage.amountOut}`,
        path: encryptedPath,
        to: account,
        nonce: swapCTX.swapParams.txNonce,
        backerIntegrity: swapCTX.swapParams.signMessage.backerIntegrity,
        availableFrom: swapCTX.swapParams.signMessage.availableFrom,
        deadline: swapCTX.swapParams.signMessage.deadline,
        txHash,
        mimcHash,
      }

      swapCTX.updateSwapParams({ encryptorDone: true, txHash, mimcHash, encryptedSwapTx })

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
              swapCTX.updateSwapParams({ prepareDone: true, ...res, operatorAddress })
            })
            .catch(() => {
              swapCTX.handleLeftSection('welcome')
              swapCTX.handleSwapParams({
                start: false,
                errorMessage: 'RPC server is not responding, please try again',
              })
            })
        })
        .catch(() => {
          swapCTX.handleLeftSection('welcome')
          swapCTX.handleSwapParams({
            start: false,
            errorMessage: 'RPC server is not responding, please try again',
          })
        })
    }
  }, [prepareSignMessage, swapCTX.swapParams, account, routerContract, backerIntegrity])

  const createEncryptProofFunc = useCallback(async () => {
    if (chainId && swapCTX.swapParams.signMessage) {
      if (swapCTX.swapParams.signMessage.path.length > 3) {
        console.error('Cannot encrypt path which length is over 3')
      }

      const pathToHash: string[] = new Array(MAXIMUM_PATH_LENGTH)

      for (let i = 0; i < MAXIMUM_PATH_LENGTH; i++) {
        pathToHash[i] =
          i < swapCTX.swapParams.signMessage.path.length ? swapCTX.swapParams.signMessage.path[i].split('x')[1] : '0'
      }

      const txInfoToHash: TxInfo = {
        tx_owner: swapCTX.swapParams.signMessage.txOwner.split('x')[1],
        function_selector: swapCTX.swapParams.signMessage.functionSelector.split('x')[1],
        amount_in: `${swapCTX.swapParams.signMessage.amountIn}`,
        amount_out: `${swapCTX.swapParams.signMessage.amountOut}`,
        to: swapCTX.swapParams.signMessage.to.split('x')[1],
        deadline: `${swapCTX.swapParams.signMessage.deadline}`,
        nonce: `${swapCTX.swapParams.signMessage.nonce}`,
        path: pathToHash,
      }

      worker.postMessage({
        target: 'encryptor',
        txInfoToHash,
        s2_string: swapCTX.swapParams.timeLockPuzzleData.s2_string,
        s2_field_hex: swapCTX.swapParams.timeLockPuzzleData.s2_field_hex,
        commitment_hex: swapCTX.swapParams.timeLockPuzzleData.commitment_hex,
        idPath: swapCTX.swapParams.idPath,
      })
    }
  }, [swapCTX.swapParams, chainId, worker])

  const userSignFunc = useCallback(async () => {
    if (userSign) {
      const res = await userSign(swapCTX.swapParams.signMessage)
      if (res) {
        swapCTX.updateSwapParams({ signingDone: true, ...res })
        swapCTX.handleLeftSection('progress')
      } else {
        swapCTX.updateSwapParams({ confirm: false })
      }
    }
  }, [userSign, swapCTX.swapParams])

  const sendEncryptedTxFunc = useCallback(async () => {
    if (sendEncryptedTx) {
      sendEncryptedTx(
        swapCTX.swapParams.txHash,
        swapCTX.swapParams.mimcHash,
        swapCTX.swapParams.signMessage,
        swapCTX.swapParams.encryptedSwapTx,
        swapCTX.swapParams.sig,
        swapCTX.swapParams.operatorAddress
      )
        .then(async (res) => {
          onUserInput(Field.INPUT, '')
          swapCTX.updateSwapParams({ sent: true })
          // swapCTX.handleLeftSection('welcome')
          // swapCTX.handleSwapParams({ start: false })
        })
        .catch(async (e) => {
          console.error(e)
          onUserInput(Field.INPUT, '')
          swapCTX.handleLeftSection('welcome')
          swapCTX.handleSwapParams({ start: false })
        })
    }
  }, [sendEncryptedTx, onUserInput, swapCTX.swapParams])

  ///////////////////////////////
  // swap processing
  ///////////////////////////////
  const isPreparing = useRef<boolean>(false)
  useEffect(() => {
    if (
      prepareSignMessageFunc !== null &&
      !isPreparing.current &&
      swapCTX.swapParams.start &&
      !swapCTX.swapParams.prepareDone
    ) {
      isPreparing.current = true
      prepareSignMessageFunc().then(() => {
        isPreparing.current = false
      })
    }
  }, [prepareSignMessageFunc, swapCTX.swapParams.start, swapCTX.swapParams.prepareDone])

  const isEncrypting = useRef<boolean>(false)
  useEffect(() => {
    if (
      createEncryptProofFunc !== null &&
      !isEncrypting.current &&
      swapCTX.swapParams.timeLockPuzzleDone &&
      swapCTX.swapParams.prepareDone &&
      !swapCTX.swapParams.encryptorDone
    ) {
      isEncrypting.current = true
      createEncryptProofFunc()
    }
  }, [swapCTX.swapParams, createEncryptProofFunc, createEncryptProof])

  const isSigning = useRef(false)
  useEffect(() => {
    if (
      !isSigning.current &&
      swapCTX.swapParams.prepareDone &&
      swapCTX.swapParams.confirm &&
      !swapCTX.swapParams.signingDone
    ) {
      isSigning.current = true
      swapCTX.handleLeftSection('almost-there')
      userSignFunc().then(() => {
        isSigning.current = false
      })
    }
  }, [swapCTX.swapParams, userSignFunc])

  const isSending = useRef<boolean>(false)
  useEffect(() => {
    if (
      !isSending.current &&
      swapCTX.swapParams.encryptorDone &&
      swapCTX.swapParams.signingDone &&
      !swapCTX.swapParams.sent
    ) {
      isSending.current = true
      console.log('sendEncryptedTxFunc')
      sendEncryptedTxFunc().then(() => {
        isSending.current = false
      })
    }
  }, [swapCTX.swapParams, sendEncryptedTxFunc])

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
    swapCTX.handleLeftSection('welcome')
    swapCTX.handleSwapParams({
      start: false,
      timeLockPuzzleData: swapCTX.swapParams.timeLockPuzzleData,
      timeLockPuzzleDone: swapCTX.swapParams.timeLockPuzzleDone,
    })

    // if there was a tx hash, we want to clear the input
    // if (txHash) {
    //   onUserInput(Field.INPUT, '')
    // }
  }, [onUserInput, swapCTX.swapParams])

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
    swapCTX.handleSetIsBtokenSelectionActive(false)
    swapCTX.handleSetIsAtokenSelectionActive(true)
  }

  const openOutputTokenSelect = () => {
    swapCTX.handleSetIsAtokenSelectionActive(false)
    swapCTX.handleSetIsBtokenSelectionActive(true)
  }

  useEffect(() => {
    if (swapCTX.isAtokenSelectionActive || swapCTX.isBtokenSelectionActive) {
      swapCTX.handleLeftSection('search-table')
    }
  }, [swapCTX.isAtokenSelectionActive, swapCTX.isBtokenSelectionActive, swapCTX.handleLeftSection])

  return swapCTX.leftSection === 'progress' ? (
    <></>
  ) : !showSettings ? (
    <MainWrapper>
      <Header>
        <HeaderTitle>Swap</HeaderTitle>
        <Cog onClick={handleShowSettings} />
      </Header>
      <TopTokenRow>
        {swapCTX.isAtokenSelected && (
          <SlippageOptions>
            <SlippageOption>MAX</SlippageOption>
            <SlippageOption>50%</SlippageOption>
            <SlippageOption>Clear</SlippageOption>
          </SlippageOptions>
        )}
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={swapCTX.isAtokenSelected} onClick={openInputTokenSelect}>
              {swapCTX.isAtokenSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>{inputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {swapCTX.isAtokenSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput
            value={formattedAmounts[Field.INPUT]}
            onUserInput={handleTypeInput}
            isSelected={swapCTX.isAtokenSelected}
          />
        </Aligner>
        <Circle />
      </TopTokenRow>
      <BottomTokenRow>
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={swapCTX.isBtokenSelected} onClick={openOutputTokenSelect}>
              {swapCTX.isBtokenSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>{outputCurrency?.symbol}</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {swapCTX.isBtokenSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput
            value={formattedAmounts[Field.OUTPUT]}
            onUserInput={() => {
              return
            }}
            isSelected={swapCTX.isAtokenSelected}
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
        {accountWhiteList && !swapCTX.swapParams.start && (
          <PrimaryButton
            mrgn="0px 0px 12px 0px"
            onClick={() => {
              swapCTX.handleLeftSection('preview')
              swapCTX.updateSwapParams({ start: true })
            }}
          >
            Preview Swap
          </PrimaryButton>
        )}
        {accountWhiteList && swapCTX.swapParams.start && !swapCTX.swapParams.confirm && (
          <PrimaryButton mrgn="0px 0px 12px 0px" onClick={() => swapCTX.updateSwapParams({ confirm: true })}>
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
