import {
  Wrapper,
  Body,
  Button,
  Description,
  Explanation,
  Head,
  Info,
  Note,
  Emoji,
  GrimacingFace,
  Finish,
  Middle,
  SVG,
  Start,
  ProgressBarWithSpans,
} from './CurvedProgressStyles'
import React, { useMemo } from 'react'
import { useContext, useEffect, useState } from 'react'
import SwapContext from '../../../store/swap-context'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Status, TokenAmount } from '../../../utils/db'
import { token2str } from '../../../utils'
import { Field } from '../../../state/swap/actions'

import { useDerivedSwapInfo, useSwapState } from '../../../state/swap/hooks'

type Props = {
  percentage: number
  id: number
}

export const CurvedProgress = ({ percentage, id }: Props) => {
  const swapCTX = useContext(SwapContext)

  const {
    trade: { trade },
    parsedAmount,
  } = useDerivedSwapInfo()

  const { independentField, typedValue } = useSwapState()
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  const parsedAmounts = useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    }),
    [independentField, parsedAmount, trade?.inputAmount, trade?.outputAmount]
  )

  const formattedAmounts = useMemo(
    () => ({
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    }),
    [dependentField, independentField, parsedAmounts, typedValue]
  )

  const tx = useLiveQuery(async () => {
    if (id) {
      const txs = await db.swap.where({ id }).toArray()
      // const tx = await db.getRecentSwap()
      if (txs.length !== 0) return txs[0]
      // if (!tx)
      // return {
      //   status: 0,
      //   from: { amount: '0', decimal: '0', token: '' },
      //   to: { amount: '0', decimal: '0', token: '' },
      // }
      // return tx
    }
    return undefined
  }, [id])

  // const [tx, setTx] = useState({
  //   status: 0,
  //   from: { amount: '0', decimal: '0', token: '' },
  //   to: { amount: '0', decimal: '0', token: '' },
  // })

  // useEffect(() => {
  //   const identifier = setTimeout(() => {
  //     setTx({
  //       status: 4,
  //       from: { amount: '0', decimal: '0', token: '' },
  //       to: { amount: '0', decimal: '0', token: '' },
  //     })
  //   }, 2000)
  //   return () => {
  //     clearTimeout(identifier)
  //   }
  // }, [])

  const [progress, setProgress] = useState(0)

  useEffect(() => {
    switch (tx?.status) {
      case Status.PENDING:
        setProgress(95)
        break
      case Status.CANCELED:
        setProgress(100)
        break
      case Status.COMPLETED:
        setProgress(100)
        break
      case Status.REJECTED:
        setProgress(100)
        break
      case Status.REIMBURSE_AVAILABLE:
        setProgress(100)
        break
      case Status.REIMBURSED:
        setProgress(100)
        break
      default:
        setProgress(60)
    }
  }, [tx?.status])

  const [progressDynamic, setProgressDynamic] = useState(0)

  useEffect(() => {
    if (tx?.status === 0 || tx?.status === undefined) {
      const identifier = setInterval(() => {
        if (progressDynamic <= progress) setProgressDynamic((prevState) => prevState + 1)
        else return
      }, 50)
      return () => {
        clearInterval(identifier)
      }
    } else {
      setProgressDynamic(100)
      return
    }
  }, [progressDynamic, progress])

  const width = 232
  const r = 108.5
  const strokeDasharray = 2 * Math.PI * r
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progressDynamic) / 200

  const somethingWrong = tx?.status !== undefined && tx?.status !== Status.COMPLETED && tx?.status !== Status.PENDING

  return (
    <Wrapper>
      <Head>
        <Info>
          <Description>Processing Swap</Description>
          <Explanation>Your transaction is being processed. Please wait or make a new swap</Explanation>
        </Info>
        {tx !== undefined && (
          <Button
            onClick={() => {
              swapCTX.handleLeftSection('welcome')
              swapCTX.handleSwapParams({ start: false })
            }}
          >
            New Swap
          </Button>
        )}
      </Head>
      <Body>
        <ProgressBarWithSpans>
          <SVG>
            <circle
              cx={width / 2}
              cy={width / 2}
              strokeWidth="15px"
              r={r}
              fill="none"
              stroke="#EFE4FF"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDasharray - (strokeDasharray * 50) / 100}
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`rotate(-180 ${width / 2} ${width / 2})`}
            />
            <circle
              cx={width / 2}
              cy={width / 2}
              strokeWidth="15px"
              r={r}
              fill="none"
              stroke={somethingWrong ? '#FF8686' : '#6B11FF'}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`rotate(-180 ${width / 2} ${width / 2})`}
            />
          </SVG>
          {(!somethingWrong && <Emoji />) || (somethingWrong && <GrimacingFace />)}
          <Start passed={!somethingWrong}>
            {tx !== undefined
              ? token2str(tx?.from as TokenAmount)
              : formattedAmounts[Field.INPUT] + ' ' + parsedAmounts[Field.INPUT]?.currency.symbol}
          </Start>
          <Middle passed={!somethingWrong}>NO FEE</Middle>
          <Finish passed={!somethingWrong}>
            {tx !== undefined
              ? token2str(tx?.to as TokenAmount)
              : formattedAmounts[Field.OUTPUT] + ' ' + parsedAmounts[Field.OUTPUT]?.currency.symbol}
          </Finish>
        </ProgressBarWithSpans>

        {(tx !== undefined && tx?.status === Status.COMPLETED && <Note>Sending to your wallet now</Note>) ||
          (tx !== undefined && tx?.status === Status.PENDING && (
            <Note>
              Just a little more to go...
              <br />
              {'round: ' + tx.round + '  order: ' + tx.order}
            </Note>
          )) ||
          (tx !== undefined && tx?.status && (
            <Note>
              Something Wrong
              {/* Curious about what&apos;s happening with your transaction?
              <br />
              Here&apos;s what we&apos;re up to! */}
            </Note>
          )) || (
            <Note>
              Securing tansaction with an encryption and creating a proof
              {/* Curious about what&apos;s happening with your transaction?
              <br />
              Here&apos;s what we&apos;re up to! */}
            </Note>
          )}
      </Body>
    </Wrapper>
  )
}
