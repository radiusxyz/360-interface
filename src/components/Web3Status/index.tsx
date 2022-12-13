// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Connector } from '@web3-react/types'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { darken } from 'polished'
import { useMemo } from 'react'
import { Activity } from 'react-feather'
import styled, { css } from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from 'web3-react-core'

import { NetworkContextName } from '../../constants/misc'
import { useV2RouterContract } from '../../hooks/useContract'
import useENSName from '../../hooks/useENSName'
import { useHasSocks } from '../../hooks/useSocksBalance'
import { useWalletModalToggle } from '../../state/application/hooks'
import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/types'
import { shortenAddress } from '../../utils'
import { db } from '../../utils/db'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import Loader from '../Loader'
import { RowBetween } from '../Row'
import WalletModal from '../WalletModal'

const IconWrapper = styled.div<{ size?: number }>`
  ${({ theme }) => theme.flexColumnNoWrap};
  align-items: center;
  justify-content: center;
  & > * {
    height: ${({ size }) => (size ? size + 'px' : '32px')};
    width: ${({ size }) => (size ? size + 'px' : '32px')};
  }
`

const Web3StatusGeneric = styled(ButtonSecondary)`
  ${({ theme }) => theme.flexRowNoWrap}
  width: 100%;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0px;
  cursor: pointer;
  user-select: none;
  height: 36px;
  :focus {
    outline: none;
  }
`
const Web3StatusError = styled(Web3StatusGeneric)`
  background-color: ${({ theme }) => theme.red1};
  // border: 1px solid ${({ theme }) => theme.red1};
  border: none;
  color: ${({ theme }) => theme.white};
  font-weight: 500;
  :hover,
  :focus {
    background-color: ${({ theme }) => darken(0.1, theme.red1)};
  }
`

const Web3StatusConnect = styled(Web3StatusGeneric)<{ faded?: boolean }>`
  background-color: ${({ theme }) => theme.primary4};
  border: none;

  color: ${({ theme }) => theme.primaryText1};
  font-weight: 500;

  :hover,
  :focus {
    border: none;
    // border: 1px solid ${({ theme }) => darken(0.05, theme.primary4)};
    color: ${({ theme }) => theme.primaryText1};
  }

  ${({ faded }) =>
    faded &&
    css`
      background-color: ${({ theme }) => theme.primary5};
      border: none;
      // border: 1px solid ${({ theme }) => theme.primary5};
      color: ${({ theme }) => theme.primaryText1};

      :hover,
      :focus {
        border: none;
        // border: 1px solid ${({ theme }) => darken(0.05, theme.primary4)};
        color: ${({ theme }) => darken(0.05, theme.primaryText1)};
      }
    `}
`

const Web3StatusConnected = styled(Web3StatusGeneric)<{ pending?: boolean }>`
  background-color: ${({ pending, theme }) => (pending ? theme.primary1 : theme.bg1)};
  border: none;
  // border: 1px solid ${({ pending, theme }) => (pending ? theme.primary1 : theme.bg1)};
  color: ${({ pending, theme }) => (pending ? theme.white : theme.text1)};
  font-weight: 500;
  :hover,
  :focus {
    border: 1px solid ${({ theme }) => darken(0.05, theme.bg3)};

    :focus {
      border: 1px solid ${({ pending, theme }) => (pending ? darken(0.1, theme.primary1) : darken(0.1, theme.bg2))};
    }
  }
`

const Text = styled.p`
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0 0.5rem 0 0.25rem;
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
`

const NetworkIcon = styled(Activity)`
  margin-left: 0.25rem;
  margin-right: 0.5rem;
  width: 16px;
  height: 16px;
`

// we want the latest one to come first, so return negative if a is after b
function newTransactionsFirst(a: TransactionDetails, b: TransactionDetails) {
  return b.addedTime - a.addedTime
}

function Sock() {
  return (
    <span role="img" aria-label={t`has socks emoji`} style={{ marginTop: -4, marginBottom: -4 }}>
      🧦
    </span>
  )
}

function WrappedStatusIcon({ connector }: { connector: AbstractConnector | Connector }) {
  return <> </>
  return (
    <IconWrapper size={16}>
      <StatusIcon connector={connector} />
    </IconWrapper>
  )
}

function Web3StatusInner() {
  const { account, connector, error } = useWeb3React()

  const { ENSName } = useENSName(account ?? undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)

  const hasPendingTransactions = !!pending.length
  const hasSocks = useHasSocks()
  const toggleWalletModal = useWalletModalToggle()

  if (account) {
    return (
      <Web3StatusConnected id="web3-status-connected" onClick={toggleWalletModal} pending={hasPendingTransactions}>
        {hasPendingTransactions ? (
          <RowBetween>
            <Text>
              <Trans>{pending?.length} Pending</Trans>
            </Text>{' '}
            <Loader stroke="white" />
          </RowBetween>
        ) : (
          <>
            {hasSocks ? <Sock /> : null}
            <Text>{ENSName || shortenAddress(account)}</Text>
          </>
        )}
        {!hasPendingTransactions && connector && <WrappedStatusIcon connector={connector} />}
      </Web3StatusConnected>
    )
  } else if (error) {
    return (
      <Web3StatusError onClick={toggleWalletModal}>
        <NetworkIcon />
        <Text>{error instanceof UnsupportedChainIdError ? <Trans>Wrong Network</Trans> : <Trans>Error</Trans>}</Text>
      </Web3StatusError>
    )
  } else {
    return (
      <Web3StatusConnect id="connect-wallet" onClick={toggleWalletModal} faded={!account}>
        <Text>
          <Trans>Connect Wallet</Trans>
        </Text>
      </Web3StatusConnect>
    )
  }
}

async function CheckPendingTx(id: number) {
  const { chainId, account, connector } = useActiveWeb3React()
  const routerContract = useV2RouterContract()

  const pendingTx = await db.pendingTxs.where({ id }).first()

  console.log('raynear test check pending tx')

  setTimeout(() => {
    const getTxIdPolling = setInterval(async () => {
      const roundResponse = await fetch(
        `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${routerContract?.address}&round=${pendingTx?.round}`
      )
      if (roundResponse.ok) {
        roundResponse.json().then(async (json) => {
          if (json?.txHash) {
            clearInterval(getTxIdPolling)

            // if (!allTransactions[json.txHash]) {
            //   let input = approvalOptimizedTrade?.inputAmount?.numerator
            //   let output = approvalOptimizedTrade?.outputAmount?.numerator
            //   input = !input ? JSBI.BigInt(0) : input
            //   output = !output ? JSBI.BigInt(0) : output

            //   dispatch(
            //     addTransaction({
            //       hash: json.txHash,
            //       from: account,
            //       info: {
            //         type: TransactionType.SWAP,
            //         tradeType: TradeType.EXACT_OUTPUT,
            //         inputCurrencyId: approvalOptimizedTrade?.inputAmount?.currency?.wrapped.address,
            //         outputCurrencyId: approvalOptimizedTrade?.outputAmount?.currency?.wrapped.address,
            //         outputCurrencyAmountRaw: output.toString(),
            //         expectedInputCurrencyAmountRaw: input.toString(),
            //         maximumInputCurrencyAmountRaw: '0',
            //       },
            //       chainId,
            //     })
            //   )

            //   dispatch(
            //     addPopup({
            //       content: {
            //         txn: { hash: json.txHash },
            //       },
            //       key: `this-is-popup`,
            //       removeAfterMs: 10000,
            //     })
            //   )
            // }
          }
        })
      }
    }, 500)
    setTimeout(() => {
      clearInterval(getTxIdPolling)
    }, 30000)
  }, 10000)

  // await fetch('https://operator.360swap.io/txId?round=' + pendingTx?.round).then(async (txId) => {
  //   const res = await fetch('endpoint')

  //   if (res) {
  //     // TODO: input tx data to tx history
  //     // TODO: or make claim things
  //   }
  // })
}

async function GetNonce() {
  const { account, connector, error } = useWeb3React()
  const routerContract = useV2RouterContract()

  const nonce = await routerContract?.nonces(account)

  const localNonce = window.localStorage.getItem('nonce')

  if (!localNonce || nonce > localNonce) {
    window.localStorage.setItem('nonce', nonce)
  }
}

export default function Web3Status() {
  const { active, account } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  const { ENSName } = useENSName(account ?? undefined)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)
  const confirmed = sortedRecentTransactions.filter((tx) => tx.receipt).map((tx) => tx.hash)

  CheckPendingTx(1)

  GetNonce()

  return (
    <>
      <Web3StatusInner />
      {(contextNetwork.active || active) && (
        <WalletModal ENSName={ENSName ?? undefined} pendingTransactions={pending} confirmedTransactions={confirmed} />
      )}
    </>
  )
}
