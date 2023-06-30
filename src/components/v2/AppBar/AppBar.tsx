import { Item, LinkList, Span360, StyledNavLink, Wrapper, MainWrapper } from './AppBarStyles'

import Web3Status from 'components/Web3Status'

const AppBar = () => {
  return (
    <MainWrapper>
      <Wrapper>
        <Span360>360°</Span360>
        {window.innerWidth > 634 && (
          <LinkList>
            <StyledNavLink to="/">
              <Item>Swap</Item>
            </StyledNavLink>
            <StyledNavLink to="/about">
              <Item>About</Item>
            </StyledNavLink>
            <StyledNavLink to="/history">
              <Item>History</Item>
            </StyledNavLink>
            <StyledNavLink to="/my-profit">
              <Item>My Profit</Item>
            </StyledNavLink>
          </LinkList>
        )}

        <Web3Status />
      </Wrapper>
    </MainWrapper>
  )
}

export default AppBar
