// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Connector } from '@web3-react/types'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { darken } from 'polished'
import { useMemo } from 'react'
import { Activity } from 'react-feather'
import { addPopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
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
import { db, Status } from '../../utils/db'
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

async function CheckPendingTx() {
  const { chainId, account, connector, library } = useActiveWeb3React()
  const routerContract = useV2RouterContract()

  const dispatch = useAppDispatch()

  // const txReceipt = await library?.getTransactionReceipt(
  //   '0xcfe81af9ed2fa6d889e4e8c45bd0f167b899ee6b0ff1de94a8a194537afd7a6e'
  // )
  // console.log(txReceipt)

  const keys = await db.pendingTxs.orderBy('id').keys()
  for (const key of keys) {
    const pendingTx = await db.pendingTxs.get(key)

    // 1. round에 해당하는 txId 받아오기
    const roundResponse = await fetch(
      `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${routerContract?.address}&round=${pendingTx?.round}`
    )

    if (roundResponse.ok) {
      roundResponse.json().then(async (json) => {
        if (json?.txHash) {
          // const txReceipt = await library?.getTransactionReceipt(json?.txHash)

          // 2. txId 실행되었는지 확인
          const txReceipt = await library?.getTransactionReceipt(
            '0xcfe81af9ed2fa6d889e4e8c45bd0f167b899ee6b0ff1de94a8a194537afd7a6e'
          )
          console.log(txReceipt)
          // 2.1. 내 tx가 알고 있는 순서대로 실행되었는지 확인(inner transaction 분석)
          // receipt event parsing
          const isSuccess = true

          if (isSuccess) {
            // 2.1.1 제대로 수행 되었다면 history에 넣음
            await db.txHistory.add({
              round: pendingTx?.round ? pendingTx?.round : 0,
              order: pendingTx?.order ? pendingTx?.order : 0,
              txId: json?.txHash,
              txDate: pendingTx?.sendDate ? pendingTx?.sendDate : 0,
              from: { token: '', amount: '' },
              to: { token: '', amount: '' },
              status: Status.COMPLETED,
            })
            await db.pendingTxs.delete(key)
          } else {
            // 2.1.2 문제가 있다면 claim 할 수 있도록 진행
            await db.txHistory.add({
              round: pendingTx?.round ? pendingTx?.round : 0,
              order: pendingTx?.order ? pendingTx?.order : 0,
              txId: json?.txHash,
              txDate: pendingTx?.sendDate ? pendingTx?.sendDate : 0,
              from: { token: '', amount: '' },
              to: { token: '', amount: '' },
              status: Status.REIMBURSE_AVAILABLE,
            })
            dispatch(
              addPopup({
                content: {
                  title: 'Transaction pending',
                  status: 'success',
                  data: { hash: '0x1111111111111111111111111111111111111111' },
                },
                key: `popup-test`,
                removeAfterMs: 1000000,
              })
            )
          }
        }
      })
    }
  }

  //   let input = approvalOptimizedTrade?.inputAmount?.numerator
  //   let output = approvalOptimizedTrade?.outputAmount?.numerator
  //   input = !input ? JSBI.BigInt(0) : input
  //   output = !output ? JSBI.BigInt(0) : output
}

async function GetNonce() {
  const { account } = useWeb3React()
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

  CheckPendingTx()

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
