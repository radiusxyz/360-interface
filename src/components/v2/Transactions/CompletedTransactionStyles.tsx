import styled from 'styled-components/macro'
import { TX, TXAmount, TXPreview } from './PendingTransactionStyles'

export const TxCompleted = styled(TX)`
  padding: 0;
`

export const TXPreviewCompleted = styled(TXPreview)`
  padding: 14px 39px 16px 39px;
`

export const TXAmountCompleted = styled(TXAmount)`
  font-size: 14px;
  line-height: 17px;
`

export const TXBottomRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 24px;
  padding: 20px 42px 19px 42px;
  border-top: 1px solid #dde0ff;
`

export const BottomRowSpan = styled.span`
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #8d95d7;
`
