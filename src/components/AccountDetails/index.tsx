import { Trans } from 'utils/trans'
import { Fraction } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import styled from 'styled-components/macro'
import { ReactComponent as Close } from '../../assets/images/x.svg'
import { injected } from '../../connectors'
import { SUPPORTED_WALLETS } from '../../constants/wallet'
import { shortenAddress } from '../../utils'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import Copy from './Copy'
import { PrimaryButton } from 'components/v2/UI/Buttons'
import React from 'react'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  background: #ffffff;
  padding: 24px 30px 30px 30px;
  width: 100%;
`

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 11px;
`

const AccountInfo = styled.div`
  display: flex;
  background: #f5f4ff;
  margin-bottom: 16px;
  padding: 26px;
  align-items: center;
`

const CloseIcon = styled.div`
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

const WalletAction = styled(PrimaryButton)`
  width: 100%;
  color: #333;
  border: 1px solid #dde0ff;
  font-size: 16px;
  border-radius: 4px;
  background: transparent;
  :hover {
    text-decoration: underline;
  }
`

const ModalTitle = styled.span`
  color: #333;
  font-size: 18px;
  font-family: Pretendard;
  font-weight: 500;
`

const ButtonsRow = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`

const ImgWrapper = styled.div``

const WalletName = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  margin-left: 26px;
  p {
    color: #000;
    font-size: 18px;
    font-weight: 500;
  }
  p:nth-child(2) {
    color: #666;
    font-size: 16px;
  }
`

interface AccountDetailsProps {
  toggleWalletModal: () => void
  pendingTransactions: string[]
  confirmedTransactions: string[]
  ENSName?: string
  openOptions: () => void
}

function AccountDetails({ toggleWalletModal, ENSName, openOptions }: AccountDetailsProps) {
  const { chainId, account, connector } = useActiveWeb3React()

  function formatConnectorIcon() {
    const { ethereum } = window
    const isMetaMask = !!(ethereum && ethereum.isMetaMask)
    const icon = Object.keys(SUPPORTED_WALLETS)
      .filter(
        (k) =>
          SUPPORTED_WALLETS[k].connector === connector && (connector !== injected || isMetaMask === (k === 'METAMASK'))
      )
      .map((k) => SUPPORTED_WALLETS[k].iconURL)[0]

    return <img src={icon} width="68px" alt="wallet" />
  }

  const handleChangeWallet = () => {
    openOptions()
  }

  const handleExplore = () => {
    if (chainId && account) {
      window.open(
        getExplorerLink(chainId, ENSName ? ENSName : account, ExplorerDataType.ADDRESS),
        '_blank',
        'noopener,noreferrer'
      )
    }
  }

  return (
    <Wrapper>
      <HeaderRow>
        <ModalTitle>
          <Trans>Connected Wallet</Trans>
        </ModalTitle>
        <CloseIcon onClick={toggleWalletModal}>
          <CloseColor />
        </CloseIcon>
      </HeaderRow>
      <AccountInfo>
        <ImgWrapper>{formatConnectorIcon()}</ImgWrapper>
        <WalletName>
          {account && <p> {shortenAddress(account)}</p>}
          {ENSName && <p>{ENSName}</p>}
        </WalletName>
        {account && <Copy toCopy={account} />}
      </AccountInfo>
      <ButtonsRow>
        <WalletAction onClick={handleChangeWallet}>
          <Trans>Change Wallet</Trans>
        </WalletAction>
        <WalletAction onClick={handleExplore}>
          <Trans>Explore</Trans>
        </WalletAction>
      </ButtonsRow>
    </Wrapper>
  )
}

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  return new Fraction(numerator, denominator).toSignificant(precision).toString()
}

export default AccountDetails
