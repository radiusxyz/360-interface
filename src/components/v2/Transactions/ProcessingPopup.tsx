import {
  Amount,
  CloseButton,
  CloseButtonWrapper,
  DetailsWrapper,
  Envelope,
  Popup,
  ReimbursementAddress,
  Status,
} from './ProcessingPopupStyles'

type Props = { handleProcessingPopup: () => void; handleModal: () => void }

const ProcessingPopup = ({ handleProcessingPopup, handleModal }: Props) => {
  const handleBothModalAndPopup = () => {
    handleProcessingPopup()
    handleModal()
  }
  return (
    <Popup>
      <CloseButtonWrapper>
        <CloseButton onClick={handleBothModalAndPopup} />
      </CloseButtonWrapper>
      <Envelope />
      <DetailsWrapper>
        <Amount>0.005 ETH</Amount>
        <ReimbursementAddress>Reimburse To : 0xCCc3...41b6e</ReimbursementAddress>
      </DetailsWrapper>
      <Status>Processing reimbursment...</Status>
    </Popup>
  )
}

export default ProcessingPopup
