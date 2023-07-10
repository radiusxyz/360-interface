import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import AppBar from '../../components/v2/AppBar/AppBar'
import styled from 'styled-components/macro'
import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useRecorderContract, useV2RouterContract } from '../../hooks/useContract'

import { CheckPendingTx } from '../../lib/utils/watcher'
import FabItem from '../../components/v2/FAB/FabItem'

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
`

const MainWrapper = styled.div``

const Root = () => {
  const currentLocation = useLocation()
  const isHistoryPage = currentLocation.pathname.includes('/history')
  const { chainId, library } = useActiveWeb3React()
  const [status, setStatus] = useState(-1)

  const router = useV2RouterContract()
  const recorder = useRecorderContract()

  useEffect(() => {
    const interval = setInterval(async () => {
      await CheckPendingTx({ chainId, library, router, recorder })
    }, 10000)
    return () => clearInterval(interval)
  }, [chainId, library, router, recorder])

  return (
    <MainWrapper>
      <AppBar />
      <Wrapper>
        <Outlet />
      </Wrapper>
      {!isHistoryPage && status !== -1 && <FabItem status={status} />}
    </MainWrapper>
  )
}

export default Root
