import styled from 'styled-components/macro'
import { NavLink } from 'react-router-dom'

export const MainWrapper = styled.div`
  width: 100%;
  position: relative;
`

export const Wrapper = styled.nav`
  width: 100%;
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #dde0ff;
  align-items: center;
  min-height: 54px;
  padding: 10px 30px;
  @media (max-width: 634px) {
    padding: 10px 30px 10px 40px;
  }
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
  transition: 0.5s all ease-in-out;
  @media (max-width: 634px) {
    flex-direction: column;
    width: 100%;
    align-items: start;
    justify-content: start;
    gap: 0px;
    background: white;
    position: absolute;
    z-index: 2;
  }
`
export const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  @media (max-width: 634px) {
    width: 100%;
  }
`
export const Item = styled.li`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 19px;
  color: #333333;
  text-decoration: none;
  white-space: nowrap;
  @media (max-width: 634px) {
    font-weight: 500;
    font-size: 18px;
    line-height: 21px;
    color: #333333;
    padding: 20px 40px 19px 40px;
    width: 100%;
  }
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

export const Backdrop = styled.div`
  width: 100vw;
  min-height: 100vh;
  position: absolute;
  top: 58px;
  left: 0;
  background: black;
  opacity: 0.5;
  z-index: 1;
`
