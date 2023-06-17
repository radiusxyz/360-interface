import styled from 'styled-components/macro'
import emoji_small from '../../../assets/v2/images/emoji_small.svg'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  min-height: 190px;
  background-color: #f5f4ff;
  margin: 18px 0px 12px 0px;
`

export const ProgressBarWithStatuses = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  justify-content: flex-start;
  align-items: center;
  max-width: 467px;
  padding-top: 40px;
`

export const ProgressBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0px 18px 0px 15px;
  width: 100%;
`
export const Emoji = styled.img.attrs({
  src: emoji_small,
  width: 28,
})``

export const CircleBehind = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #dde0ff;
`

export const ProgressLineBehind = styled.div`
  background: #dde0ff;
  max-width: 172px;
  width: 100%;
  height: 2px;
`

export const StartCircle = styled(CircleBehind)`
  background: #6b11ff;
`
export const LeftLine = styled(ProgressLineBehind)<{ percentage: number }>`
  width: ${({ percentage }) => `${percentage}%`};
  background: #6b11ff;
  transition: width 0.2s ease;
`
export const MiddleCircle = styled(CircleBehind)<{ percentage: number }>`
  background: ${({ percentage }) => percentage >= 50 && '#6b11ff'};
`
export const RightLine = styled(ProgressLineBehind)<{ percentage: number }>`
  width: ${({ percentage }) => `${percentage}%`};
  background: #6b11ff;
  transition: width 0.2s ease;
`
export const FinishCircle = styled(CircleBehind)<{ percentage: number }>`
  background: ${({ percentage }) => percentage === 100 && '#6b11ff'};
`

export const Statuses = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

export const Status = styled.span`
  font-size: 14px;
  font-weight: 500;
  line-height: 17px;
  color: #dde0ff;
`

export const StartSpan = styled(Status)`
  color: #6b11ff;
  font-weight: 600;
`
export const MiddleSpan = styled(Status)<{ percentage: number }>`
  margin-right: 8px;
  color: ${({ percentage }) => percentage >= 50 && '#6b11ff'};
  font-weight: ${({ percentage }) => percentage >= 50 && '600'};
`
export const FinishSpan = styled(Status)<{ percentage: number }>`
  color: ${({ percentage }) => percentage === 100 && '#6b11ff'};
  font-weight: ${({ percentage }) => percentage === 100 && '600'};
`

export const Note = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 138.58%;
  text-align: center;
  letter-spacing: -0.005em;
  color: #242424;
  margin-top: 26px;
`
