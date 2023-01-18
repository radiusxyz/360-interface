import pendingImage from 'assets/images/gif_pending.gif'
import { useCallback, useContext, useEffect } from 'react'
import { CheckCircle, X, XCircle } from 'react-feather'
import { animated } from 'react-spring'
import { useCancelManager, useReimbursementManager, useShowHistoryManager } from 'state/modal/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { ThemedText } from 'theme'

import useActiveWeb3React from '../../hooks/useActiveWeb3React'
import { useRemovePopup } from '../../state/application/hooks'
import { PopupContent } from '../../state/application/reducer'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonError } from '../Button'
import FailedNetworkSwitchPopup from './FailedNetworkSwitchPopup'
import TransactionPopup from './TransactionPopup'

const ProceedButton = styled(ButtonError)`
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
  font-size: 14px;
  font-weight: 500;
`

const RecentTxButton = styled(ButtonError)`
  background: #1f2232;
  width: 300px;
  height: 50px;
  border-radius: 0px;
  padding: 10px 40px 10px 40px;
  color: #8bb3ff;
  font-size: 14px;
  border: none;
  :hover {
    background: #0085ff;
    color: #ffffff;
  }
`

const Popup = styled.div`
  /*background-color: ${({ theme }) => theme.bg0};*/
  position: relative;
  background: rgba(44, 47, 63);
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 18px;
  border-radius: 4px;
  overflow: hidden;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    min-width: 290px;
    &:not(:last-of-type) {
      margin-right: 20px;
    }
  `}
`
const Fader = styled.div`
  position: absolute;
  bottom: 0px;
  left: 0px;
  width: 100%;
  height: 2px;
  background-color: ${({ theme }) => theme.bg3};
`

const AnimatedFader = animated(Fader)

export default function PopupItem({
  removeAfterMs,
  content,
  popKey,
}: {
  removeAfterMs: number | null
  content: PopupContent
  popKey: string
}) {
  const removePopup = useRemovePopup()
  const removeThisPopup = useCallback(() => removePopup(popKey), [popKey, removePopup])

  const { chainId } = useActiveWeb3React()

  const [showHistory, setShowHistory] = useShowHistoryManager()
  const [showCancel, setShowCancel] = useCancelManager()
  const [reimbursement, setReimbursement] = useReimbursementManager()

  useEffect(() => {
    if (removeAfterMs === null) return undefined

    const timeout = setTimeout(() => {
      removeThisPopup()
    }, removeAfterMs)

    return () => {
      clearTimeout(timeout)
    }
  }, [removeAfterMs, removeThisPopup])

  const theme = useContext(ThemeContext)

  let popupContent
  if ('txn' in content) {
    const {
      txn: { hash },
    } = content
    popupContent = <TransactionPopup hash={hash} />
  } else if ('failedSwitchNetwork' in content) {
    popupContent = <FailedNetworkSwitchPopup chainId={content.failedSwitchNetwork} />
  } else if ('message' in content) {
    const { message } = content
    popupContent = message
  }

  // const faderStyle = useSpring({
  //   from: { width: '100%' },
  //   to: { width: '0%' },
  //   config: { duration: removeAfterMs ?? undefined },
  // })

  const values = content as any

  const Status =
    values?.status === 'pending' ? (
      <img src={pendingImage} width="16px" height="16px" alt="" />
    ) : values?.status === 'success' ? (
      <CheckCircle size={'16px'} color={'#00ffa3'} />
    ) : values?.status === 'rejected' ? (
      <XCircle size={'16px'} color={'#ff6262'} />
    ) : (
      ''
    )

  // TODO: match content to reimbursement
  // const claimReimbursement = Object.keys(values).includes('reimbursement') ? values.claimReimbursement : false

  console.log(values)

  return (
    <Popup>
      {'txn' in content ? (
        popupContent
      ) : values?.status === 'pending' ? (
        <>
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 0,
              right: 18,
              bottom: 0,
              display: 'flex',
              justifyContent: 'right',
              alignItems: 'right',
              textAlign: 'right',
            }}
          >
            <X color={theme.text2} onClick={removeThisPopup} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <img src={pendingImage} width="66px" height="66px" alt="" />
            <span style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '10px', marginBottom: '17px' }}>
              {values?.title}
            </span>
            <RecentTxButton
              style={{ marginBottom: '6px' }}
              onClick={() => {
                setShowHistory(true)
              }}
            >
              Go to Recent Transactions
            </RecentTxButton>
            {values?.title !== 'Validating cancel success' && (
              <button
                style={{
                  color: '#4B5466',
                  fontSize: '10px',
                  border: 'none',
                  background: 'transparent',
                }}
                onClick={() => {
                  console.log('values', values)
                  setShowCancel(values.data.readyTxId)
                }}
              >
                Cancel Transaction
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              top: 18,
              left: 0,
              right: 18,
              bottom: 0,
              display: 'flex',
              justifyContent: 'right',
              alignItems: 'right',
              textAlign: 'right',
            }}
          >
            <X color={theme.text2} onClick={removeThisPopup} />
          </div>
          <div style={{ marginBottom: '31px' }}>
            <ThemedText.White fontSize={'18px'} fontWeight={'600'}>
              {values?.title} {Status}
            </ThemedText.White>
          </div>
          <a
            href={getExplorerLink(chainId as number, values?.data.hash, ExplorerDataType.TRANSACTION)}
            style={{ textDecoration: 'none', color: '#8BB3FF', marginBottom: '8px' }}
          >
            View on explorer
          </a>
          <button
            onClick={() => {
              setShowHistory(true)
            }}
            style={{
              textDecoration: 'none',
              color: '#8BB3FF',
              fontSize: '16px',
              border: 'none',
              background: 'transparent',
              textAlign: 'left',
              padding: '0px',
              margin: '0px',
            }}
          >
            Go to Recent Transaction
          </button>
        </>
      )}
      {values.status === 'reimbursement' && (
        <>
          <ProceedButton
            onClick={() => {
              setReimbursement(values?.data.txHistoryId)
            }}
            style={{ marginTop: '20px', marginBottom: '8px', height: '46px' }}
          >
            Claim Reimbursement
          </ProceedButton>
          <div style={{ display: 'flex', flexDirection: 'row' }}>
            <ThemedText.Body fontSize={'12px'} color={'#999999'}>
              Reimbursement found!
            </ThemedText.Body>
            <a
              href="https://"
              style={{ fontStyle: 'italic', textDecoration: 'none', color: '#999999', fontSize: '12px' }}
            >
              {"  What's this?"}
            </a>
          </div>
        </>
      )}
      {/*popupContent*/}
      {/*removeAfterMs !== null ? <AnimatedFader style={faderStyle} /> : null*/}
    </Popup>
  )
}
