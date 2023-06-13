import styled from 'styled-components/macro'
import { NavLink } from 'react-router-dom'

export const Wrapper = styled.nav`
  width: 100%;
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #dde0ff;
  align-items: center;
  min-height: 54px;
  padding: 10px 30px;
`

export const Span360 = styled.span`
  font-family: Manrope;
  font-style: normal;
  font-weight: 800;
  font-size: 24px;
  line-height: 33px;
  letter-spacing: -0.02em;
  color: #2f0093;
`

export const LinkList = styled.ul`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: auto;
  flex-grow: 0;
  list-style: none;
  gap: 59px;
`
export const Item = styled.li`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  color: #333333;
  text-decoration: none;
  white-space: nowrap;
`

export const StyledNavLink = styled(NavLink)`
  text-decoration: none;
`

export const Button = styled.button`
  border: none;
  border-radius: 43px;
  width: 100%;
  background: #6b11ff;
  max-width: 120px;
  padding: 9px 32px;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #ffffff;
`

export const MenuIcon = styled.svg.attrs({
  viewbox: '0 0 22 20',
  fill: 'none',
  width: 22,
  height: 20,
})``
