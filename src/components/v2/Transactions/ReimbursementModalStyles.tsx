import styled from 'styled-components/macro'
import close_reimburse_modal from '../../../assets/v2/images/close_reimburse_modal.svg'

export const Positioner = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
`

export const Backdrop = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: start;
  background: black;
  opacity: 0.3;
  position: relative;
  top: 0;
  left: 0;
`

export const Modal = styled.div`
  display: flex;
  padding: 30px;
  height: 650px;
  max-width: 540px;
  width: 100%;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  flex-direction: column;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`

export const CloseButtonWrapper = styled.div`
  display: flex;
  width: 100%;
  justify-content: flex-end;
  &:hover {
    cursor: pointer;
  }
`

export const CloseButton = styled.img.attrs({
  src: close_reimburse_modal,
  width: 18,
  height: 18,
})``

export const Header = styled.h1`
  font-style: normal;
  font-weight: 500;
  font-size: 30px;
  line-height: 36px;
  color: #000000;
  margin-bottom: 15px;
`

export const Description = styled.p`
  font-weight: 400;
  font-size: 16px;
  line-height: 146.34%;
  color: #555555;
  margin-bottom: 20px;
`

export const Details = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
  margin-bottom: 20px;
`

export const Item = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 20px 15px 20px;
  align-items: center;
  background: #f5f4ff;
`

export const StyledItemSpan = styled.span`
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #000000;
`

export const PropertyTop = styled.span``

export const Property = styled(StyledItemSpan)`
  font-weight: 500;
`

export const ValueTop = styled(StyledItemSpan)``

export const Value = styled(StyledItemSpan)`
  font-weight: 600;
  color: #6b11ff;
`

export const ValueBottom = styled(ValueTop)``

export const Note = styled.p`
  font-weight: 400;
  font-size: 14px;
  line-height: 146.34%;
  color: #525252;
  margin-top: 18px;
`

export const BlueSpan = styled.span`
  color: #4eaaff;
  text-decoration: underline;
  font-weight: 700;
`

export const DarkBold = styled.span`
  color: #000000;
  font-weight: 700;
`
