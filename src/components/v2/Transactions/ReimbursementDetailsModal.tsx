import {
  Button,
  DataItem,
  DataItems,
  DetailsModal,
  ItemProperty,
  ItemValue,
  ItemValueBlue,
  PopupHeader,
  Positioner,
  XButton,
  XButtonWrapper,
} from './ReimbursementDetailsModalStyles'
import { Backdrop } from './ReimbursementModalStyles'

type Props = {
  handleModal: () => void
}

const ReimbursementDetailsModal = ({ handleModal }: Props) => {
  return (
    <Positioner>
      <Backdrop onClick={handleModal} />
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
            <ItemValueBlue>300.25 ETH</ItemValueBlue>
          </DataItem>
        </DataItems>
        <Button onClick={handleModal}>Close</Button>
      </DetailsModal>
    </Positioner>
  )
}

export default ReimbursementDetailsModal
