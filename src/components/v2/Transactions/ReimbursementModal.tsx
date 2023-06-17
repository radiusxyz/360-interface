import { useState } from 'react'
import { PrimaryButton } from '../UI/Buttons'
import {
  Backdrop,
  BlueSpan,
  CloseButton,
  CloseButtonWrapper,
  DarkBold,
  Description,
  Details,
  Header,
  Item,
  Modal,
  Positioner,
  Property,
  PropertyTop,
  Value,
  ValueBottom,
  ValueTop,
} from './ReimbursementModalStyles'
import { Note } from './StraightProgressStyles'
import ProcessingModal from './ProcessingModal'

type Props = {
  handleModal: () => void
}

const ReimbursementModal = ({ handleModal }: Props) => {
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const handleProcessingModal = () => {
    setShowProcessingModal((showProcessingModal) => !showProcessingModal)
  }
  return (
    <Positioner>
      <Backdrop onClick={handleModal} />
      {showProcessingModal ? (
        <ProcessingModal handleProcessingModal={handleProcessingModal} />
      ) : (
        <Modal>
          <CloseButtonWrapper>
            <CloseButton onClick={handleModal} />
          </CloseButtonWrapper>
          <Header>Claim reimbursement for this transaction?</Header>
          <Description>
            We will cover a fixed reimbursement for any completed transaction
            <br /> we identify as invalid behavior from an operator.
            <br /> You may claim this reimbursement at any time.
          </Description>
          <Details>
            <Item>
              <PropertyTop>Nov 25 2022 11:36 AM</PropertyTop>
              <ValueTop>0x88a...751</ValueTop>
            </Item>
            <Item>
              <Property>From</Property>
              <Value>300.25 ETH</Value>
            </Item>
            <Item>
              <Property>To</Property>
              <Value>125.24254 MATIC</Value>
            </Item>
            <Item>
              <Property>Total Reimburse</Property>
              <Value>1000 USDC</Value>
            </Item>
            <Item>
              <Property>Reimburse To</Property>
              <ValueBottom>0xCCc379b88...Bdd8941b6e</ValueBottom>
            </Item>
          </Details>
          <PrimaryButton onClick={handleProcessingModal}>Confirm</PrimaryButton>
          <Note>
            If you would like to receive the reimbursement now, <br />
            click <DarkBold>Confirm Reimbursement</DarkBold>.<BlueSpan>Learn more</BlueSpan>
          </Note>
        </Modal>
      )}
    </Positioner>
  )
}

export default ReimbursementModal
