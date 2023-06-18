import {
  CloseButton,
  CloseButtonWrapper,
  Details,
  Header,
  Item,
  Modal,
  Value,
  StyledItemSpan,
} from './ReimbursementModalStyles'
import styled from 'styled-components/macro'
import { PrimaryButton } from '../UI/Buttons'

export const Positioner = styled.div`
  width: 100vw;
  height: 100vh;
  position: absolute;
  top: 0;
  left: 0;
`

export const DetailsModal = styled(Modal)`
  height: 419px;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  flex-direction: column;
`

export const XButtonWrapper = styled(CloseButtonWrapper)``

export const XButton = styled(CloseButton)``

export const PopupHeader = styled(Header)`
  margin-bottom: 20px;
`

export const DataItems = styled(Details)`
  margin-bottom: 20px;
`

export const DataItem = styled(Item)``

export const ItemProperty = styled(StyledItemSpan)`
  font-weight: 500;
`

export const ItemValue = styled(StyledItemSpan)``

export const ItemValueBlue = styled(Value)``

export const Button = styled(PrimaryButton)`
  background: #ffffff;
  border: 1px solid #6b11ff;
  color: #6b11ff;
`
