import { PrimaryButton, SelectTokenButton } from '../UI/Buttons'

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
  ExchangeRateWrapper,
  ExchangeIcon,
  ExchangeRate,
} from './RightSectionStyles'

import { loadingOpacityMixin } from 'components/Loader/styled'
import { Input as NumericalInput } from 'components/NumericalInput'
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
import styled from 'styled-components/macro'

// eslint-disable-next-line import/no-webpack-loader-syntax
import Worker from 'worker-loader!workers/worker'
import Settings from '../Settings/Settings'
import NumericInput from '../UI/Inputs'

const StyledNumericalInput = styled(NumericalInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  text-align: right;
  font-style: normal;
  font-weight: 500;
  font-size: 22px;
  line-height: 144.52%;
  height: 60px;
  width: 100%;
  border: 1px solid #dde0ff;
  outline: none;
  background: inherit;
  color: inherit;
  vertical-align: text-top;
  ::placeholder {
    color: #d0b2ff;
  }
  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  &:hover {
    background: #f5f4ff;
    color: #6b11ff;
    border: 1px solid #dde0ff;
  }
  &:focus {
    background: #f5f4ff;
    color: #6b11ff;
    border: 1px solid #dde0ff;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
  color: #d0b2ff;
  background: #f5f4ff;
  border-radius: 0px;
  text-align: right;
`

const MAXIMUM_PATH_LENGTH = 3
const swapExactTokensForTokens = '0x73a2cff1'

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const RightSection = () => {
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // TODO: add this to check account in whitelist
  const [accountWhiteList, setAccountWhiteList] = useState<boolean>(false)

  const routerContract = useV2RouterContract() as Contract
  const { account, chainId } = useActiveWeb3React()
  const parameters = useParameters()

  const [swapParams, setSwapParams] = useState<any>({ start: false })

  const lists = useAllLists()

  // TODO:
  const backerIntegrity = true

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
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
    setSwapParams({ ...swapParams, confirm: true })
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

      setSwapParams({ ...swapParams, encryptorDone: true, txHash, mimcHash, encryptedSwapTx })

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
              setSwapParams({ ...swapParams, prepareDone: true, ...res, operatorAddress })
            })
            .catch(() => {
              setSwapParams({
                ...swapParams,
                start: false,
                errorMessage: 'RPC server is not responding, please try again',
              })
            })
        })
        .catch(() => {
          setSwapParams({
            ...swapParams,
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
        setSwapParams({ ...swapParams, signingDone: true, ...res })
      } else {
        setSwapParams({ ...swapParams, confirm: false })
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
          setSwapParams({ ...swapParams, sent: true })

          await sleep(10000)
          // set swapResponse: res,
          setSwapParams({ start: false })
        })
        .catch(async (e) => {
          console.error(e)
          onUserInput(Field.INPUT, '')
          setSwapParams({ start: false })
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
      userSignFunc().then(() => {
        isSigning.current = false
      })
    }
  }, [swapParams, userSignFunc])

  const isSending = useRef<boolean>(false)
  useEffect(() => {
    if (!isSending.current && swapParams.encryptorDone && swapParams.signingDone) {
      isSending.current = true
      sendEncryptedTxFunc().then(() => {
        isSending.current = false
      })
    }
  }, [swapParams, sendEncryptedTxFunc, sendEncryptedTx])

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

  const handleConfirmDismiss = useCallback(() => {
    setSwapParams({
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
  const [isSelected, setIsSelected] = useState(false)
  const [showSettings, setShowSettings] = useState(true)

  const handleShowSettings: MouseEventHandler<SVGSVGElement | HTMLImageElement> = () => {
    setShowSettings((prevState) => !prevState)
  }

  return !showSettings ? (
    <MainWrapper>
      <Header>
        <HeaderTitle>Swap</HeaderTitle>
        <Cog onClick={handleShowSettings} />
      </Header>
      <TopTokenRow>
        {isSelected && (
          <SlippageOptions>
            <SlippageOption>MAX</SlippageOption>
            <SlippageOption>50%</SlippageOption>
            <SlippageOption>Clear</SlippageOption>
          </SlippageOptions>
        )}
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isSelected}>
              {isSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>WMATIC</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput value={formattedAmounts[Field.INPUT]} onUserInput={handleTypeInput} isSelected={isSelected} />
        </Aligner>
        <Circle />
      </TopTokenRow>
      <BottomTokenRow>
        <Aligner>
          <ButtonAndBalanceWrapper>
            <SelectTokenButton isSelected={isSelected}>
              {isSelected ? (
                <TokenWrapper>
                  <Logo />
                  <TokenName>DAI</TokenName>
                </TokenWrapper>
              ) : (
                'Select'
              )}
            </SelectTokenButton>
            {isSelected && <Balance>Balance : 0.00225</Balance>}
          </ButtonAndBalanceWrapper>
          <NumericInput value={formattedAmounts[Field.INPUT]} onUserInput={handleTypeInput} isSelected={isSelected} />
        </Aligner>
      </BottomTokenRow>
      <ButtonRow>
        {isSelected && (
          <InfoMainWrapper>
            <InfoRowWrapper>
              <Description>You receive minimum</Description>
              <ValueAndIconWrapper>
                <ImpactAmount>15.2545 DAI</ImpactAmount>
                <InfoIcon>
                  <circle cx="8" cy="8" r="7.5" stroke="#9B9B9B" />
                  <rect x="7.27271" y="7.27271" width="1.45455" height="4.36364" fill="#9B9B9B" />
                  <rect x="7.27271" y="4.36365" width="1.45455" height="1.45455" fill="#9B9B9B" />
                </InfoIcon>
              </ValueAndIconWrapper>
            </InfoRowWrapper>
            <Divider />
            <InfoRowWrapper>
              <Description>Price impact</Description>
              <ValueAndIconWrapper>
                <ImpactAmount>0.25%</ImpactAmount>
                <InfoIcon>
                  <circle cx="8" cy="8" r="7.5" stroke="#9B9B9B" />
                  <rect x="7.27271" y="7.27271" width="1.45455" height="4.36364" fill="#9B9B9B" />
                  <rect x="7.27271" y="4.36365" width="1.45455" height="1.45455" fill="#9B9B9B" />
                </InfoIcon>
              </ValueAndIconWrapper>
            </InfoRowWrapper>
          </InfoMainWrapper>
        )}
        <PrimaryButton mrgn="0px 0px 12px 0px">Preview Swap</PrimaryButton>
        {isSelected && (
          <ExchangeRateWrapper>
            <ExchangeIcon>
              <circle cx="8.5" cy="8.5" r="8.5" fill="#F5F4FF" />
              <path d="M8 5L6 7H13" stroke="#847B98" />
              <path d="M10 12L12 10H5" stroke="#847B98" />
            </ExchangeIcon>
            <ExchangeRate>1ETH = 2035 WMATIC</ExchangeRate>
          </ExchangeRateWrapper>
        )}
      </ButtonRow>
    </MainWrapper>
  ) : (
    <Settings handleShowSettings={handleShowSettings} isSelected={isSelected} />
  )
}

export default RightSection
