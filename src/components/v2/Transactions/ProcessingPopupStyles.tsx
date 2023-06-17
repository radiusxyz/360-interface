import styled from 'styled-components/macro'
import envelope from '../../../assets/v2/images/envelope.svg'
import close_reimburse_modal from '../../../assets/v2/images/close_reimburse_modal.svg'

export const Popup = styled.div`
  max-width: 487px;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  width: 100%;
  height: 377px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translateX(-50%);
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

export const Envelope = styled.img.attrs({
  src: envelope,
  width: 82,
  height: 82,
})`
  margin-bottom: 40px;
`

export const DetailsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-height: 146px;
  height: 100%;
  margin-bottom: 30px;
  background: #f5f4ff;
`

export const Amount = styled.span`
  font-weight: 600;
  font-size: 34px;
  line-height: 41px;
  color: #6b11ff;
`

export const ReimbursementAddress = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #333333;
`

export const Status = styled.span`
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #333333;
`
