import {
  Emoji,
  FinishCircle,
  FinishSpan,
  LeftLine,
  MiddleCircle,
  MiddleSpan,
  Note,
  ProgressBar,
  ProgressBarWithStatuses,
  ProgressLineBehind,
  RightLine,
  StartCircle,
  StartSpan,
  Statuses,
  Wrapper,
} from './StraightProgressStyles'

const StraightProgress = ({ percentage }: { percentage: number }) => {
  return (
    <Wrapper>
      <ProgressBarWithStatuses>
        <ProgressBar>
          <StartCircle>
            <Emoji />
          </StartCircle>
          <ProgressLineBehind>
            <LeftLine percentage={(percentage <= 50 && percentage * 2) || 100} />
          </ProgressLineBehind>
          <MiddleCircle percentage={percentage}>
            <Emoji />
          </MiddleCircle>
          <ProgressLineBehind>
            <RightLine percentage={(percentage > 50 && (percentage - 50) * 2) || 0} />
          </ProgressLineBehind>
          <FinishCircle percentage={percentage}>
            <Emoji />
          </FinishCircle>
        </ProgressBar>
        <Statuses>
          <StartSpan>1.006 ETH</StartSpan>
          <MiddleSpan percentage={percentage}> NO FEE</MiddleSpan>
          <FinishSpan percentage={percentage}>0.100 DAI</FinishSpan>
        </Statuses>
      </ProgressBarWithStatuses>
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
    </Wrapper>
  )
}

export default StraightProgress
