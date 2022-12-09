import { useCallback, useContext, useEffect } from 'react'
import { CheckCircle, X, XCircle } from 'react-feather'
import { animated } from 'react-spring'
import { useSpring } from 'react-spring/web'
import styled, { ThemeContext } from 'styled-components/macro'
import { ThemedText } from 'theme'

import { useRemovePopup } from '../../state/application/hooks'
import { PopupContent } from '../../state/application/reducer'
import { ButtonError } from '../Button'
import FailedNetworkSwitchPopup from './FailedNetworkSwitchPopup'
import TransactionPopup from './TransactionPopup'

const ProceedButton = styled(ButtonError)`
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
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

  const faderStyle = useSpring({
    from: { width: '100%' },
    to: { width: '0%' },
    config: { duration: removeAfterMs ?? undefined },
  })

  const values = content as any

  const Status =
    values?.status === 'pending' ? (
      'p'
    ) : values?.status === 'success' ? (
      <CheckCircle size={'16px'} color={'#00ffa3'} />
    ) : values?.status === 'rejected' ? (
      <XCircle size={'16px'} color={'#ff6262'} />
    ) : (
      ''
    )

  const claimReimbursement = true

  return (
    <Popup>
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
      <a href="https://" style={{ textDecoration: 'none', color: '#8BB3FF', marginBottom: '8px' }}>
        View on explorer
      </a>
      <a href="https://" style={{ textDecoration: 'none', color: '#8BB3FF' }}>
        Go to Recent Transaction
      </a>
      {claimReimbursement && (
        <>
          <ProceedButton style={{ marginTop: '20px', marginBottom: '8px', height: '46px' }}>
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
      {removeAfterMs !== null ? <AnimatedFader style={faderStyle} /> : null}
    </Popup>
  )
}
