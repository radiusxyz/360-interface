import { Trans } from 'utils/trans'
import { Fraction } from '@uniswap/sdk-core'
import { Connector } from '@web3-react/types'
import launchLinkImage from 'assets/images/launch-link-open-thin.png'
import { useLiveQuery } from 'dexie-react-hooks'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { useCallback, useContext } from 'react'
// import { ExternalLink as LinkIcon } from 'react-feather'
import { useAppDispatch } from 'state/hooks'
import { useShowHistoryManager } from 'state/modal/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'

import { ReactComponent as Close } from '../../assets/images/x.svg'
import { injected, walletlink } from '../../connectors'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import { clearAllTransactions } from '../../state/transactions/reducer'
import { ExternalLink } from '../../theme'
import { shortenAddress } from '../../utils'
import { db, Status } from '../../utils/db'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import Copy from './Copy'
import Transaction from './Transaction'

const HeaderRow = styled.div`
  background-color: white;
  padding: 10px;
  font-weight: 600;
  color: ${(props) => (props.color === 'blue' ? ({ theme }) => theme.primary1 : 'inherit')};
`

const UpperSection = styled.div`
  position: relative;
  background: white;
  margin: 30px;

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
  padding: 22px 24px;
  border-radius: 2px;
  background: rgba(255, 230, 255, 255);
  position: relative;
  margin: 0px 30px 0px 30px;
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

const AccountSection = styled.div``

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
  padding: 24px;
  border-radius: 2px;
  background: rgba(23, 26, 38, 0.5);
  margin: 14px 30px 30px 30px;
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
  font-size: 0.825rem;
  display: flex;
  :hover {
    color: ${({ theme }) => theme.text2};
  }
`

const CloseIcon = styled.div`
  position: absolute;
  right: 30px;
  top: 31px;
  :hover {
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
`

function LinkIcon() {
  return <img src={launchLinkImage} width="16px" height="16px" alt="link" />
}

function LinkIconThin() {
  return <img src={launchLinkImage} width="16px" height="16px" alt="link" style={{ position: 'relative' }} />
}

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
  font-size: 14px;
  color: #ffffff;
  border: 0px solid;
  padding: 0px;
  :hover {
    border: 0px solid;
    text-decoration: underline;
  }
`

function renderTransactions(transactions: string[]) {
  return (
    <TransactionListWrapper>
      {transactions.map((hash, i) => {
        return <Transaction key={hash} hash={hash} />
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
}

function renderRecentTx(chainId: number | undefined, recentTx: any) {
  if (chainId === undefined) {
    return <></>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', marginTop: '12px', gap: '8px', height: '73px' }}>
      {recentTx.map((i: any) => {
        return (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }} key={i.id}>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div style={{ color: '#a8a8a8', fontSize: '14px' }}>
                {JSBIDivide(JSBI.BigInt(i.from.amount), JSBI.BigInt(i.from.decimal), 3) +
                  ' ' +
                  i.from.token +
                  ' to ' +
                  JSBIDivide(JSBI.BigInt(i.to.amount), JSBI.BigInt(i.to.decimal), 3) +
                  ' ' +
                  i.to.token}
              </div>
              <div style={{ padding: '0px 0px 0px 16px', display: 'flex', verticalAlign: 'bottom' }}>
                {i.txId !== '' ? (
                  <AddressLink
                    hasENS={false}
                    isENS={false}
                    href={getExplorerLink(chainId, i.txId, ExplorerDataType.TRANSACTION)}
                    style={{
                      marginLeft: '0px',
                      position: 'relative',
                      display: 'flex',
                      verticalAlign: 'bottom',
                      alignItems: 'end',
                    }}
                  >
                    <LinkIconThin />
                  </AddressLink>
                ) : (
                  <></>
                )}
              </div>
            </div>
            <div style={{ fontSize: '14px' }}>{getStatus(i.status)}</div>
          </div>
        )
      })}
      {recentTx.length === 0 && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            textAlign: 'center',
            justifyContent: 'center',
            verticalAlign: 'middle',
            color: '#a8a8a8',
          }}
        >
          You have no recent transactions
        </div>
      )}
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
  const [showHistory, setShowHistory] = useShowHistoryManager()

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
      <div style={{ marginRight: '10px' }}>
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
    return await db.txHistory.orderBy('id').reverse().limit(3).toArray()
  })

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
                        <p style={{ marginRight: '12px' }}> {account && shortenAddress(account)}</p>
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
                              style={{ marginLeft: '12px' }}
                            >
                              <LinkIcon />
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
                              style={{ marginLeft: '12px' }}
                            >
                              <LinkIcon />
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
                    justifyContent: 'center',
                    alignItems: 'end',
                    width: '50%',
                    height: '44px',
                    verticalAlign: 'middle',
                  }}
                >
                  {connector !== injected && connector !== walletlink && (
                    <WalletAction
                      style={{ fontSize: '14px', fontWeight: 600 }}
                      onClick={() => (connector as any).close()}
                    >
                      <Trans>Disconnect Wallet</Trans>
                    </WalletAction>
                  )}
                </div>
              </AccountGroupingRow>
            </InfoCard>
            <div style={{ padding: '10px', justifyContent: 'space-around' }}>
              <button style={{ width: '48%', height: '20px' }}>Disconnect Wallet</button>
              <button style={{ width: '48%', height: '20px' }}>Explorer</button>
            </div>
          </YourAccount>
        </AccountSection>
      </UpperSection>
    </>
  )
}

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  return new Fraction(numerator, denominator).toSignificant(precision).toString()
}
