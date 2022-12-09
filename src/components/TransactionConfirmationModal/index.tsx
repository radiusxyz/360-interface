import { Trans } from '@lingui/macro'
import { Currency } from '@uniswap/sdk-core'
import Badge from 'components/Badge'
import { CHAIN_INFO } from 'constants/chainInfo'
import { L2_CHAIN_IDS, SupportedL2ChainId } from 'constants/chains'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useAddTokenToMetamask from 'hooks/useAddTokenToMetamask'
import { RadiusSwapResponse } from 'lib/hooks/swap/useSendSwapTransaction'
import useInterval from 'lib/hooks/useInterval'
import { ReactNode, useContext, useState } from 'react'
import { AlertCircle, AlertTriangle, ArrowRight, CheckCircle, ExternalLink as LinkIcon } from 'react-feather'
import { Text } from 'rebass'
import { useProgressManager } from 'state/parameters/hooks'
import { useIsTransactionConfirmed, useTransaction } from 'state/transactions/hooks'
import styled, { ThemeContext } from 'styled-components/macro'
import { ThemedText } from 'theme'

import Circle from '../../assets/images/blue-loader.svg'
import MetaMaskLogo from '../../assets/images/metamask.png'
import { ExternalLink } from '../../theme'
import { CloseIcon, CustomLightSpinner } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { TransactionSummary } from '../AccountDetails/TransactionSummary'
import { ButtonError, ButtonLight, ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowCenter, RowFixed } from '../Row'
import AnimatedConfirmation from './AnimatedConfirmation'

const Wrapper = styled.div`
  width: 100%;
  background: rgba(44, 47, 63);
  padding: 35px;
`
const Section = styled(AutoColumn)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '0' : '0')};
`

const BottomSection = styled(Section)`
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
`

const ConfirmedIcon = styled(ColumnCenter)<{ inline?: boolean }>`
  padding: ${({ inline }) => (inline ? '20px 0' : '32px 0;')};
`

const StyledLogo = styled.img`
  height: 16px;
  width: 16px;
  margin-left: 6px;
`

const ProceedButton = styled(ButtonError)`
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
`

const GradientSpinner = styled.div<{ background: string }>`
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  animation: rotate 1s linear reverse infinite;
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
    border-radius: 50%;
    background: linear-gradient(0deg, #272b3e00 0%, #272b3ea0 100%) 0% 0%,
      linear-gradient(90deg, #272b3ea0 0%, #01f76eff 100%) 100% 0%,
      linear-gradient(180deg, #01f76eff 0%, #0157ffff 100%) 100% 100%,
      linear-gradient(360deg, #0157ffff 0%, #0157ffff 100%) 0% 100%;
    background-repeat: no-repeat;
    background-size: 50% 50%;
    top: -1px;
    bottom: -1px;
    left: -1px;
    right: -1px;
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

function ConfirmationPendingContent({
  onDismiss,
  pendingText,
  inline,
}: {
  onDismiss: () => void
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const [progressBarValue, setProgressBarValue] = useState<number>(0)

  useInterval(() => {
    if (progressBarValue < 100) {
      setProgressBarValue(progressBarValue + 1)
    }
  }, 100)

  return (
    <Wrapper>
      <AutoColumn gap="md">
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            <Trans>Waiting For Confirmation</Trans>
          </Text>
          <Text fontWeight={400} fontSize={16} textAlign="center">
            {pendingText}
          </Text>
          <div style={{ marginBottom: 12 }} />
        </AutoColumn>
      </AutoColumn>
    </Wrapper>
  )
}

function TransactionSubmittedContent({
  onDismiss,
  chainId,
  hash,
  currencyToAdd,
  inline,
  swapResponse,
}: {
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  inline?: boolean // not in modal
  swapResponse?: RadiusSwapResponse | undefined
}) {
  const theme = useContext(ThemeContext)

  const { library } = useActiveWeb3React()

  const { addToken, success } = useAddTokenToMetamask(currencyToAdd)

  const [progressBarValue, setProgressBarValue] = useState<number>(0)

  const showConfirmMessage = progressBarValue >= 6000 && swapResponse

  const txHash = 'test'

  useInterval(() => {
    if (progressBarValue < 100) {
      setProgressBarValue(progressBarValue + 1)
    }
  }, 80)

  const [progress, setProgress] = useProgressManager()

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween>
            <div />
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <div style={{ margin: 20 }}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            <Trans>Preparing for swap</Trans>
          </Text>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            <Trans>
              {progress === 1
                ? '1/4 making vdf proof'
                : progress === 2
                ? '2/4 encrypting'
                : progress === 3
                ? '3/4 sending eip712 tx to operator'
                : progress === 4
                ? '4/4 done'
                : 'default'}
            </Trans>
          </Text>
        </div>
        <RowBetween>
          <RowFixed>
            <ThemedText.Black fontSize={14} fontWeight={400} color={'#565A69'}>
              {'Encryption Progress'}
            </ThemedText.Black>
            <QuestionHelper text="Your VDF is currently being generated. Once the VDF is generated, your transaction would be submitted. Please wait for the progress bar to reach the end." />
          </RowFixed>
          <RowFixed>
            {progressBarValue < 100 ? (
              <ThemedText.Blue fontSize={14}>{'In Progress'}</ThemedText.Blue>
            ) : (
              <ThemedText.Blue fontSize={14}>{'Complete'}</ThemedText.Blue>
            )}
          </RowFixed>
        </RowBetween>
        <div style={{ padding: 5 }} />
        {/* <ProgressBar
            completed={progressBarValue}
            labelSize={'12px'}
            transitionDuration={'0.2s'}
            transitionTimingFunction={'ease-in-out'}
            labelAlignment={'outside'}
            labelColor={'#ef9231'}
            bgColor={'#ef9231'}
          /> */}
        <ConfirmedIcon inline={inline}>
          <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
        </ConfirmedIcon>
        <div style={{ marginBottom: 30 }} />

        {showConfirmMessage && (
          <>
            <AutoColumn gap="12px" justify={'center'}>
              <Text fontWeight={500} fontSize={20} textAlign="center">
                <Trans>2. Transaction Submitted</Trans>
              </Text>
              <Text fontWeight={500} fontSize={14}>
                <Trans>
                  Round: {swapResponse.data.txOrderMsg.round}, Order: {swapResponse.data.txOrderMsg.order}
                </Trans>
              </Text>
              <Text fontWeight={500} fontSize={14}>
                <Trans>
                  Transaction Hash: {txHash?.substring(0, 4)}...{txHash?.substring(txHash.length - 4, txHash.length)}
                </Trans>
              </Text>
              <Text fontWeight={400} fontSize={14} color={'#565A69'}>
                <Trans>Your transaction would be executed on fixed order.</Trans>
              </Text>
              {chainId && txHash && (
                <ExternalLink href={getExplorerLink(chainId, txHash, ExplorerDataType.TRANSACTION)}>
                  <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                    <Trans>View on Explorer</Trans>
                  </Text>
                </ExternalLink>
              )}
              {currencyToAdd && library?.provider?.isMetaMask && (
                <ButtonLight mt="12px" padding="6px 12px" width="fit-content" onClick={addToken}>
                  {!success ? (
                    <RowFixed>
                      <Trans>
                        Add {currencyToAdd.symbol} to Metamask <StyledLogo src={MetaMaskLogo} />
                      </Trans>
                    </RowFixed>
                  ) : (
                    <RowFixed>
                      <Trans>Added {currencyToAdd.symbol} </Trans>
                      <CheckCircle size={'16px'} stroke={theme.green1} style={{ marginLeft: '6px' }} />
                    </RowFixed>
                  )}
                </ButtonLight>
              )}
              <ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
                <Text fontWeight={500} fontSize={20}>
                  {inline ? <Trans>Return</Trans> : <Trans>Close</Trans>}
                </Text>
              </ButtonPrimary>
            </AutoColumn>
          </>
        )}
      </Section>
    </Wrapper>
  )
}

export function ConfirmationModalContent({
  title,
  bottomContent,
  onDismiss,
  topContent,
}: {
  title: ReactNode
  onDismiss: () => void
  topContent: () => ReactNode
  bottomContent?: () => ReactNode | undefined
}) {
  return (
    <Wrapper>
      <Section>
        <RowBetween style={{ justifyContent: 'center' }}>
          <Text fontWeight={600} fontSize={20}>
            {title}
          </Text>
          {/* <CloseIcon onClick={onDismiss} /> */}
        </RowBetween>
        {topContent()}
      </Section>
      {bottomContent && <BottomSection gap="12px">{bottomContent()}</BottomSection>}
    </Wrapper>
  )
}

export function TransactionErrorContent({ message, onDismiss }: { message: ReactNode; onDismiss: () => void }) {
  const theme = useContext(ThemeContext)
  return (
    <Wrapper>
      <Section>
        <RowBetween>
          <Text fontWeight={500} fontSize={20}>
            <Trans>Error</Trans>
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <AutoColumn style={{ marginTop: 20, padding: '2rem 0' }} gap="24px" justify="center">
          <AlertTriangle color={theme.red1} style={{ strokeWidth: 1.5 }} size={64} />
          <Text
            fontWeight={500}
            fontSize={16}
            color={theme.red1}
            style={{ textAlign: 'center', width: '85%', wordBreak: 'break-word' }}
          >
            {message}
          </Text>
        </AutoColumn>
      </Section>
      <BottomSection gap="12px">
        <ButtonPrimary onClick={onDismiss}>
          <Trans>Dismiss</Trans>
        </ButtonPrimary>
      </BottomSection>
    </Wrapper>
  )
}

function L2Content({
  swapResponse,
  onDismiss,
  chainId,
  hash,
  pendingText,
  inline,
}: {
  swapResponse: RadiusSwapResponse
  onDismiss: () => void
  hash: string | undefined
  chainId: number
  currencyToAdd?: Currency | undefined
  pendingText: ReactNode
  inline?: boolean // not in modal
}) {
  const theme = useContext(ThemeContext)

  const transaction = useTransaction(hash)
  const confirmed = useIsTransactionConfirmed(hash)
  const transactionSuccess = transaction?.receipt?.status === 1

  // convert unix time difference to seconds
  const secondsToConfirm = transaction?.confirmedTime
    ? (transaction.confirmedTime - transaction.addedTime) / 1000
    : undefined

  const info = CHAIN_INFO[chainId as SupportedL2ChainId]

  return (
    <Wrapper>
      <Section inline={inline}>
        {!inline && (
          <RowBetween mb="16px">
            <Badge>
              <RowFixed>
                <StyledLogo src={info.logoUrl} style={{ margin: '0 8px 0 0' }} />
                {info.label}
              </RowFixed>
            </Badge>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
        )}
        <ConfirmedIcon inline={inline}>
          {confirmed ? (
            transactionSuccess ? (
              <>
                <AnimatedConfirmation />
              </>
            ) : (
              <AlertCircle strokeWidth={1} size={inline ? '40px' : '90px'} color={theme.red1} />
            )
          ) : (
            // <CustomLightSpinner src={Circle} alt="loader" size={inline ? '40px' : '90px'} />
            <AnimatedConfirmation />
          )}
        </ConfirmedIcon>
        <AutoColumn gap="12px" justify={'center'}>
          <Text fontWeight={500} fontSize={20} textAlign="center">
            {!hash ? (
              <Trans>Confirm transaction in wallet</Trans>
            ) : !confirmed ? (
              <Trans>Transaction Submitted</Trans>
            ) : transactionSuccess ? (
              <Trans>Success</Trans>
            ) : (
              <Trans>Error</Trans>
            )}
          </Text>
          <Text fontWeight={400} fontSize={16} textAlign="center">
            <>
              {transaction ? <TransactionSummary info={transaction.info} /> : pendingText}
              {!confirmed && (
                <>
                  <Text fontWeight={500} fontSize={14} marginTop={20}>
                    <Trans>
                      Round: {swapResponse.data.txOrderMsg.round}, Order: {swapResponse.data.txOrderMsg.order}
                    </Trans>
                  </Text>
                  <Text fontWeight={400} fontSize={14} color={'#565A69'} marginTop={10}>
                    <Trans>Your transaction would be executed on fixed order.</Trans>
                  </Text>
                </>
              )}
              {confirmed && transactionSuccess && (
                <>
                  <Text fontWeight={500} fontSize={14} marginTop={20}>
                    <Trans>
                      Round: {swapResponse.data.txOrderMsg.round}, Order: {swapResponse.data.txOrderMsg.order}
                    </Trans>
                  </Text>
                  <Text fontWeight={400} fontSize={14} color={'#565A69'} marginTop={10}>
                    <Trans>Your transaction was executed on fixed order.</Trans>
                  </Text>
                </>
              )}
            </>
          </Text>
          {chainId && hash ? (
            <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
              <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                <Trans>View on Explorer</Trans>
              </Text>
            </ExternalLink>
          ) : (
            <div style={{ height: '17px' }} />
          )}
          <Text color={theme.text3} style={{ margin: '20px 0 0 0' }} fontSize={'14px'}>
            {!secondsToConfirm ? (
              <div style={{ height: '24px' }} />
            ) : (
              <div>
                <Trans>Transaction completed in </Trans>
                <span style={{ fontWeight: 500, marginLeft: '4px', color: theme.text1 }}>
                  {secondsToConfirm} seconds 🎉
                </span>
              </div>
            )}
          </Text>
          <ButtonPrimary onClick={onDismiss} style={{ margin: '4px 0 0 0' }}>
            <Text fontWeight={500} fontSize={20}>
              {inline ? <Trans>Return</Trans> : <Trans>Close</Trans>}
            </Text>
          </ButtonPrimary>
        </AutoColumn>
      </Section>
    </Wrapper>
  )
}

interface ConfirmationModalProps {
  isOpen: boolean
  onDismiss: () => void
  hash: string | undefined
  content: () => ReactNode
  attemptingTxn: boolean
  pendingText: ReactNode
  currencyToAdd?: Currency | undefined
  swapResponse?: RadiusSwapResponse | undefined
  showVdf?: boolean
}

export default function TransactionConfirmationModal({
  isOpen,
  onDismiss,
  attemptingTxn,
  hash,
  pendingText,
  content,
  currencyToAdd,
  swapResponse,
  showVdf,
}: ConfirmationModalProps) {
  const { chainId } = useActiveWeb3React()

  const isL2 = Boolean(chainId && L2_CHAIN_IDS.includes(chainId))

  if (!chainId) return null

  // confirmation screen
  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
      {isL2 && swapResponse && (hash || attemptingTxn) ? (
        <L2Content
          swapResponse={swapResponse}
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          pendingText={pendingText}
        />
      ) : attemptingTxn ||
        // ? (
        //  <ConfirmationPendingContent onDismiss={onDismiss} pendingText={pendingText} />
        // ) :
        hash ||
        showVdf ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={hash}
          onDismiss={onDismiss}
          currencyToAdd={currencyToAdd}
          swapResponse={swapResponse}
        />
      ) : (
        content()
      )}
    </Modal>
  )
}

interface ModalTestProps {
  isOpen: boolean
  swapResponse?: RadiusSwapResponse | undefined
  onDismiss: () => void
}
export function ModalTest({ isOpen, onDismiss, swapResponse }: ModalTestProps) {
  let progress = 1

  progress = 7

  return (
    <>
      {progress === 1 || progress === 2 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <PreparingForSwap onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 3 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <WaitingForSwapConfirmation
              onDismiss={onDismiss}
              progress={progress}
              swapResponse={swapResponse as RadiusSwapResponse}
            />
          </Wrapper>
        </Modal>
      ) : progress === 4 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <TransactionSubmitted onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 5 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={600}>
          <Wrapper>
            <TransactionCancelSuggest onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 6 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={600}>
          <Wrapper>
            <ClaimReimbursement onDismiss={onDismiss} progress={progress} />
          </Wrapper>
        </Modal>
      ) : progress === 7 ? (
        <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} width={500}>
          <Wrapper>
            <ReimbursementDetails onDismiss={onDismiss} />
          </Wrapper>
        </Modal>
      ) : (
        'default'
      )}
    </>
  )
}

/*

function WatingForSwapConfirmation(onDismiss: any, progress: number) {
function TransactionSubmitted(onDismiss: any, progress: number) {
*/

function PreparingForSwap({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
    <Section
      style={{
        position: 'relative',
      }}
    >
      <RowCenter style={{ position: 'absolute', width: '100%' }}>
        <ThemedText.Black fontSize={20} fontWeight={600} color={'#ffffff'}>
          Preparing for swap
        </ThemedText.Black>
      </RowCenter>
      <RowBetween>
        <div />
        <CloseIcon onClick={onDismiss} />
      </RowBetween>
      <RowBetween>
        <ConfirmedIcon>
          <GradientSpinner className={'spinner'} background={'rgba(44, 47, 63)'} />
        </ConfirmedIcon>
      </RowBetween>
      <RowCenter>
        <ThemedText.Black
          fontSize={20}
          fontWeight={600}
          color={'#0000aa'}
          style={{
            background: 'linear-gradient(90.2deg, #0085FF 15.73%, #00FFD1 46.33%, #42FF00 101.67%)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {progress === 1 ? (
            <>Generating proofs for your transaction...</>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              Almost done!
              <br />
              Encrypting transaction before processing swap...
            </div>
          )}
        </ThemedText.Black>
      </RowCenter>
      <br />
      <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '90%' }}>
          <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
            We&apos;re doing some extra work to protect your transaction from malicious operator activities.
          </ThemedText.Black>
        </div>
      </RowCenter>
      <div style={{ padding: 5 }} />
    </Section>
  )
}

function WaitingForSwapConfirmation({
  onDismiss,
  progress,
  swapResponse,
}: {
  onDismiss: any
  progress: number
  swapResponse: RadiusSwapResponse
}) {
  return (
    <Section
      style={{
        position: 'relative',
      }}
    >
      <RowCenter>
        <img src={'./images/confirmation.png'} width="132" height="98" alt="" />
      </RowCenter>
      <br />
      <RowCenter>
        <ThemedText.Black fontSize={20} fontWeight={600}>
          Waiting for swap confirmation
        </ThemedText.Black>
      </RowCenter>
      <br />
      <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: '90%' }}>
          <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
            confirm the transaction on your wallet
          </ThemedText.Black>
        </div>
      </RowCenter>
      <div>{swapResponse}</div>
      <div style={{ padding: 5 }} />
    </Section>
  )
}

function TransactionSubmitted({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
    <Section
      style={{
        position: 'relative',
      }}
    >
      <RowCenter>
        <div
          style={{
            background: '#1b1e2d',
            borderRadius: '66px',
            width: '132px',
            height: '132px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <img src={'./images/MEV_protected.png'} width="85" height="78" alt="" />
        </div>
      </RowCenter>
      <RowCenter style={{ marginTop: '20px' }}>
        <ThemedText.Black fontSize={20} fontWeight={600}>
          Transaction Submitted
        </ThemedText.Black>
      </RowCenter>
      <RowCenter style={{ textAlign: 'center', justifyContent: 'center', alignItems: 'center', marginTop: '12px' }}>
        <div style={{ width: '90%' }}>
          <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
            You may continue to wait until the transaction is confirmed on the blockchain or try another secure swap.
          </ThemedText.Black>
        </div>
      </RowCenter>
      <ButtonPrimary
        style={{ background: '#1B1E2D', height: '46px', borderRadius: '23px', marginTop: '86px' }}
        onClick={() => onDismiss()}
      >
        Close
      </ButtonPrimary>
      <div style={{ padding: 5 }} />
    </Section>
  )
}

function TransactionCancelSuggest({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
    <Section
      style={{
        position: 'relative',
      }}
    >
      <RowCenter>
        <img src={'./images/warning.png'} width="96" height="96" alt="" />
      </RowCenter>
      <RowCenter style={{ marginTop: '20px' }}>
        <ThemedText.Black fontSize={20} fontWeight={600}>
          Transaction Pending
        </ThemedText.Black>
      </RowCenter>
      <RowCenter
        style={{
          background: 'rgba(37,39,53)',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '80px',
          marginBottom: '50px',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ justifyContent: 'space-around', display: 'flex', flexDirection: 'row', width: '70%' }}>
          <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
            {'0.123123 MATIC'}
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
            <ArrowRight color={'#8BB3FF'} size={'16px'} />
          </ThemedText.Black>
          <ThemedText.Black fontSize={14} fontWeight={500} color={'#8BB3FF'}>
            {'0.12303 WETH'}
          </ThemedText.Black>
        </div>
        <br />
        <ThemedText.Black fontSize={14} fontWeight={500} color={'#a8a8a8'}>
          You may cancel for a transaction timeout as the operator is not responding. Cancellation must be made within
          the remaining time or it may be processed on the blockchain.
        </ThemedText.Black>
        <br />
        <ThemedText.Black fontSize={16} fontWeight={500} color={'#ffffff'}>
          If you wish to proceed with the swap, click Proceed Swap.
        </ThemedText.Black>
      </RowCenter>
      <RowBetween>
        <ButtonPrimary
          style={{
            background: 'transparent',
            height: '46px',
            borderRadius: '4px',
            width: '65%',
            marginRight: '16px',
            border: '1px solid',
            borderColor: 'white',
          }}
        >
          <span>Cancel transaction in </span>
          <span style={{ color: 'red', fontWeight: 'bold' }}>{'0:29'}</span>
        </ButtonPrimary>
        <ProceedButton style={{ width: '35%', height: '46px', borderRadius: '4px', margin: '0px', fontWeight: 'bold' }}>
          Proceed Swap
        </ProceedButton>
      </RowBetween>
    </Section>
  )
}

function TransactionCancel({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return <>TransactionCancel</>
}

function ClaimReimbursement({ onDismiss, progress }: { onDismiss: any; progress: number }) {
  return (
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
        operator. You may claim this reimbursement at any time. If you would like to receive the reimbursement now,
        click <span style={{ fontWeight: 'bold', color: 'white' }}>Confirm Reimbursement.</span>{' '}
        <a href="">Learn more</a>
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
            <ThemedText.Black fontSize={18} fontWeight={600} color={'#ffffFF'}>
              {'0.12303 WETH'}
            </ThemedText.Black>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
            <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
              {'To'}
            </ThemedText.Black>
            <ThemedText.Black fontSize={18} fontWeight={600} color={'#ffffFF'}>
              {'0.12303 MATIC'}
            </ThemedText.Black>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'start', textAlign: 'start' }}>
            <ThemedText.Black fontSize={12} fontWeight={500} color={'#ffffFF'} style={{ paddingBottom: '8px' }}>
              {'Total Reimbursement'}
            </ThemedText.Black>
            <ThemedText.Black fontSize={18} fontWeight={600} color={'#ffffFF'}>
              {'0.12303 USDC'}
            </ThemedText.Black>
          </div>
        </div>
      </RowCenter>
      <RowBetween style={{ marginBottom: '10px' }}>
        <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
          Swap Date
        </ThemedText.Black>
        <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
          Nov 25 2022 11:36 AM
        </ThemedText.Black>
      </RowBetween>
      <RowBetween style={{ marginBottom: '10px' }}>
        <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
          Transaction Hash
        </ThemedText.Black>
        <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
          0x88a...751&nbsp;
          <LinkIcon size="12px" />
        </ThemedText.Black>
      </RowBetween>
      <RowBetween style={{ marginBottom: '10px' }}>
        <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
          Reimburse To
        </ThemedText.Black>
        <ThemedText.Black fontSize={14} fontWeight={400} color={'#ffffFF'}>
          0xCCc379b885ABA6820304E8eC9DC979Bdd8941b6e
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
        >
          Confirm
        </ButtonPrimary>
      </RowBetween>
    </Section>
  )
}

function ReimbursementDetails({ onDismiss }: { onDismiss: () => void }) {
  return (
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
            Nov 25 2022 11:36 AM
          </ThemedText.Black>
        </div>
        <div style={{ padding: '8px 0px' }}>
          <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
            Amount
          </ThemedText.Black>
          <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
            1000 USDC
          </ThemedText.Black>
        </div>
        <div style={{ padding: '8px 0px' }}>
          <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
            Reimburse To
          </ThemedText.Black>
          <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
            0xCCc379b885ABA6820304E8eC9DC979Bdd8941b6e
          </ThemedText.Black>
        </div>
        <div style={{ padding: '8px 0px' }}>
          <ThemedText.Black fontSize={12} fontWeight={400} color={'#8BB3FF'}>
            Transaction Hash
          </ThemedText.Black>
          <ThemedText.Black fontSize={16} fontWeight={400} color={'#dddddd'}>
            0x88a...751&nbsp;
            <LinkIcon size="12px" />
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
          onClick={() => onDismiss()}
        >
          Close
        </ButtonPrimary>
      </RowCenter>
    </Section>
  )
}
