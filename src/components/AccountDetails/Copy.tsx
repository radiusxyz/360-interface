import { Trans } from 'utils/trans'
import copyDuplicateImage from 'assets/images/copy-duplicate.png'
import useCopyClipboard from 'hooks/useCopyClipboard'
import React, { useCallback } from 'react'
import { CheckCircle } from 'react-feather'
import styled from 'styled-components/macro'
import { LinkStyledButton } from 'theme'

const CopyIcon = styled(LinkStyledButton)`
  color: ${({ color, theme }) => color || theme.text3};
  flex-shrink: 0;
  display: flex;
  text-decoration: none;
  font-size: 12px;
  :hover,
  :active,
  :focus {
    text-decoration: none;
    color: ${({ color, theme }) => color || theme.text2};
  }
`
const TransactionStatusText = styled.span`
  margin-left: 0.25rem;
  font-size: 12px;
  ${({ theme }) => theme.flexRowNoWrap};
  align-items: center;
`

interface BaseProps {
  toCopy: string
  color?: string
}
export type CopyHelperProps = BaseProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>

function Copy() {
  return <img src={copyDuplicateImage} width="16px" height="16px" alt="copy" />
}

export default function CopyHelper({ color, toCopy, children }: CopyHelperProps) {
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(toCopy)
  }, [toCopy, setCopied])

  return (
    <CopyIcon onClick={copy} color={color}>
      {isCopied ? '' : children}
      &nbsp;
      {isCopied ? (
        <TransactionStatusText>
          <CheckCircle size={'20'} />
          <TransactionStatusText>
            <Trans>Copied</Trans>
          </TransactionStatusText>
        </TransactionStatusText>
      ) : (
        <TransactionStatusText>
          <Copy />
        </TransactionStatusText>
      )}
    </CopyIcon>
  )
}
