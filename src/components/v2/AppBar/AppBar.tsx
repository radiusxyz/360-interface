import { Item, LinkList, Span360, StyledNavLink, Wrapper, Button } from './AppBarStyles'

const AppBar = () => {
  return (
    <Wrapper>
      <Span360>360°</Span360>
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
      <Button>Connect</Button>
    </Wrapper>
  )
}

export default AppBar
