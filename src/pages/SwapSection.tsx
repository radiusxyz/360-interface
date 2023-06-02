import React from 'react'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme'

interface SwapSectionProps {
  children: React.ReactNode
  maxWidth?: string
  margin?: string
}

//   background: ${({ theme }) => theme.bg0};
export const BodyWrapper = styled.main<{ margin?: string; maxWidth?: string }>`
  position: relative;
  max-width: 372px;
  width: 100%;
  background: #ffffff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  border: solid 1px #dde0ff;
  z-index: ${Z_INDEX.deprecated_content};
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function SwapSection({ children, ...rest }: SwapSectionProps) {
  return <BodyWrapper {...rest}>{children}</BodyWrapper>
}
