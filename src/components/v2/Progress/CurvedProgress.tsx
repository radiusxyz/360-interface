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
  Finish,
  Middle,
  SVG,
  Start,
  ProgressBarWithSpans,
} from './CurvedProgressStyles'

type Props = {
  percentage: number
}

export const CurvedProgress = ({ percentage }: Props) => {
  const width = 232
  const r = 108.5
  const strokeDasharray = 2 * Math.PI * r
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 200

  return (
    <Wrapper>
      <Head>
        <Info>
          <Description>Ready to go! Transaction in progress.</Description>
          <Explanation>You can go do other things now! Your swap is still being processed.</Explanation>
        </Info>
        <Button>New Swap</Button>
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
              stroke="#6B11FF"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              strokeLinejoin="round"
              transform={`rotate(-180 ${width / 2} ${width / 2})`}
            />
          </SVG>
          <Emoji />
          <Start>1.006 ETH</Start>
          <Middle passed={percentage >= 50}> NO FEE</Middle>
          <Finish passed={percentage === 100}>0.100 DAI</Finish>
        </ProgressBarWithSpans>

        {(percentage === 100 && <Note>Your wallet is getting heavier!</Note>) ||
          (percentage >= 50 && (
            <Note>
              Almost there!
              <br />
              We&apos;re busy destroying the fees!
            </Note>
          )) || (
            <Note>
              Curious about what&apos;s happening with your transaction?
              <br />
              Here&apos;s what we&apos;re up to!
            </Note>
          )}
      </Body>
    </Wrapper>
  )
}
