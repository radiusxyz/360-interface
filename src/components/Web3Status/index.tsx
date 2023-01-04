// eslint-disable-next-line no-restricted-imports
import { Trans } from '@lingui/macro'
import { Connector } from '@web3-react/types'
import { solidityKeccak256 } from 'ethers/lib/utils'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { darken } from 'polished'
import { useMemo, useState } from 'react'
import { Activity } from 'react-feather'
import { addPopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import styled, { css } from 'styled-components/macro'
import { AbstractConnector } from 'web3-react-abstract-connector'
import { UnsupportedChainIdError, useWeb3React } from 'web3-react-core'

import { NetworkContextName } from '../../constants/misc'
import { useRecorderContract, useV2RouterContract } from '../../hooks/useContract'
import useENSName from '../../hooks/useENSName'
import { useHasSocks } from '../../hooks/useSocksBalance'
import { useWalletModalToggle } from '../../state/application/hooks'
import { isTransactionRecent, useAllTransactions } from '../../state/transactions/hooks'
import { TransactionDetails } from '../../state/transactions/types'
import { shortenAddress } from '../../utils'
import { db, Status, TokenAmount } from '../../utils/db'
import { ButtonSecondary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import Loader from '../Loader'
import { RowBetween } from '../Row'
import WalletModal from '../WalletModal'

const EventLogHashTransfer = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const EventLogHashSwap = '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'
const EventLogHashRevert = ''

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
    <span role="img" aria-label={`has socks emoji`} style={{ marginTop: -4, marginBottom: -4 }}>
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
  const { chainId, account, library } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  const routerContract = useV2RouterContract()
  const recorderContract = useRecorderContract()

  const [lastCall, setLastCall] = useState(0)

  if (Date.now() < lastCall + 2000) {
    return
  }

  setLastCall(Date.now())

  const pendingTx = await db.pendingTxs.get({ progressHere: 1 }).catch((e) => console.log(e))
  console.log(pendingTx)

  // TODO: order=-1 인 것을 확인해서 round를 찾고 다른 데이터를 찾아서 db에 넣는다.
  // 내 txId를 찾을 때 까지 반복
  // 이 경우에는 cancel 할 수 있는 버튼이 활성화 되어 있어야 한다.

  // 1. round에 해당하는 txId 받아오기
  if (pendingTx && pendingTx.progressHere) {
    const readyTx = await db.readyTxs.get(pendingTx.readyTxId)

    await fetch(
      `${process.env.REACT_APP_360_OPERATOR}/tx?chainId=${chainId}&routerAddress=${routerContract?.address}&round=${pendingTx.round}`
    )
      .then((roundResponse) => {
        if (roundResponse.ok) {
          roundResponse.json().then(async (json) => {
            if (json?.txHash) {
              // 2. txId 실행되었는지 확인
              const txReceipt = await library?.getTransactionReceipt(json?.txHash)

              // TODO: rejected Tx 구분하기
              if (txReceipt) {
                console.log(txReceipt)
                const Logs = txReceipt?.logs as Array<{ topics: Array<any> }>

                // 2.1. 내 tx가 알고 있는 순서대로 실행되었는지 확인(inner transaction 분석)
                let rightOrder = false
                let count = 0
                let from: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                let to: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                for (const log of Logs) {
                  if (log.topics[0] === EventLogHashTransfer) {
                    if (log.topics[1] === account) {
                      // TODO: From? To?
                      // TODO: actual trade amount
                      from = { token: '', amount: '', decimal: '1000000000000000000' }
                    }
                    if (log.topics[2] === account) {
                      // TODO: From? To?
                      // TODO: actual trade amount
                      to = { token: '', amount: '', decimal: '1000000000000000000' }
                    }
                  }
                  if (log.topics[0] === EventLogHashSwap || log.topics[0] === EventLogHashRevert) {
                    count++
                    if (count === pendingTx.order && log.topics[2] === readyTx?.tx.txOwner) {
                      rightOrder = true
                    }
                  }
                }

                // 2.2 HashChain 검증
                const txHashes = await recorderContract?.roundTxHashes(pendingTx.round)

                let hashChain = txHashes[0]
                for (let i = 1; i < pendingTx.order; i++) {
                  hashChain = solidityKeccak256(['bytes32', 'bytes32'], [hashChain, txHashes[i]])
                }

                if (rightOrder && hashChain === pendingTx.proofHash) {
                  // 2.1.1 제대로 수행 되었다면 history에 넣음
                  await db.txHistory.add({
                    pendingTxId: pendingTx.id as number,
                    txId: json?.txHash,
                    txDate: 0, // TODO: tx receipt timestamp
                    from,
                    to,
                    status: Status.COMPLETED,
                  })
                  await db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                } else {
                  // 2.1.2 문제가 있다면 claim 할 수 있도록 진행
                  await db.txHistory.add({
                    pendingTxId: pendingTx.id as number,
                    txId: json?.txHash,
                    txDate: 0, // TODO: tx receipt timestamp
                    from,
                    to,
                    status: Status.REIMBURSE_AVAILABLE,
                  })
                  await db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                  // TODO: Fix me
                  dispatch(
                    addPopup({
                      content: {
                        title: 'Reimbursement available',
                        status: 'success',
                        data: { hash: '0x1111111111111111111111111111111111111111' },
                      },
                      key: `popup-test`,
                      removeAfterMs: 1000000,
                    })
                  )
                }
              } else {
                // TODO: add pending tx to history
                // no receipt => pending
                const from: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }
                const to: TokenAmount = { token: '', amount: '', decimal: '1000000000000000000' }

                await db.txHistory.add({
                  pendingTxId: pendingTx.id as number,
                  txId: json?.txHash,
                  txDate: 0, // TODO: tx receipt timestamp
                  from,
                  to,
                  status: Status.REIMBURSE_AVAILABLE,
                })
                await db.pendingTxs.update(pendingTx.id as number, { progressHere: 0 })
                // TODO: Fix me
                dispatch(
                  addPopup({
                    content: {
                      title: 'Pending',
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
      })
      .catch((e) => console.error(e))
  }
}

async function GetNonce() {
  const { account } = useWeb3React()
  const routerContract = useV2RouterContract()
  const [lastCall, setLastCall] = useState(0)

  if (Date.now() < lastCall + 2000) {
    return
  }

  setLastCall(Date.now())

  if (account) {
    const nonce = await routerContract?.nonces(account)

    const localNonce = window.localStorage.getItem(account + ':nonce')

    if (!localNonce || nonce > localNonce) {
      window.localStorage.setItem(account + ':nonce', nonce)
    }
  }
}

export default function Web3Status() {
  const { active, account } = useWeb3React()
  const contextNetwork = useWeb3React(NetworkContextName)

  // console.log('account', account)

  const { ENSName } = useENSName(account ?? undefined)

  // console.log('ENSName', ENSName)

  const allTransactions = useAllTransactions()

  const sortedRecentTransactions = useMemo(() => {
    const txs = Object.values(allTransactions)
    return txs.filter(isTransactionRecent).sort(newTransactionsFirst)
  }, [allTransactions])

  CheckPendingTx()
  GetNonce()

  const pending = sortedRecentTransactions.filter((tx) => !tx.receipt).map((tx) => tx.hash)
  const confirmed = sortedRecentTransactions.filter((tx) => tx.receipt).map((tx) => tx.hash)

  return (
    <>
      <Web3StatusInner />
      {(contextNetwork.active || active) && (
        <WalletModal ENSName={ENSName ?? undefined} pendingTransactions={pending} confirmedTransactions={confirmed} />
      )}
    </>
  )
}
