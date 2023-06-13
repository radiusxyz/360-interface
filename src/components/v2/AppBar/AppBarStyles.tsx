import styled from 'styled-components/macro'
import { NavLink } from 'react-router-dom'

export const Wrapper = styled.nav`
  width: 100%;
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #dde0ff;
  align-items: center;
`

export const Span360 = styled.span`
  font-family: Manrope;
  font-style: normal;
  font-weight: 800;
  font-size: 24px;
  line-height: 33px;
  letter-spacing: -0.02em;
  color: #2f0093;
  margin-left: 28px;
`

export const LinkList = styled.ul`
  display: flex;
  justify-content: space-between;
  flex-shrink: 1;
  list-style: none;
  max-width: 398px;
  width: 100%;
  padding: 0 10px;
  gap: 10px;
`
export const Item = styled.li`
  padding: 21px 0px 20px 0px;
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
