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
import { useContext } from 'react'
import SwapContext from 'store/swap-context'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Status, TokenAmount } from 'utils/db'

type Props = {
  percentage: number
  id: number
}

function token2str(row: { amount: string; decimal: string; token: string }) {
  const amount = Number(row.amount) / Number(row.decimal)
  return amount.toString() + ' ' + row.token
}
export const CurvedProgress = ({ percentage, id }: Props) => {
  const swapCTX = useContext(SwapContext)

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

  let progress = 0
  if (tx?.status === Status.PENDING) progress = 50
  if (tx?.status === Status.CANCELED) progress = 100
  if (tx?.status === Status.COMPLETED) progress = 100
  if (tx?.status === Status.REJECTED) progress = 100
  if (tx?.status === Status.REIMBURSE_AVAILABLE) progress = 100
  if (tx?.status === Status.REIMBURSED) progress = 100

  const width = 232
  const r = 108.5
  const strokeDasharray = 2 * Math.PI * r
  const strokeDashoffset = strokeDasharray - (strokeDasharray * progress) / 200

  const somethingWrong = tx?.status !== undefined && tx?.status !== Status.COMPLETED && tx?.status !== Status.PENDING

  return (
    <Wrapper>
      <Head>
        <Info>
          <Description>Ready to go! Transaction in progress.</Description>
          <Explanation>You can go do other things now! Your swap is still being processed.</Explanation>
        </Info>
        <Button
          onClick={() => {
            swapCTX.handleLeftSection('welcome')
            swapCTX.handleSwapParams({ start: false })
          }}
        >
          New Swap
        </Button>
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
          <Start passed={!somethingWrong}>{tx !== undefined ? token2str(tx?.from as TokenAmount) : 'from'}</Start>
          <Middle passed={!somethingWrong}>NO FEE</Middle>
          <Finish passed={!somethingWrong}>{tx !== undefined ? token2str(tx?.to as TokenAmount) : 'to'}</Finish>
        </ProgressBarWithSpans>

        {(tx !== undefined && tx?.status === Status.COMPLETED && <Note>Your wallet is getting heavier!</Note>) ||
          (tx !== undefined && tx?.status === Status.PENDING && (
            <Note>
              Almost there!
              <br />
              We&apos;re busy destroying the fees!
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
              Sending
              {/* Curious about what&apos;s happening with your transaction?
              <br />
              Here&apos;s what we&apos;re up to! */}
            </Note>
          )}
      </Body>
    </Wrapper>
  )
}
