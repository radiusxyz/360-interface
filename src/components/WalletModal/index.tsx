import { Trans } from 'utils/trans'
import { AutoColumn } from 'components/Column'
import { PrivacyPolicy } from 'components/PrivacyPolicy'
import Row, { AutoRow } from 'components/Row'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import styled from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from 'web3-react-core'
import { WalletConnectConnector } from 'web3-react-walletconnect-connector'

import MetamaskIcon from '../../assets/images/metamask.png'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { fortmatic, injected } from '../../connectors'
import { OVERLAY_READY } from '../../connectors/Fortmatic'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import usePrevious from '../../hooks/usePrevious'
import { useModalOpen, useWalletModalToggle } from '../../state/application/hooks'
import { ApplicationModal } from '../../state/application/reducer'
import { ExternalLink, ThemedText } from '../../theme'
import { isMobile } from '../../utils/userAgent'
import AccountDetails from '../AccountDetails'
import Card from '../Card'
import Modal from '../Modal'
import Option from './Option'
import PendingView from './PendingView'

const CloseIcon = styled.div`
  position: absolute;
  right: 1rem;
  top: 14px;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const CloseColor = styled(Close)`
  path {
    stroke: ${({ theme }) => theme.text4};
  }
`

const Wrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  margin: 0;
  padding: 0;
  width: 100%;
  background: white;
`

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  background: white;
  font-weight: 500;
  /*color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};*/
`

const ContentWrapper = styled.div`
  /*background-color: ${({ theme }) => theme.bg0};*/
  background: white;
  padding: 1rem 1rem 3rem 1rem;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;

  /* ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0 1rem 1rem 1rem`}; */
`

const UpperSection = styled.div`
  position: relative;

  h5 {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    font-weight: 400;
  }

  h5:last-child {
    margin-bottom: 0px;
  }

  h4 {
    margin-top: 0;
    font-weight: 500;
  }
`

const OptionGrid = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  grid-gap: 10px;
  /* ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    grid-gap: 10px;
  `}; */
`

const HoverText = styled.div`
  text-decoration: none;
  color: ${({ theme }) => theme.text1};
  display: flex;
  align-items: center;

  :hover {
    cursor: pointer;
  }
`

const LinkCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg1};
  color: ${({ theme }) => theme.text3};

  :hover {
    cursor: pointer;
    filter: brightness(0.9);
  }
`

const WALLET_VIEWS = {
  OPTIONS: 'options',
  OPTIONS_SECONDARY: 'options_secondary',
  ACCOUNT: 'account',
  PENDING: 'pending',
  LEGAL: 'legal',
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

  // console.log('walletStatus', active, account, connector, activate, error)

  const [walletView, setWalletView] = useState(WALLET_VIEWS.ACCOUNT)
  const previousWalletView = usePrevious(walletView)

  const [pendingWallet, setPendingWallet] = useState<AbstractConnector | undefined>()

  const [pendingError, setPendingError] = useState<boolean>()
  const ref = useRef()

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
      // check for mobile options
      if (isMobile) {
        if (!window.web3 && !window.ethereum && option.mobile) {
          return (
            <Option
              onClick={() => {
                option.connector !== connector && !option.href && tryActivation(option.connector)
              }}
              id={`connect-${key}`}
              key={key}
              size={46}
              active={option.connector && option.connector === connector}
              color={option.color}
              link={option.href}
              header={option.name}
              subheader={null}
              icon={option.iconURL}
            />
          )
        }
        return null
      }

      // overwrite injected when needed
      if (option.connector === injected) {
        // don't show injected if there's no injected provider
        if (!(window.web3 || window.ethereum)) {
          if (option.name === 'MetaMask') {
            return (
              <Option
                id={`connect-${key}`}
                key={key}
                size={46}
                color={'#E8831D'}
                header={<Trans>Install Metamask</Trans>}
                subheader={null}
                link={'https://metamask.io/'}
                icon={MetamaskIcon}
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
        !option.mobileOnly && (
          <Option
            id={`connect-${key}`}
            onClick={() => {
              option.connector === connector
                ? setWalletView(WALLET_VIEWS.ACCOUNT)
                : !option.href && tryActivation(option.connector)
            }}
            key={key}
            active={option.connector === connector}
            color={option.color}
            link={option.href}
            header={option.name}
            subheader={null} //use option.descriptio to bring back multi-line
            icon={option.iconURL}
          />
        )
      )
    })
  }

  function getModalContent() {
    if (error) {
      return {
        width: 800,
        content: (
          <UpperSection>
            <CloseIcon onClick={toggleWalletModal}>
              <CloseColor />
            </CloseIcon>
            <HeaderRow>
              {error instanceof UnsupportedChainIdError ? (
                <Trans>Wrong Network</Trans>
              ) : (
                <Trans>Error connecting</Trans>
              )}
            </HeaderRow>
            <ContentWrapper>
              {error instanceof UnsupportedChainIdError ? (
                <h5>
                  <Trans>Please connect to a supported network in the dropdown menu or in your wallet.</Trans>
                </h5>
              ) : (
                <Trans>Error connecting. Try refreshing the page.</Trans>
              )}
            </ContentWrapper>
          </UpperSection>
        ),
      }
    }
    if (walletView === WALLET_VIEWS.LEGAL) {
      return {
        width: 800,
        content: (
          <UpperSection>
            <HeaderRow>
              <HoverText
                onClick={() => {
                  setWalletView(
                    (previousWalletView === WALLET_VIEWS.LEGAL ? WALLET_VIEWS.ACCOUNT : previousWalletView) ??
                      WALLET_VIEWS.ACCOUNT
                  )
                }}
              >
                <ArrowLeft />
              </HoverText>
              <Row justify="center">
                <ThemedText.MediumHeader>
                  <Trans>Legal & Privacy</Trans>
                </ThemedText.MediumHeader>
              </Row>
            </HeaderRow>
            <PrivacyPolicy />
          </UpperSection>
        ),
      }
    }
    if (account && walletView === WALLET_VIEWS.ACCOUNT) {
      return {
        width: 800,
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
      width: 800,
      content: (
        <UpperSection>
          <CloseIcon onClick={toggleWalletModal} style={{ zIndex: 1 }}>
            <CloseColor />
          </CloseIcon>
          {walletView !== WALLET_VIEWS.ACCOUNT ? (
            <div style={{ width: '100%' }}>
              <HeaderRow>
                <HoverText onClick={resetAccountView} style={{ textAlign: 'center', zIndex: 1 }}>
                  <ArrowLeft />
                </HoverText>
                <div
                  style={{
                    position: 'absolute',
                    width: 'calc(100% - 32px)',
                    textAlign: 'center',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: '20',
                    zIndex: 0,
                  }}
                >
                  <Trans>Connect Wallet</Trans>
                </div>
              </HeaderRow>
            </div>
          ) : (
            <HeaderRow>
              <HoverText>
                <Trans>Connect a wallet</Trans>
              </HoverText>
            </HeaderRow>
          )}

          <ContentWrapper>
            <AutoColumn gap="16px">
              {walletView === WALLET_VIEWS.PENDING && (
                <PendingView
                  connector={pendingWallet}
                  error={pendingError}
                  setPendingError={setPendingError}
                  tryActivation={tryActivation}
                  resetAccountView={resetAccountView}
                />
              )}
              {walletView !== WALLET_VIEWS.PENDING && (
                <>
                  <OptionGrid>{getOptions()}</OptionGrid>
                  {/* <LinkCard padding=".5rem" $borderRadius=".75rem" onClick={() => setWalletView(WALLET_VIEWS.LEGAL)}>
                  <RowBetween>
                    <AutoRow gap="4px">
                      <Info size={20} />
                      <ThemedText.Label fontSize={14}>
                        <Trans>How this app uses APIs</Trans>
                      </ThemedText.Label>
                    </AutoRow>
                    <ArrowRight size={16} />
                  </RowBetween>
                </LinkCard>
                <ThemedText.Black fontSize={14}>
                  <ExternalLink href="https://help.uniswap.org/en/articles/5391525-what-is-a-wallet">
                    <Row justify="center" alignItems="center">
                      <Trans>Learn more about wallets</Trans>
                      <ArrowRight size={16} />
                    </Row>
                  </ExternalLink>
                </ThemedText.Black> */}
                </>
              )}
              {!pendingError && (
                <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                  <div style={{ width: '90%' }}>
                    <AutoRow style={{ flexWrap: 'nowrap' }}>
                      <ThemedText.Label fontSize={16} fontWeight={400} color={'#8BB3FF'}>
                        <Trans>
                          By connecting a wallet, you confirm that you have read and agree to our{' '}
                          <ExternalLink
                            href="https://360swap.io/terms-of-service/"
                            style={{ color: '#8BB3FF', fontWeight: 'bold' }}
                          >
                            Terms of Service
                          </ExternalLink>
                        </Trans>
                      </ThemedText.Label>
                    </AutoRow>
                  </div>
                </div>
              )}
            </AutoColumn>
          </ContentWrapper>
        </UpperSection>
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
