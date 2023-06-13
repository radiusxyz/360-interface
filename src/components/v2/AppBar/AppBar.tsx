import React from 'react'
import { Item, LinkList, Span360, StyledNavLink, Wrapper, Button, MenuIcon } from './AppBarStyles'

const AppBar = () => {
  return (
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

      <Button>Connect</Button>

      {window.innerWidth <= 634 && (
        <MenuIcon>
          <rect width="22" height="2" fill="#646464" />
          <rect y="9" width="22" height="2" fill="#646464" />
          <rect y="18" width="22" height="2" fill="#646464" />
        </MenuIcon>
      )}
    </Wrapper>
  )
}

export default AppBar
