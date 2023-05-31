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
  max-width: ${({ maxWidth }) => maxWidth ?? '500px'};
  width: 100%;
  background: linear-gradient(180deg, #525e8d 0%, #3c3e64 48.96%, #2b3258 100%);
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 10px;
  border: solid 1px #4f5d94;
  padding: 10px;
  z-index: ${Z_INDEX.deprecated_content};
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function SwapSection({ children, ...rest }: SwapSectionProps) {
  return <BodyWrapper {...rest}>{children}</BodyWrapper>
}
