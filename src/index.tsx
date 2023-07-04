import App from 'pages/v2/App'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Web3ReactManager from 'components/Web3ReactManager'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
import { Provider } from 'react-redux'
import { createWeb3ReactRoot, Web3ReactProvider } from 'web3-react-core'
import { NetworkContextName } from './constants/misc'
import store from './state'
import getLibrary from './utils/getLibrary'
import Updaters from './Updaters'
import TLPEncryptSign from './TLPEncryptSign'
import SwapProvider from 'store/SwapProvider'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Web3ProviderNetwork getLibrary={getLibrary}>
          <Web3ReactManager>
            <BlockNumberProvider>
              <Updaters />
              <SwapProvider>
                <TLPEncryptSign />
                <App />
              </SwapProvider>
            </BlockNumberProvider>
          </Web3ReactManager>
        </Web3ProviderNetwork>
      </Web3ReactProvider>
    </Provider>
  </React.StrictMode>
)
