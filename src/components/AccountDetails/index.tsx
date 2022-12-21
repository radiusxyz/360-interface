import { Trans } from '@lingui/macro'
import { Connector } from '@web3-react/types'
import { useLiveQuery } from 'dexie-react-hooks'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useCallback, useContext } from 'react'
import { ExternalLink as LinkIcon } from 'react-feather'
import { useAppDispatch } from 'state/hooks'
import { setShowHistory } from 'state/modal/reducer'
import styled, { ThemeContext } from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import { injected, walletlink } from '../../connectors'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import { clearAllTransactions } from '../../state/transactions/reducer'
import { ExternalLink, ThemedText } from '../../theme'
import { LinkStyledButton } from '../../theme'
import { shortenAddress } from '../../utils'
import { db, Status } from '../../utils/db'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import { AutoRow } from '../Row'
import Copy from './Copy'
import Transaction from './Transaction'

const HeaderRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  padding: 1rem 1rem;
  font-weight: 500;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem;
  `};
`

const UpperSection = styled.div`
  position: relative;
  background: rgba(44, 47, 63);

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

const InfoCard = styled.div`
  padding: 16px;
  border-radius: 2px;
  background: rgba(23, 26, 38, 0.5);
  position: relative;
  margin: 16px;
`

const AccountGroupingRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  justify-content: space-between;
  align-items: center;
  font-weight: 400;
  color: ${({ theme }) => theme.text1};

  div {
    ${({ theme }) => theme.flexRowNoWrap}
    align-items: center;
  }
`

const AccountSection = styled.div`
  ${({ theme }) => theme.mediaWidth.upToMedium`padding: 0rem 1rem 1.5rem 1rem;`};
`

const YourAccount = styled.div`
  h5 {
    margin: 0 0 1rem 0;
    font-weight: 400;
  }

  h4 {
    margin: 0;
    font-weight: 500;
  }
`

const LowerSection = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  padding: 16px;
  border-radius: 2px;
  background: rgba(23, 26, 38, 0.5);
  margin: 16px;
  overflow: auto;

  h5 {
    margin: 0;
    font-weight: 400;
    color: ${({ theme }) => theme.text3};
  }
`

const AccountControl = styled.div`
  display: flex;
  justify-content: space-between;
  min-width: 0;
  width: 100%;

  font-weight: 500;
  font-size: 1.25rem;

  a:hover {
    text-decoration: underline;
  }

  p {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const AddressLink = styled(ExternalLink)<{ hasENS: boolean; isENS: boolean }>`
  font-size: 0.825rem;
  color: ${({ theme }) => theme.text3};
  margin-left: 1rem;
  font-size: 0.825rem;
  display: flex;
  :hover {
    color: ${({ theme }) => theme.text2};
  }
`

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

const WalletName = styled.div`
  width: initial;
  font-size: 0.825rem;
  font-weight: 500;
  color: ${({ theme }) => theme.text3};
`

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  & > img,
  span {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

function WrappedStatusIcon({ connector }: { connector: AbstractConnector | Connector }) {
  return (
    <IconWrapper size={16}>
      <StatusIcon connector={connector} />
    </IconWrapper>
  )
}

const TransactionListWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
`

const WalletAction = styled(ButtonSecondary)`
  width: fit-content;
  font-weight: 400;
  margin-left: 8px;
  font-size: 0.825rem;
  padding: 4px 6px;
  color: #ffffff;
  border: 0px solid;
  :hover {
    border: 0px solid;
    text-decoration: underline;
  }
`

function renderTransactions(transactions: string[]) {
  return (
    <TransactionListWrapper>
      {transactions.map((hash, i) => {
        return <Transaction key={i} hash={hash} />
      })}
    </TransactionListWrapper>
  )
}

function getStatus(status: Status) {
  switch (status) {
    case Status.CANCELED:
      return <span style={{ color: '#A8A8A8' }}>Void</span>
    case Status.COMPLETED:
      return <span style={{ color: '#51FF6D' }}>Completed</span>
    case Status.PENDING:
      return <span style={{ color: '#FF4444' }}>Pending</span>
    case Status.REIMBURSED:
      return <span style={{ color: '#FFBF44' }}>Reimbursed</span>
    case Status.REIMBURSE_AVAILABLE:
      return <span style={{ color: '#00A3FF' }}>Reimburse Available</span>
    case Status.REJECTED:
      return <span style={{ color: '#FFFFFF' }}>Rejected</span>
  }
  return <span style={{ color: '#FFFFFF' }}>Rejected</span>
}

function renderRecentTx(recentTx: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {recentTx.map((i: any) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} key={i}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div style={{ padding: '0px 5px', color: '#a8a8a8', fontSize: '14px' }}>
                {
                  // TODO: amount 000,000,000.00 형식으로 바꾸기
                  i.from.amount.substring(0, i.from.amount.length - 18) +
                    ' ' +
                    i.from.token +
                    ' to ' +
                    i.to.amount.substring(0, i.to.amount.length - 18) +
                    ' ' +
                    i.to.token
                }
              </div>
              <div style={{ padding: '0px 5px' }}>
                <AddressLink
                  hasENS={false}
                  isENS={false}
                  href={getExplorerLink(80001, i.txId, ExplorerDataType.TRANSACTION)}
                  style={{ marginLeft: '0px' }}
                >
                  <LinkIcon size={20} />
                </AddressLink>
              </div>
            </div>
            <div style={{ fontSize: '14px' }}>{getStatus(i.status)}</div>
          </div>
        )
      })}
    </div>
  )
}

interface AccountDetailsProps {
  toggleWalletModal: () => void
  pendingTransactions: string[]
  confirmedTransactions: string[]
  ENSName?: string
  openOptions: () => void
}

export default function AccountDetails({
  toggleWalletModal,
  pendingTransactions,
  confirmedTransactions,
  ENSName,
  openOptions,
}: AccountDetailsProps) {
  const { chainId, account, connector } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const dispatch = useAppDispatch()

  function formatConnectorIcon() {
    const { ethereum } = window
    const isMetaMask = !!(ethereum && ethereum.isMetaMask)
    const name = Object.keys(SUPPORTED_WALLETS)
      .filter(
        (k) =>
          SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK'))
      )
      .map((k) => SUPPORTED_WALLETS[k].name)[0]
    const icon = Object.keys(SUPPORTED_WALLETS)
      .filter(
        (k) =>
          SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK'))
      )
      .map((k) => SUPPORTED_WALLETS[k].iconURL)[0]

    return (
      <div style={{ margin: '0px 16px' }}>
        <img src={icon} width="28" height="28" alt="" />
      </div>
    )

    // return (
    //   <WalletName>
    //     <Trans>Connected with {name}</Trans>
    //   </WalletName>
    // )
  }

  const clearAllTransactionsCallback = useCallback(() => {
    if (chainId) dispatch(clearAllTransactions({ chainId }))
  }, [dispatch, chainId])

  const recentTx = useLiveQuery(async () => {
    return await db.txHistory.orderBy('txDate').reverse().limit(3).toArray()
  })

  console.log(recentTx)

  return (
    <>
      <UpperSection>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
        <HeaderRow>
          <Trans>Connected Wallet</Trans>
        </HeaderRow>
        <AccountSection>
          <YourAccount>
            <InfoCard>
              <AccountGroupingRow id="web3-account-identifier-row">
                <AccountControl>
                  {ENSName ? (
                    <>
                      <div>
                        {/*connector && <WrappedStatusIcon connector={connector} />*/}
                        {formatConnectorIcon()}
                        <p> {ENSName}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        {/*connector && <WrappedStatusIcon connector={connector} />*/}
                        {formatConnectorIcon()}
                        <p> {account && shortenAddress(account)}</p>
                      </div>
                    </>
                  )}
                  {ENSName ? (
                    <>
                      <AccountControl>
                        <div>
                          {account && <Copy toCopy={account} />}
                          {chainId && account && (
                            <AddressLink
                              hasENS={!!ENSName}
                              isENS={true}
                              href={getExplorerLink(chainId, ENSName, ExplorerDataType.ADDRESS)}
                            >
                              <LinkIcon size={20} />
                            </AddressLink>
                          )}
                        </div>
                      </AccountControl>
                    </>
                  ) : (
                    <>
                      <AccountControl>
                        <div>
                          {account && <Copy toCopy={account} />}
                          {chainId && account && (
                            <AddressLink
                              hasENS={!!ENSName}
                              isENS={false}
                              href={getExplorerLink(chainId, account, ExplorerDataType.ADDRESS)}
                            >
                              <LinkIcon size={20} />
                            </AddressLink>
                          )}
                        </div>
                      </AccountControl>
                    </>
                  )}
                </AccountControl>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'right',
                    alignItems: 'end',
                    width: '50%',
                  }}
                >
                  <WalletAction
                    style={{ fontSize: '.825rem', fontWeight: 400 }}
                    onClick={() => {
                      openOptions()
                    }}
                  >
                    <Trans>Change Wallet</Trans>
                  </WalletAction>
                  {connector !== injected && connector !== walletlink && (
                    <WalletAction
                      style={{ fontSize: '.825rem', fontWeight: 400 }}
                      onClick={() => {
                        ;(connector as any).close()
                      }}
                    >
                      <Trans>Disconnect Wallet</Trans>
                    </WalletAction>
                  )}
                </div>
              </AccountGroupingRow>
            </InfoCard>
          </YourAccount>
        </AccountSection>
      </UpperSection>
      {!!recentTx || !!pendingTransactions.length || !!confirmedTransactions.length ? (
        <LowerSection>
          <AutoRow mb={'1rem'} style={{ justifyContent: 'space-between' }}>
            <ThemedText.Body>
              <Trans>Recent Transactions</Trans>
            </ThemedText.Body>
            {/* <LinkStyledButton onClick={clearAllTransactionsCallback}>
              <Trans>(clear all)</Trans>
            </LinkStyledButton> */}
            <LinkStyledButton onClick={() => setShowHistory({ showHistory: true })}>View All</LinkStyledButton>
          </AutoRow>
          {recentTx && renderRecentTx(recentTx)}
          {renderTransactions(pendingTransactions)}
          {renderTransactions(confirmedTransactions)}
        </LowerSection>
      ) : (
        <LowerSection>
          <ThemedText.Body color={theme.text1}>
            <Trans>Your transactions will appear here...</Trans>
          </ThemedText.Body>
        </LowerSection>
      )}
    </>
  )
}
