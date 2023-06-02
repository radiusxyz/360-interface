import { Trans } from '@lingui/macro'
import { Percent } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

const StyledSwapHeader = styled.div`
  padding: 11px 25.6px 10px 24px;
  width: 100%;
  color: #000000;
`

export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  return (
    <StyledSwapHeader>
      <RowBetween align="center">
        <ThemedText.Black fontWeight={500} fontSize={16}>
          <Trans>Swap</Trans>
        </ThemedText.Black>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
