import { Trans } from '@lingui/macro'
import useScrollPosition from '@react-hook/window-scroll'
import { CHAIN_INFO } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
// import useTheme from 'hooks/useTheme'
import { darken } from 'polished'
import { NavLink } from 'react-router-dom'
import { Text } from 'rebass'
// import { useDarkModeManager } from 'state/user/hooks'
import { useNativeCurrencyBalances } from 'state/wallet/hooks'
import styled from 'styled-components/macro'

import { ExternalLink } from '../../theme'
import Row from '../Row'
import Web3Status from '../Web3Status'
import HolidayOrnament from './HolidayOrnament'
import NetworkSelector from './NetworkSelector'

// const OutMostWrapper = styled.div`
//   background: ${({ theme }) => theme.bg0};
//   display: flex;
//   width: 100%;
//   justify-content: center;
//   border: 1px solid #dde0ff;
// `

const HeaderFrame = styled.div<{ showBackground: boolean }>`
  display: flex;
  grid-template-columns: 120px 1fr 1fr;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  width: 100%;
  top: 0;
  z-index: 21;
  position: relative;
  background: ${({ theme }) => theme.bg0};
  border-bottom: 1px solid #dde0ff;
  /* Background slide effect on scroll. */
  background-image: ${({ theme }) => `linear-gradient(to bottom, transparent 50%, ${theme.bg0} 50% )}}`};
  background-position: ${({ showBackground }) => (showBackground ? '0 -100%' : '0 0')};
  background-size: 100% 200%;
  box-shadow: 0px 0px 0px 1px ${({ theme, showBackground }) => (showBackground ? theme.bg2 : 'transparent;')};
  transition: background-position 0.1s, box-shadow 0.1s;
  background-blend-mode: hard-light;
`

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  justify-self: flex-end;
  margin-right: 175px;
  gap: 47px;
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;

  /* addresses safari's lack of support for "gap" */
  & > *:not(:first-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: center;
  `};
`

const HeaderLinks = styled(Row)`
  justify-self: center;
  width: fit-content;
  display: grid;
  grid-auto-flow: column;
  grid-gap: 59px;
  margin-left: 400px;
  align-items: center;
  overflow: hidden;
  ${({ theme }) => theme.mediaWidth.upToLarge`
    justify-self: center;  
    `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-self: center;
  `};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    justify-content: space-between;
    justify-self: center;
    z-index: 99;
    position: fixed;
    bottom: 30px; right: 50%;
    transform: translate(50%,-50%);
    margin: 0 auto;
    background-color: ${({ theme }) => theme.bg0};
    border: 1px solid ${({ theme }) => theme.bg2};
    box-shadow: 0px 6px 10px rgb(0 0 0 / 2%);
  `};
`

//   background-color: ${({ theme, active }) => (!active ? theme.bg0 : theme.bg0)};
const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  width: 100%;
`

// const UNIAmount = styled(AccountElement)`
//   color: white;
//   padding: 4px 8px;
//   height: 36px;
//   font-weight: 500;
//   background-color: ${({ theme }) => theme.bg3};
//   background: radial-gradient(174.47% 188.91% at 1.84% 0%, #e84523 0%, #2172e5 100%), #edeef2;
// `

// const UNIWrapper = styled.span`
//   width: fit-content;
//   position: relative;
//   cursor: pointer;

//   :hover {
//     opacity: 0.8;
//   }

//   :active {
//     opacity: 0.9;
//   }
// `

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const TitleWrapper = styled.div`
  display: flex;
  margin-left: 28px;
  font-size: 24px;
`

const Title = styled.a`
  pointer-events: auto;
  text-decoration: none;
  color: #6b11ff;
  font-weight: bolder;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const Icon = styled.div`
  padding-right: 12px;
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }

  position: relative;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName,
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  outline: none;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  font-weight: 500;
  padding: 8px 12px;
  word-break: break-word;
  overflow: hidden;
  white-space: nowrap;
  &.${activeClassName} {
    font-weight: 600;
    justify-content: center;
    color: ${({ theme }) => theme.text1};
    background-color: transparent;
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledExternalLink = styled(ExternalLink).attrs({
  activeClassName,
})<{ isActive?: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 3rem;
  outline: none;
  white-space: nowrap;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;

  &.${activeClassName} {
    border-radius: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover,
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
    text-decoration: none;
  }
`

export default function Header() {
  const { account, chainId } = useActiveWeb3React()

  const userEthBalance = useNativeCurrencyBalances(account ? [account] : [])?.[account ?? '']
  // const [darkMode] = useDarkModeManager()
  // const { white, black } = useTheme()

  const scrollY = useScrollPosition()

  const {
    infoLink,
    nativeCurrency: { symbol: nativeCurrencySymbol },
  } = CHAIN_INFO[chainId ? chainId : SupportedChainId.MAINNET]

  return (
    <HeaderFrame showBackground={scrollY > 45}>
      <TitleWrapper>
        <Title href=".">
          <>
            <Icon>
              {/* <img src={Logo} width="28px" height="100%" alt="logo" /> */}
              <HolidayOrnament />
            </Icon>
            360°
          </>
        </Title>
      </TitleWrapper>
      <HeaderLinks>
        <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
          <Trans>Swap</Trans>
        </StyledNavLink>
        {/* <StyledExternalLink id={`charts-nav-link`} href={infoLink}>
            <Trans>Docs</Trans>
          </StyledExternalLink> */}
        <StyledExternalLink id={`charts-nav-link`} href={infoLink}>
          <Trans>About</Trans>
        </StyledExternalLink>
        <StyledExternalLink id={`history-nav-link`} href={infoLink}>
          <Trans>History</Trans>
        </StyledExternalLink>
        <StyledExternalLink id={`my-profit-nav-link`} href={infoLink}>
          <Trans>My Profit</Trans>
        </StyledExternalLink>
      </HeaderLinks>

      <HeaderControls>
        <HeaderElement>
          <NetworkSelector />
        </HeaderElement>
        <HeaderElement>
          <AccountElement active={!!account}>
            {/*account && userEthBalance ? (
                <BalanceText style={{ flexShrink: 0, userSelect: 'none' }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                  <Trans>
                    {userEthBalance?.toSignificant(3)} {nativeCurrencySymbol}
                  </Trans>
                </BalanceText>
              ) : null*/}
            <Web3Status />
          </AccountElement>
        </HeaderElement>
        {/* <HeaderElement>
            <Menu />
          </HeaderElement> */}
      </HeaderControls>
    </HeaderFrame>
  )
}
