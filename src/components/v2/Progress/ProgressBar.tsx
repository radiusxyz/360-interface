import { Wrapper, Emoji, Finish, Middle, SVG, Start } from './ProgressBarStyles'

type Props = {
  percentage: number
}

export const ProgressBar = ({ percentage }: Props) => {
  const width = 232
  const r = 108.5
  const strokeDasharray = 2 * Math.PI * r
  const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 200

  return (
    <Wrapper>
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
    </Wrapper>
  )
}
