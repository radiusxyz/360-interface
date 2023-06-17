import styled from 'styled-components/macro'
import expand from '../../../assets/v2/images/expand.svg'

export const TX = styled.div`
  display: flex;
  flex-direction: column;
  padding: 17px 29px;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
`

export const TXPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

export const TXDetails = styled.div`
  display: flex;
  gap: 26px;
  align-items: center;
  width: 100%;
`

export const TXStatus = styled.div<{ status: string }>`
  display: flex;
  justify-content: center;
  align-items: center;
  background: #eae7ff;
  border-radius: 23px;
  max-width: 99px;
  height: 23px;
  width: 100%;
  font-weight: 500;
  font-size: 14px;
  line-height: 92.08%;
  background: ${({ status }) =>
    (status === 'Pending' && '#EAE7FF') || (status === 'Completed' && '#E0FFE5') || (status === 'Failed' && '#FFE0E0')};
  color: ${({ status }) =>
    (status === 'Pending' && '#6B11FF') || (status === 'Completed' && '#00BF63') || (status === 'Failed' && '#FF4444')};
`

export const TXDateTimeAndAmount = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const TXDateTime = styled.span`
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #6b6b6b;
`

export const TXAmount = styled.span`
  display: flex;
  align-items: center;
  gap: 16px;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  text-align: center;
  color: #000000;
`

export const Dash = styled.span`
  color: #6d6d6d;
`

export const Expand = styled.img.attrs({
  src: expand,
})<{ rotate: number }>`
  transform: ${({ rotate }) => rotate && 'rotate(180deg)'};
`
