import { Trans } from 'utils/trans'
import { Percent } from '@uniswap/sdk-core'
import styled from 'styled-components/macro'

import { ThemedText } from '../../theme'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

const StyledSwapHeader = styled.div`
  padding: 22px 1.25rem 10px 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <div style={{ width: '24px', marginLeft: '20px' }}>&nbsp;</div>
        <div
          style={{
            position: 'static',
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
          }}
        >
          <ThemedText.Black fontWeight={600} fontSize={20}>
            <Trans>Swap</Trans>
          </ThemedText.Black>
        </div>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}
