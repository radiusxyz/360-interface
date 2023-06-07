import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Fraction } from '@uniswap/sdk-core'
import ERC20_ABI from 'abis/erc20.json'
import { RowBetween, RowCenter } from 'components/Row'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { ExternalLink as LinkIcon } from 'react-feather'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { ExternalLink } from 'theme'
import { getContract, shortenAddress, shortenTxId } from 'utils'

import { useV2RouterContract, useVaultContract } from '../../hooks/useContract'
import { db, Status, TxHistoryWithPendingTx } from '../../utils/db'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonPrimary } from '../Button'
import { AutoColumn } from '../Column'
import Modal from '../Modal'

const Wrapper = styled.div`
  width: 100%;
  background: rgba(44, 47, 63);
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const GradientSpinner = styled.div<{ background: string }>`
  @keyframes rotates {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-360deg);
    }
  }

  animation: rotates 2s linear reverse infinite;
  border-radius: 50%;
  height: 90px;
  width: 90px;
  position: relative;

  ::before,
  ::after {
    content: '';
    position: absolute;
  }

  ::before {
    background: linear-gradient(0deg, #272b3e00 0%, #272b3ea0 100%) 0% 0%,
      linear-gradient(90deg, #272b3ea0 0%, #01f76eff 100%) 100% 0%,
      linear-gradient(180deg, #01f76eff 0%, #0157ffff 100%) 100% 100%,
      linear-gradient(360deg, #0157ffff 0%, #0157ffff 100%) 0% 100%;
    background-repeat: no-repeat;
    background-size: 50% 50%;
    border-radius: 50%;
    top: 0px;
    bottom: 0px;
    left: 0px;
    right: 0px;
  }

  ::after {
    background: ${({ background }) => background};
    border-radius: 50%;
    top: 6%;
    bottom: 6%;
    left: 6%;
    right: 6%;
  }
`

export function ReimbursementModal({
  isOpen,
  onDismiss,
  historyId,
}: {
  isOpen: boolean
  onDismiss: any
  historyId: number
}) {
  const [tx, setTx] = useState<TxHistoryWithPendingTx | null>(null)

  const getTx = async () => {
    if (historyId > 0) {
      setTx(await db.getTxHistoryWithPendingTxById(historyId))
    }
  }

  useEffect(() => {
    getTx()
  }, [historyId])

  if (tx?.status === Status.REIMBURSE_AVAILABLE) {
    return <ClaimReimbursement isOpen={isOpen} onDismiss={onDismiss} tx={tx} />
  } else if (tx?.status === Status.REIMBURSED) {
    return <ReimbursementDetails isOpen={isOpen} onDismiss={onDismiss} tx={tx} />
  } else {
    return <></>
  }
}

export function ClaimReimbursement({
  isOpen,
  onDismiss,
  tx,
}: {
  isOpen: boolean
  onDismiss: any
  tx: TxHistoryWithPendingTx
}) {
  const { chainId, library } = useActiveWeb3React()
  const routerContract = useV2RouterContract()
  const vaultContract = useVaultContract()
  const [reimbursementAmount, setReimbursementAmount] = useState('0')
  const [reimbursementToken, setReimbursementToken] = useState('USDC')

  const loadAmount = async () => {
    if (library) {
      const amount = await routerContract?.reimbursementAmount()
      const tokenAddress = await vaultContract?.tokenAddress
      //console.log(amount, tokenAddress)
      if (tokenAddress) {
        const token = getContract(tokenAddress, ERC20_ABI, library)
        const decimal = await token.decimals()
        const reward = BigNumber.from(amount).div(BigNumber.from('1' + '0'.repeat(decimal as number)))
        //console.log(amount, decimal, reward)
        setReimbursementAmount(reward.toString())
        const symbol = await token.symbol()
        setReimbursementToken(symbol)
      }
    }
  }

  useEffect(() => {
    if (routerContract && vaultContract && library) {
      loadAmount()
    }
  }, [routerContract, vaultContract, library])

  const claim = async () => {
    if (tx) {
      const result = await routerContract?.claim(
        tx.round,
        tx.order,
        tx.proofHash,
        tx.tx,
        tx.operatorSignature?.v,
        tx.operatorSignature?.r,
        tx.operatorSignature?.s,
        { gasLimit: 1_000_000 }
      )
      //console.log('🚀 ~ file: ReimburseModal.tsx:93 ~ claim ~ result', result)

      // TODO: reimbursement amount update logic need
      // TODO: txId polling에 넣어두면 좋을듯. 직접 보내는 tx니까.
      // TODO: popup도 있으면 좋을 듯

      await db.txHistory.update(tx.id as number, { status: Status.REIMBURSED, reimbursementTxId: result.hash })
    }
    onDismiss()
  }

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={600}>
      <Wrapper style={{ padding: '60px 30px 35px 30px' }}>
        {tx && (
          <Section
            style={{
              position: 'relative',
            }}
          >
            <ThemedText.Black fontSize={32} fontWeight={600}>
              Claim reimbursement for this transaction?
            </ThemedText.Black>

            <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'} style={{ marginTop: '20px' }}>
              We will cover a fixed reimbursement for any completed transaction we identify as invalid behavior from an
              operator. You may claim this reimbursement at any time. If you would like to receive the reimbursement
              now, click <span style={{ fontWeight: 'bold', color: 'white' }}>Confirm Reimbursement.</span>{' '}
              <ExternalLink href="">Learn more</ExternalLink>
            </ThemedText.Black>
            <RowCenter
              style={{
                background: 'rgba(37,39,53)',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '30px',
                marginBottom: '20px',
                padding: '30px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ justifyContent: 'space-between', display: 'flex', flexDirection: 'row', width: '90%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
                  <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
                    {'From'}
                  </ThemedText.Black>
                  <ThemedText.Black fontSize={14} fontWeight={600} color={'#ffffFF'}>
                    {JSBIDivide(JSBI.BigInt(tx.from.amount), JSBI.BigInt(tx.from.decimal), 6) + ' ' + tx.from.token}
                  </ThemedText.Black>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
                  <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
                    {'To'}
                  </ThemedText.Black>
                  <ThemedText.Black fontSize={14} fontWeight={600} color={'#ffffFF'}>
                    {JSBIDivide(JSBI.BigInt(tx.to.amount), JSBI.BigInt(tx.to.decimal), 6) + ' ' + tx.to.token}
                  </ThemedText.Black>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
                  <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
                    {'Total Reimbursement'}
                  </ThemedText.Black>
                  <ThemedText.Black fontSize={14} fontWeight={600} color={'#ffffFF'}>
                    {reimbursementAmount + ' ' + reimbursementToken}
                  </ThemedText.Black>
                </div>
              </div>
            </RowCenter>
            <RowBetween style={{ marginBottom: '10px' }}>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                Swap Date
              </ThemedText.Black>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                {new Date(tx.sendDate * 1000).toLocaleDateString()}
              </ThemedText.Black>
            </RowBetween>
            <RowBetween style={{ marginBottom: '10px' }}>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                Transaction Hash
              </ThemedText.Black>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                {shortenTxId(tx.txId)}
                <ExternalLink href={getExplorerLink(chainId ?? 137, tx.txId, ExplorerDataType.TRANSACTION)}>
                  <LinkIcon size="12px" />
                </ExternalLink>
              </ThemedText.Black>
            </RowBetween>
            <RowBetween style={{ marginBottom: '10px' }}>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                Reimburse To
              </ThemedText.Black>
              <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
                {shortenAddress(tx.tx.txOwner)}
              </ThemedText.Black>
            </RowBetween>
            <RowBetween style={{ marginTop: '40px' }}>
              <ButtonPrimary
                style={{
                  background: 'transparent',
                  height: '46px',
                  borderRadius: '4px',
                  width: '48%',
                  border: '1px solid',
                  borderColor: 'white',
                }}
                onClick={onDismiss}
              >
                Go back
              </ButtonPrimary>
              <ButtonPrimary
                style={{
                  background: 'transparent',
                  height: '46px',
                  borderRadius: '4px',
                  width: '48%',
                  border: '1px solid',
                  borderColor: 'white',
                }}
                onClick={() => claim()}
              >
                Confirm
              </ButtonPrimary>
            </RowBetween>
          </Section>
        )}
      </Wrapper>
    </Modal>
  )
}

export function ReimbursementDetails({ isOpen, onDismiss, tx }: { isOpen: boolean; onDismiss: () => void; tx: any }) {
  const { chainId, library } = useActiveWeb3React()
  const routerContract = useV2RouterContract() as Contract
  const vaultContract = useVaultContract() as Contract
  const [reimbursementAmount, setReimbursementAmount] = useState('0')
  const [reimbursementToken, setReimbursementToken] = useState('USDC')

  const loadAmount = async () => {
    // TODO: decimal 찾아다가 적용해줘야 함
    if (library) {
      const amount = await routerContract?.reimbursementAmount()
      const tokenAddress = await vaultContract?.tokenAddress
      //console.log(amount, tokenAddress)
      if (tokenAddress) {
        const token = getContract(tokenAddress, ERC20_ABI, library)
        const decimal = await token.decimals()
        const reward = BigNumber.from(amount).div(BigNumber.from('1' + '0'.repeat(decimal as number)))
        //console.log(amount, decimal, reward)
        setReimbursementAmount(reward.toString())
        const symbol = await token.symbol()
        setReimbursementToken(symbol)
      }
    }
  }

  useEffect(() => {
    if (routerContract && vaultContract && library) {
      loadAmount()
    }
  }, [routerContract, vaultContract, library])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={600}>
      <Wrapper style={{ padding: '60px 30px 35px 30px' }}>
        {tx && (
          <Section
            style={{
              position: 'relative',
            }}
          >
            <RowCenter>
              <ThemedText.Black fontSize={24} fontWeight={600}>
                Reimbursement Details
              </ThemedText.Black>
            </RowCenter>

            <div style={{ margin: '50px 0px' }}>
              <div style={{ padding: '8px 0px' }}>
                <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
                  Date
                </ThemedText.Black>
                <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
                  {new Date(tx.sendDate * 1000).toLocaleDateString()}
                </ThemedText.Black>
              </div>
              <div style={{ padding: '8px 0px' }}>
                <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
                  Amount
                </ThemedText.Black>
                <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
                  {reimbursementAmount + ' ' + reimbursementToken}
                </ThemedText.Black>
              </div>
              <div style={{ padding: '8px 0px' }}>
                <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
                  Reimburse To
                </ThemedText.Black>
                <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
                  {tx.tx.txOwner}
                </ThemedText.Black>
              </div>
              <div style={{ padding: '8px 0px' }}>
                <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
                  Transaction Hash
                </ThemedText.Black>
                <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
                  {shortenTxId(tx.reimbursementTxId)}
                  <ExternalLink
                    href={getExplorerLink(chainId ?? 137, tx.reimbursementTxId, ExplorerDataType.TRANSACTION)}
                  >
                    <LinkIcon size="12px" />
                  </ExternalLink>
                </ThemedText.Black>
              </div>
            </div>
            <RowCenter>
              <ButtonPrimary
                style={{
                  background: '#1B1E2D',
                  height: '46px',
                  borderRadius: '23px',
                  width: '90%',
                }}
                onClick={onDismiss}
              >
                Close
              </ButtonPrimary>
            </RowCenter>
          </Section>
        )}
      </Wrapper>
    </Modal>
  )
}

export function JSBIDivide(numerator: JSBI, denominator: JSBI, precision: number) {
  return new Fraction(numerator, denominator).toSignificant(precision).toString()
}
