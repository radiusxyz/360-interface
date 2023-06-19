import styled from 'styled-components/macro'
import { PrimaryButton } from '../UI/Buttons'
import emoji from '../../../assets/v2/images/emoji.svg'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 730px;
  width: 100%;
`

export const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 29px 47px 29px 51px;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  max-height: 100px;
`

export const Info = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
`

export const Description = styled.p`
  font-weight: 500;
  font-size: 20px;
  line-height: 92.08%;
  text-align: center;
  color: #000000;
`

export const Explanation = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 92.08%;
  text-align: center;
  letter-spacing: -0.005em;
  color: #333333;
`

export const Button = styled(PrimaryButton)`
  max-width: 146px;
  max-height: 40px;
  padding: 11px 34px 10px 35px;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;

  color: #ffffff;
`

export const Body = styled.div`
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  min-height: 400px;
  position: relative;
`
export const ProgressBarWithSpans = styled.div`
  position: relative;
`

export const Status = styled.span<{ passed?: boolean }>`
  font-weight: ${({ passed }) => (passed && '600') || '500'};
  font-size: 18px;
  line-height: 21px;
  position: absolute;
  color: ${({ passed }) => (passed && '#6b11ff') || '#eee4ff'};
`

export const Start = styled(Status)`
  font-weight: 600;
  font-size: 18px;
  color: #6b11ff;
  top: 50%;
  left: -46px;
  transform: translate(-100%, -50%);
`
export const Middle = styled(Status)`
  left: 50%;
  transform: translate(-50%, -100%);
  top: -11px;
`

export const Finish = styled(Status)`
  top: 50%;
  right: -46px;
  transform: translate(100%, -50%);
`

export const Emoji = styled.img.attrs({
  src: emoji,
})`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

export const SVG = styled.svg.attrs({
  viewBox: '0 0 232 232',
  width: 232,
  height: 232,
})``

export const Note = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 144.52%;
  text-align: center;
  color: #6b11ff;
  position: absolute;
  bottom: 68px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
`
