import React from 'react'
import styled from 'styled-components/macro'

import { ExternalLinkCenter } from '../../theme'

const OptionCard = styled.button`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: start;
  padding: 16px 0 15px 0;
  background: transparent;
  border: 1px solid #dde0ff;
  width: 100%;
  gap: 12px;
`

const GreenCircle = styled.div`
  background-color: #007d35;
  position: absolute;
  border-radius: 50%;
  width: 8px;
  height: 8px;
  left: -50%;
`

const WalletName = styled.div`
  color: #000;
  font-size: 20px;
  font-weight: 500;
  line-height: 144.523%;
`

const IconWrapper = styled.div`
  display: flex;
  height: 32px;
  width: 32px;
  justify-content: center;
  align-items: center;
  margin-left: 87px;
  position: relative;
`

export default function Option({
  link = null,
  onClick,
  header,
  icon,
  active = false,
  id,
}: {
  link?: string | null
  clickable?: boolean
  size?: number | null
  onClick?: () => void
  header: React.ReactNode
  subheader?: React.ReactNode | null
  icon: string
  active?: boolean
  id: string
}) {
  const content = (
    <OptionCard id={id} onClick={onClick}>
      <IconWrapper>
        {active && <GreenCircle />}
        <img src={icon} alt={'wallet-icon'} />
      </IconWrapper>
      <WalletName>{header}</WalletName>
    </OptionCard>
  )
  if (link) {
    return <ExternalLinkCenter href={link}>{content}</ExternalLinkCenter>
  }

  return content
}
