import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { ReactNode } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { ButtonError } from '../Button'
import { AutoRow } from '../Row'
import { SwapCallbackError } from './styleds'

const SwapButtonError = styled(ButtonError)`
  margin: 10px 0px 16px 0px;
  background: linear-gradient(97deg, #0057ff 10%, #00ff66 65%, #2cff9a 100%);
  border-radius: 4px;
  color: #000;
  border: 0px solid #fff;
  &:hover {
    border: 0px solid #fff;
  }
`

export default function SwapModalFooter({
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
}: {
  trade: Trade<Currency, Currency, TradeType>
  onConfirm: () => void
  swapErrorMessage: ReactNode | undefined
  disabledConfirm: boolean
}) {
  return (
    <>
      <AutoRow>
        <SwapButtonError
          onClick={onConfirm}
          disabled={disabledConfirm}
          style={{ margin: '10px 0 0 0' }}
          id="confirm-swap-or-send"
        >
          <Text fontSize={20} fontWeight={500}>
            <Trans>Confirm Swap</Trans>
          </Text>
        </SwapButtonError>

        {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
      </AutoRow>
    </>
  )
}
