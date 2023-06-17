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

const DetailsModal = styled(Modal)`
  height: 419px;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  flex-direction: column;
`

const XButtonWrapper = styled(CloseButtonWrapper)``

const XButton = styled(CloseButton)``

const PopupHeader = styled(Header)``

const DataItems = styled(Details)``

const DataItem = styled(Item)``

const ItemProperty = styled(StyledItemSpan)`
  font-weight: 500;
`

const ItemValue = styled(StyledItemSpan)``

const ItemValueBlue = styled(Value)``

const Button = styled(PrimaryButton)`
  background: #ffffff;
  border: #6b11ff;
  color: #6b11ff;
`

type Props = {
  handleModal: () => void
}

const ReimbursementDetailsModal = ({ handleModal }: Props) => {
  return (
    <DetailsModal>
      <XButtonWrapper>
        <XButton onClick={handleModal} />
      </XButtonWrapper>
      <PopupHeader>Reimbursment Details</PopupHeader>
      <DataItems>
        <DataItem>
          <ItemProperty>Date</ItemProperty>
          <ItemValue>Nov 25 2022 11:36 AM</ItemValue>
        </DataItem>
        <DataItem>
          <ItemProperty>Reimburse To</ItemProperty>
          <ItemValue>0xCCc379b88...Bdd8941b6e</ItemValue>
        </DataItem>
        <DataItem>
          <ItemProperty>Transaction Hash</ItemProperty>
          <ItemValue>0x88a...751</ItemValue>
        </DataItem>
        <DataItem>
          <ItemProperty>Amount</ItemProperty>
          <ItemValue>300.25 ETH</ItemValue>
        </DataItem>
      </DataItems>
      <Button onClick={handleModal}>Close</Button>
    </DetailsModal>
  )
}

export default ReimbursementDetailsModal
