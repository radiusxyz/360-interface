import { Trans } from 'utils/trans'
import styled from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'
import no_entry from '../../assets/v2/images/no_entry.svg'
import Loader from '../Loader'
import { PrimaryButton } from 'components/v2/UI/Buttons'
import teacup_wait from '../../assets/v2/images/teacup_wait.svg'

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
`

const ModalTitle = styled.span`
  color: #333;
  font-size: 18px;
  font-family: Pretendard;
  font-weight: 500;
`

const Body = styled.div`
  display: flex;
  flex-direction: column;
  height: 207px;
  background: #f5f4ff;
  align-items: center;
  justify-content: flex-start;
`

const ImgWrapper = styled.div`
  margin-top: 26px;
`

const LoaderWrapper = styled.div`
  margin-top: 18px;
`

const Message = styled.p`
  color: #000;
  font-size: 18px;
  font-weight: 500;
  margin-top: 18px;
`

const MessageDetails = styled.p`
  color: #424242;
  font-size: 14px;
  text-align: center;
  font-family: Pretendard;
  margin-top: 12px;
`

const Container = styled.div`
  position: relative;
  padding: 24px 30px 30px 30px;
  background: #ffffff;
`

const Footer = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 10px;
`

const Button = styled(PrimaryButton)`
  background: #ffffff;
  color: #333;
  border: 1px solid #dde0ff;
  &:hover {
    color: #6b11ff;
    border: 1px solid #6b11ff;
  }
`

export default function PendingView({
  connector,
  error = false,
  setPendingError,
  tryActivation,
  resetAccountView,
}: {
  connector?: AbstractConnector
  error?: boolean
  setPendingError: (error: boolean) => void
  tryActivation: (connector: AbstractConnector) => void
  resetAccountView: () => void
}) {
  return error ? (
    <>
      <Body>
        <ImgWrapper>
          <img src={no_entry} alt="no_entry" />
        </ImgWrapper>
        <Message>
          <Trans>Error connecting</Trans>
        </Message>
        <MessageDetails>
          <Trans>Try again or connect to a supported network.</Trans>
        </MessageDetails>
      </Body>
      <Footer>
        <Button onClick={resetAccountView}>Go back</Button>
        <Button
          onClick={() => {
            setPendingError(false)
            connector && tryActivation(connector)
          }}
        >
          Try again
        </Button>
      </Footer>
    </>
  ) : (
    <Body>
      <ImgWrapper>
        <img src={teacup_wait} alt="teacup" />
      </ImgWrapper>
      <LoaderWrapper>
        <Loader stroke="currentColor" size="16px" />
      </LoaderWrapper>
      <Message>
        <Trans>Please Wait</Trans>
      </Message>
      <MessageDetails>
        <Trans>Waiting for confirmation on your wallet...</Trans>
      </MessageDetails>
    </Body>
  )
}
