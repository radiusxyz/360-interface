import Loader from 'components/Loader'
import TopLevelModals from 'components/TopLevelModals'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import ApeModeQueryParamReader from 'hooks/useApeModeQueryParamReader'
import { Suspense, useEffect } from 'react'
import { Route, Switch } from 'react-router-dom'
import { useAppDispatch } from 'state/hooks'
import styled from 'styled-components/macro'

import GoogleAnalyticsReporter from '../components/analytics/GoogleAnalyticsReporter'
import ErrorBoundary from '../components/ErrorBoundary'
import Header from '../components/Header'
import Polling from '../components/Header/Polling'
import Popups from '../components/Popups'
import Web3ReactManager from '../components/Web3ReactManager'
import { useRecorderContract, useV2RouterContract } from '../hooks/useContract'
import { CheckPendingTx } from '../lib/utils/watcher'
import DarkModeQueryParamReader from '../theme/DarkModeQueryParamReader'
import Footer from './Footer'
import Swap from './Swap'
import { RedirectPathToSwapOnly, RedirectToSwap } from './Swap/redirects'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
`

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 120px 16px 0px 16px;
  align-items: center;
  flex: 1;
  z-index: 1;

  /* ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 4rem 8px 16px 8px;
  `}; */
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  justify-content: space-between;
  position: fixed;
  top: 0;
  z-index: 2;
`

const Marginer = styled.div`
  margin-top: 5rem;
`

export default function App() {
  const { chainId, account, library } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  const router = useV2RouterContract()
  const recorder = useRecorderContract()

  useEffect(() => {
    const interval = setInterval(async () => {
      await CheckPendingTx({ chainId, account, library, dispatch, router, recorder })
    }, 10000)

    return () => clearInterval(interval)
  }, [chainId, account, library, dispatch, router, recorder])

  return (
    <ErrorBoundary>
      <Route component={GoogleAnalyticsReporter} />
      <Route component={DarkModeQueryParamReader} />
      <Route component={ApeModeQueryParamReader} />
      <Web3ReactManager>
        <AppWrapper>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <BodyWrapper>
            <Popups />
            <Polling />
            <TopLevelModals />
            <Suspense fallback={<Loader />}>
              <Switch>
                <Route exact strict path="/swap/:outputCurrency" component={RedirectToSwap} />
                <Route exact strict path="/swap" component={Swap} />
                <Route component={RedirectPathToSwapOnly} />
              </Switch>
            </Suspense>
            <Marginer />
            <Footer />
          </BodyWrapper>
        </AppWrapper>
      </Web3ReactManager>
    </ErrorBoundary>
  )
}
