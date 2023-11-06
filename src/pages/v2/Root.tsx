import { Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import AppBar from 'components/v2/AppBar/AppBar'
import styled from 'styled-components/macro'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useRecorderContract, useV2RouterContract } from 'hooks/useContract'

import { CheckPendingTx } from 'lib/utils/watcher'

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  padding-top: 40px;
`

const Root = () => {
  const { chainId, library } = useActiveWeb3React()

  const router = useV2RouterContract()
  const recorder = useRecorderContract()

  useEffect(() => {
    const interval = setInterval(async () => {
      await CheckPendingTx({ chainId, library, router, recorder })
    }, 10000)
    return () => clearInterval(interval)
  }, [chainId, library, router, recorder])

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
