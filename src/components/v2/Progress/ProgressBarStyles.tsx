import styled from 'styled-components/macro'
import emoji from '../../../assets/v2/images/emoji.svg'

export const Wrapper = styled.div`
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
