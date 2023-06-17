import {
  Amount,
  CloseButton,
  CloseButtonWrapper,
  DetailsWrapper,
  Envelope,
  Popup,
  ReimbursementAddress,
  Status,
} from './ProcessingModalStyles'

type Props = { handleProcessingModal: () => void }

const ProcessingModal = ({ handleProcessingModal }: Props) => {
  return (
    <Popup>
      <CloseButtonWrapper>
        <CloseButton onClick={handleProcessingModal} />
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

export default ProcessingModal
