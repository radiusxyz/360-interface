import App from 'pages/v2/App'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// import '@reach/dialog/styles.css'
// import 'inter-ui'
// import 'polyfills'
// import 'components/analytics'

import Web3ReactManager from 'components/Web3ReactManager'
import { BlockNumberProvider } from 'lib/hooks/useBlockNumber'
// import { StrictMode } from 'react'
// import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
// import { HashRouter } from 'react-router-dom'
import { createWeb3ReactRoot, Web3ReactProvider } from 'web3-react-core'

// import Blocklist from './components/Blocklist'
import { NetworkContextName } from './constants/misc'
// import { LanguageProvider } from './i18n'
// import App from './pages/App'
// import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import store from './state'
// import { MulticallUpdater } from 'lib/state/multicall'
// import ApplicationUpdater from './state/application/updater'
// import ListsUpdater from './state/lists/updater'
// import LogsUpdater from './state/logs/updater'
// import TransactionUpdater from './state/transactions/updater'
// import UserUpdater from './state/user/updater'
// import ThemeProvider, { ThemedGlobalStyle } from './theme'
// import RadialGradientByChainUpdater from './theme/RadialGradientByChainUpdater'
import getLibrary from './utils/getLibrary'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

// if (!!window.ethereum) {
//   window.ethereum.autoRefreshOnNetworkChange = false
// }

// function Updaters() {
//   return (
//     <>
//       <ListsUpdater />
//       <UserUpdater />
//       <ApplicationUpdater />
//       <TransactionUpdater />
//       <MulticallUpdater />
//       <LogsUpdater />
//     </>
//   )
// }

// ReactDOM.render(
//   <StrictMode>
//     <Provider store={store}>
//       <HashRouter>
//         <LanguageProvider>
//           <Web3ReactProvider getLibrary={getLibrary}>
//             <Web3ProviderNetwork getLibrary={getLibrary}>
//               <Blocklist>
//                 <BlockNumberProvider>
//                   <Updaters />
//                   <ThemeProvider>
//                     <ThemedGlobalStyle />
//                     <App />
//                   </ThemeProvider>
//                 </BlockNumberProvider>
//               </Blocklist>
//             </Web3ProviderNetwork>
//           </Web3ReactProvider>
//         </LanguageProvider>
//       </HashRouter>
//     </Provider>
//   </StrictMode>,
//   document.getElementById('root')
// )

// if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
//   serviceWorkerRegistration.register()
// }

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <Provider store={store}>
    <Web3ReactProvider getLibrary={getLibrary}>
      <Web3ProviderNetwork getLibrary={getLibrary}>
        <Web3ReactManager>
          <BlockNumberProvider>
            {/* <Updaters /> */}
            <App />
          </BlockNumberProvider>
        </Web3ReactManager>
      </Web3ProviderNetwork>
    </Web3ReactProvider>
  </Provider>
)
