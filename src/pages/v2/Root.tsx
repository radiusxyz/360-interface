import { Outlet } from 'react-router-dom'
import AppBar from '../../components/v2/AppBar'
import styled from 'styled-components/macro'

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  padding-top: 40px;
`

const Root = () => {
  return (
    <>
      <AppBar />
      <Wrapper>
        <Outlet />
      </Wrapper>
    </>
  )
}

export default Root
