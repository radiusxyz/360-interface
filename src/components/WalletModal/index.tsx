import { Trans } from 'utils/trans'
import { useCallback, useEffect, useState } from 'react'
import ReactGA from 'react-ga4'
import styled from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from 'web3-react-core'
import { WalletConnectConnector } from 'web3-react-walletconnect-connector'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import { fortmatic, injected } from '../../connectors'
import { OVERLAY_READY } from '../../connectors/Fortmatic'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import usePrevious from '../../hooks/usePrevious'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { isMobile } from '../../utils/userAgent'
import AccountDetails from '../AccountDetails'
import Modal from '../Modal'
import Option from './Option'
import PendingView from './PendingView'
import no_entry from '../../assets/v2/images/no_entry.svg'
import { PrimaryButton } from 'components/v2/UI/Buttons'

const CloseIcon = styled.div`
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: #000000;
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
  background: rgba(44, 47, 63);
`

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

const Button = styled(PrimaryButton)`
  background: #ffffff;
  border: 1px solid #6b11ff;
  color: #6b11ff;
  margin-top: 10px;
`

const OptionGrid = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  ACCOUNT: 'account',
  PENDING: 'pending',
}

export default function WalletModal({
  pendingTransactions,
  confirmedTransactions,
  ENSName,
}: {
  pendingTransactions: string[] // hashes of pending
  confirmedTransactions: string[] // hashes of confirmed
  ENSName?: string
}) {
  // important that these are destructed from the account-specific web3-react context
  const { active, account, connector, activate, error } = useWeb3React()

  connector?.on('networkChanged', () => {
    console.log('networkChanged')
  })
  connector?.on('chainChanged', () => {
    console.log('chainChanged')
  })
  connector?.on('accountsChanged', () => {
    console.log('accountsChanged')
  })

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)

  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()

  const walletModalOpen = useModalOpen(ApplicationModal.WALLET)
  const toggleWalletModal = useWalletModalToggle()

  const previousAccount = usePrevious(account)

  const resetAccountView = useCallback(() => {
    setPendingError(false)
    setWalletView(WALLET_VIEWS.ACCOUNT)
  }, [setPendingError, setWalletView])

  // close on connection, when logged out before
  useEffect(() => {
    if (account && !previousAccount && walletModalOpen) {
      toggleWalletModal()
    }
  }, [account, previousAccount, toggleWalletModal, walletModalOpen])

  // always reset to account view
  useEffect(() => {
    if (walletModalOpen) {
      resetAccountView()
    }
  }, [walletModalOpen, resetAccountView])

  // close modal when a connection is successful
  const activePrevious = usePrevious(active)
  const connectorPrevious = usePrevious(connector)
  useEffect(() => {
    if (walletModalOpen && ((active && !activePrevious) || (connector && connector !== connectorPrevious && !error))) {
      setWalletView(WALLET_VIEWS.ACCOUNT)
    }
  }, [setWalletView, active, error, connector, walletModalOpen, activePrevious, connectorPrevious])

  const tryActivation = async (connector: AbstractConnector | undefined) => {
    let name = ''
    Object.keys(SUPPORTED_WALLETS).map((key) => {
      if (connector === SUPPORTED_WALLETS[key].connector) {
        return (name = SUPPORTED_WALLETS[key].name)
      }
      return true
    })
    // log selected wallet
    ReactGA.event({
      category: 'Wallet',
      action: 'Change Wallet',
      label: name,
    })
    setPendingWallet(connector) // set wallet for pending view
    setWalletView(WALLET_VIEWS.PENDING)

    // if the connector is walletconnect and the user has already tried to connect, manually reset the connector
    if (connector instanceof WalletConnectConnector) {
      connector.walletConnectProvider = undefined
    }

    connector &&
      activate(connector, undefined, true).catch((error) => {
        if (error instanceof UnsupportedChainIdError) {
          activate(connector) // a little janky...can't use setError because the connector isn't set
        } else {
          setPendingError(true)
        }
      })
  }

  // close wallet modal if fortmatic modal is active
  useEffect(() => {
    fortmatic.on(OVERLAY_READY, () => {
      toggleWalletModal()
    })
  }, [toggleWalletModal])

  // get wallets user can switch too, depending on device/browser
  function getOptions() {
    const isMetamask = !!window.ethereum?.isMetaMask
    return Object.keys(SUPPORTED_WALLETS).map((key) => {
      const option = SUPPORTED_WALLETS[key]
      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                header={<Trans>Install Metamask</Trans>}
                link={'https://metamask.io/'}
                icon={option.iconURL}
              />
            )
          } else {
            return null //don't want to return install twice
          }
        }
        // don't return metamask if injected provider isn't metamask
        else if (option.name === 'MetaMask' && !isMetamask) {
          return null
        }
        // likewise for generic
        else if (option.name === 'Injected' && isMetamask) {
          return null
        }
      }

      // return rest of options
      return (
        !isMobile &&
        !option.mobileOnly &&
        option.name !== 'MetaMask_New' && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector)
            }}
            key={key}
            active={option.connector === connector}
            link={option.href}
            header={option.name}
            icon={option.iconURL}
          />
        )
      )
    })
  }

  function getModalContent() {
    if (error) {
      return {
        width: 425,
        content: (
          <Container>
            <HeaderRow>
              <ModalTitle>
                <Trans>{walletView !== WALLET_VIEWS.ACCOUNT ? 'Connect wallet' : 'Connect a wallet'}</Trans>
              </ModalTitle>
              <CloseIcon onClick={toggleWalletModal}>
                <CloseColor />
              </CloseIcon>
            </HeaderRow>
            <Body>
              <ImgWrapper>
                <img src={no_entry} alt="no_entry" />
              </ImgWrapper>
              <Message>
                <Trans> {error instanceof UnsupportedChainIdError ? 'Wrong Network' : 'Error connecting'}</Trans>
              </Message>
              <MessageDetails>
                {error instanceof UnsupportedChainIdError ? (
                  <Trans>
                    Please connect to a supported network
                    <br />
                    in the dropdown menu or in your wallet.
                  </Trans>
                ) : (
                  <Trans>
                    Oops, looks like we couldn&apos;t connect! Don&apos;t worry, <br />
                    let&apos;s give it another shot.
                  </Trans>
                )}
              </MessageDetails>
            </Body>
            {error instanceof UnsupportedChainIdError ? (
              <Button onClick={resetAccountView}>Back to wallet selection</Button>
            ) : (
              <Button
                onClick={() => {
                  setPendingError(false)
                  connector && tryActivation(connector)
                }}
              >
                Try again
              </Button>
            )}
          </Container>
        ),
      }
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return {
        width: 500,
        content: (
          <AccountDetails
            toggleWalletModal={toggleWalletModal}
            pendingTransactions={pendingTransactions}
            confirmedTransactions={confirmedTransactions}
            ENSName={ENSName}
            openOptions={() => setWalletView(WALLET_VIEWS.OPTIONS)}
          />
        ),
      }
    }
    return {
      width: 425,
      content: (
        <Container>
          <HeaderRow>
            <ModalTitle>
              <Trans> {walletView !== WALLET_VIEWS.ACCOUNT ? 'Connect wallet' : 'Connect a wallet'}</Trans>
            </ModalTitle>
            <CloseIcon onClick={toggleWalletModal}>
              <CloseColor />
            </CloseIcon>
          </HeaderRow>
          {walletView === WALLET_VIEWS.PENDING && (
            <PendingView
              connector={pendingWallet}
              error={pendingError}
              setPendingError={setPendingError}
              tryActivation={tryActivation}
              resetAccountView={resetAccountView}
            />
          )}
          {walletView !== WALLET_VIEWS.PENDING && <OptionGrid>{getOptions()}</OptionGrid>}
        </Container>
      ),
    }
  }

  const contentsInfo = getModalContent()

  return (
    <Modal
      isOpen={walletModalOpen}
      onDismiss={toggleWalletModal}
      minHeight={false}
      maxHeight={90}
      width={contentsInfo.width}
    >
      <Wrapper>{contentsInfo.content}</Wrapper>
    </Modal>
  )
}
