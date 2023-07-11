import { useState, useEffect } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { PrimaryButton } from '../UI/Buttons'
import {
  Backdrop,
  BlueSpan,
  CloseButton,
  CloseButtonWrapper,
  DarkBold,
  Description,
  Details,
  Header,
  Item,
  Modal,
  Positioner,
  Property,
  PropertyTop,
  Value,
  ValueBottom,
  ValueTop,
} from './ReimbursementModalStyles'
import { Note } from './StraightProgressStyles'
import ProcessingPopup from './ProcessingPopup'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useV2RouterContract, useVaultContract } from 'hooks/useContract'
import ERC20_ABI from 'abis/erc20.json'
import { getContract, shortenAddress, shortenTxId } from 'utils'
import { db, Status } from 'utils/db'
import moment from 'moment'
import { token2str } from 'utils'

type Props = {
  handleModal: () => void
  tx: any
}

const ReimbursementModal = ({ handleModal, tx }: Props) => {
  console.log('reimbursementModal', tx)
  const { chainId, library } = useActiveWeb3React()
  const routerContract = useV2RouterContract()
  const vaultContract = useVaultContract()
  const [reimbursementAmount, setReimbursementAmount] = useState('0')
  const [reimbursementToken, setReimbursementToken] = useState('USDC')

  const [showProcessingPopup, setShowProcessingPopup] = useState(false)
  const handleProcessingPopup = async () => {
    await claim()
    setShowProcessingPopup((showProcessingPopup) => !showProcessingPopup)
  }

  const loadAmount = async () => {
    if (library) {
      const amount = await routerContract?.reimbursementAmount()
      const tokenAddress = await vaultContract?.tokenAddress
      console.log(amount, tokenAddress)
      if (tokenAddress) {
        const token = getContract(tokenAddress, ERC20_ABI, library)
        const decimal = await token.decimals()
        const reward = BigNumber.from(amount).div(BigNumber.from('1' + '0'.repeat(decimal as number)))
        console.log(amount, decimal, reward)
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
      console.log('🚀 ~ file: ReimburseModal.tsx:93 ~ claim ~ result', result)

      // TODO: reimbursement amount update logic need
      // TODO: txId polling에 넣어두면 좋을듯. 직접 보내는 tx니까.
      // TODO: popup도 있으면 좋을 듯

      await db.swap.update(tx.id as number, { status: Status.REIMBURSED, reimbursementTxId: result.hash })
    }
  }

  return (
    <Positioner>
      <Backdrop onClick={handleModal} />
      {showProcessingPopup ? (
        <ProcessingPopup handleProcessingPopup={handleProcessingPopup} handleModal={handleModal} />
      ) : (
        <Modal>
          <CloseButtonWrapper>
            <CloseButton onClick={handleModal} />
          </CloseButtonWrapper>
          <Header>Claim reimbursement for this transaction?</Header>
          <Description>
            We will cover a fixed reimbursement for any completed transaction
            <br /> we identify as invalid behavior from an operator.
            <br /> You may claim this reimbursement at any time.
          </Description>
          <Details>
            <Item>
              <PropertyTop>{moment(new Date(tx.sendDate * 1000)).format('DD MMMM YYYY - h:mm A')}</PropertyTop>
              <ValueTop>{shortenTxId(tx.txId)}</ValueTop>
            </Item>
            <Item>
              <Property>From</Property>
              <Value>{token2str(tx.from)}</Value>
            </Item>
            <Item>
              <Property>To</Property>
              <Value>{token2str(tx.to)}</Value>
            </Item>
            <Item>
              <Property>Total Reimburse</Property>
              <Value>{1} USDC</Value>
            </Item>
            <Item>
              <Property>Reimburse To</Property>
              <ValueBottom>{shortenAddress(tx.tx.txOwner)}</ValueBottom>
            </Item>
          </Details>
          <PrimaryButton onClick={handleProcessingPopup}>Confirm</PrimaryButton>
          <Note>
            If you would like to receive the reimbursement now, <br />
            click <DarkBold>Confirm Reimbursement</DarkBold>.<BlueSpan>Learn more</BlueSpan>
          </Note>
        </Modal>
      )}
    </Positioner>
  )
}

export default ReimbursementModal
