import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { AutoColumn } from 'components/Column'
import { loadingOpacityMixin } from 'components/Loader/styled'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { darken } from 'polished'
import { ReactNode, useCallback, useState } from 'react'
import { Lock } from 'react-feather'
import styled from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { ReactComponent as DropDown } from '../../assets/images/dropdown.svg'
import useTheme from '../../hooks/useTheme'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { ThemedText } from '../../theme'
import { ButtonGray } from '../Button'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { Input as NumericalInput } from '../NumericalInput'
import { RowBetween, RowFixed } from '../Row'
import CurrencySearchModal from '../SearchModal/CurrencySearchModal'

const InputPanel = styled.div<{ hideInput?: boolean }>`
  ${({ theme }) => theme.flexColumnNoWrap}
  position: relative;
  /*border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};*/
  border-radius: 4px;
  background-color: 'transparent';
  z-index: 1;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
  transition: height 1s ease;
  will-change: height;
`

const EmptyCurrencyLogo = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 16px;
  background: #212127;
  margin-right: 8px;
`
const EmptyCurrencyLogoHover = styled.div`
  height: 32px;
  width: 32px;
  border-radius: 16px;
  margin-right: 8px;
  background: #101010;
`

const FixedContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.bg2};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`

const Container = styled.div<{ hideInput: boolean }>`
  /*border-radius: ${({ hideInput }) => (hideInput ? '16px' : '20px')};*/
  border-radius: '4px';
  border: 1px solid ${({ theme }) => theme.bg0};
  background-color: #101010;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

const CurrencySelect = styled(ButtonGray)<{ visible: boolean; selected: boolean; hideInput?: boolean }>`
  align-items: center;
  /* background-color: ${({ selected, theme }) => (selected ? theme.bg2 : theme.primary1)}; */
  /* box-shadow: ${({ selected }) => (selected ? 'none' : '0px 6px 10px rgba(0, 0, 0, 0.075)')}; */
  /* box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075); */
  background-color: #101010;
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.white)};
  cursor: pointer;
  border-radius: '20px';
  outline: none;
  user-select: none;
  border: none;
  font-size: 24px;
  font-weight: 400;
  height: ${({ hideInput }) => (hideInput ? '40px' : '40px')};
  width: ${({ hideInput }) => (hideInput ? '100%' : '160px')};
  padding: 0px 4px 0px 4px;
  justify-content: space-between;
  margin-left: ${({ hideInput }) => (hideInput ? '0px' : '0px')};
  margin-right: 14px;
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
`

const InputRow = styled.div<{ selected: boolean }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: space-between;
  /* padding: ${({ selected }) => (selected ? '8px 8px 0px 8px' : '8px 8px 0px 8px')};*/
  padding: 8px;
`

const LabelRow = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  color: ${({ theme }) => theme.text1};
  font-size: 0.75rem;
  line-height: 1rem;
  padding: 0 8px 8px;
  span:hover {
    cursor: pointer;
    color: ${({ theme }) => darken(0.2, theme.text2)};
  }
`

const FiatRow = styled(LabelRow)`
  justify-content: flex-end;
`

const Aligner = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  margin: 0 15px 0 15px;
  height: 6px;
  width: 10px;

  path {
    stroke: #ffffff33;
    stroke-width: 1.5px;
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  ${({ active }) => (active ? '  margin: 0 0.25rem 0 0.25rem;' : '  margin: 0 0.25rem 0 0.25rem;')}
  font-size:  ${({ active }) => (active ? '20px' : '20px')};
`

const StyledBalanceHalf = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  color: #d9d9d9;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  margin-left: 0.25rem;
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  padding: 2px 12px;
  margin: 0px 5px;
  width: 60px;
  height: 100%;
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};

  :hover {
    opacity: ${({ disabled }) => (!disabled ? 0.8 : 0.4)};
  }

  :focus {
    outline: none;
  }
`

const StyledBalanceMax = styled.button<{ disabled?: boolean }>`
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  color: #d9d9d9;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  margin-left: 0.25rem;
  opacity: ${({ disabled }) => (!disabled ? 1 : 0.4)};
  padding: 2px 12px;
  margin: 0px 5px;
  width: 60px;
  height: 100%;
  pointer-events: ${({ disabled }) => (!disabled ? 'initial' : 'none')};

  :hover {
    opacity: ${({ disabled }) => (!disabled ? 0.8 : 0.4)};
  }

  :focus {
    outline: none;
  }
`

const StyledNumericalInput = styled(NumericalInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  font-weight: 600;
  text-align: right;
`

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  onHalf?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency) => void
  currency?: Currency | null
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  otherCurrency?: Currency | null
  fiatValue?: CurrencyAmount<Token> | null
  priceImpact?: Percent
  id: string
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  renderBalance?: (amount: CurrencyAmount<Currency>) => ReactNode
  isA?: boolean
  locked?: boolean
  loading?: boolean
}

export default function CurrencyInputPanel({
  value,
  onUserInput,
  onHalf,
  onMax,
  showMaxButton,
  onCurrencySelect,
  currency,
  otherCurrency,
  id,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  renderBalance,
  isA,
  fiatValue,
  priceImpact,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  locked = false,
  loading = false,
  ...rest
}: CurrencyInputPanelProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
  const theme = useTheme()
  const [mouseOver, setMouseOver] = useState(false)

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  return (
    <InputPanel id={id} hideInput={hideInput} {...rest}>
      {locked && (
        <FixedContainer>
          <AutoColumn gap="sm" justify="center">
            <Lock />
            <ThemedText.Label fontSize="12px" textAlign="center" padding="0 12px">
              <Trans>The market price is outside your specified price range. Single-asset deposit only.</Trans>
            </ThemedText.Label>
          </AutoColumn>
        </FixedContainer>
      )}
      <Container hideInput={hideInput}>
        {showMaxButton ? (
          <div style={{ display: 'flex', justifyContent: 'right', width: '100%', padding: '16px 15px 0px 0px' }}>
            <StyledBalanceHalf onClick={onHalf}>
              <Trans>50%</Trans>
            </StyledBalanceHalf>
            <StyledBalanceMax onClick={onMax}>
              <Trans>MAX</Trans>
            </StyledBalanceMax>
          </div>
        ) : null}
        <InputRow
          style={
            hideInput
              ? showMaxButton
                ? { padding: '16px 20px 16px 20px', borderRadius: '8px' }
                : { padding: '24px 20px 16px 20px', borderRadius: '8px' }
              : showMaxButton
              ? { padding: '16px 20px 16px 20px' }
              : { padding: '24px 20px 16px 20px' }
          }
          selected={!onCurrencySelect}
        >
          <CurrencySelect
            visible={currency !== undefined}
            selected={!!currency}
            hideInput={hideInput}
            className="open-currency-select-button"
            onClick={() => {
              if (onCurrencySelect) {
                setModalOpen(true)
              }
            }}
            style={mouseOver ? { backgroundColor: '#1b1b1b' } : {}}
            onMouseOver={() => setMouseOver(true)}
            onMouseOut={() => setMouseOver(false)}
          >
            <Aligner>
              <RowFixed>
                {pair ? (
                  <span style={{ marginRight: '0.5rem' }}>
                    <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                  </span>
                ) : currency ? (
                  <CurrencyLogo style={{ marginRight: '0.5rem' }} currency={currency} size={'32px'} />
                ) : mouseOver ? (
                  <EmptyCurrencyLogoHover />
                ) : (
                  <EmptyCurrencyLogo />
                )}
                {pair ? (
                  <StyledTokenName className="pair-name-container">
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenName className="token-symbol-container" active={Boolean(currency && currency.symbol)}>
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? currency.symbol.slice(0, 4) +
                        '...' +
                        currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                      : currency?.symbol) || <Trans>Select</Trans>}
                  </StyledTokenName>
                )}
              </RowFixed>
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}
            </Aligner>
          </CurrencySelect>
          {!hideInput && (
            <StyledNumericalInput
              className="token-amount-input"
              value={value}
              onUserInput={onUserInput}
              $loading={loading}
            />
          )}
        </InputRow>
        <FiatRow style={{ padding: '0px 24px 24px 24px' }}>
          <RowBetween>
            {account ? (
              <RowFixed style={{ height: '20px' }}>
                <ThemedText.Body
                  color={theme.text3}
                  fontWeight={500}
                  fontSize={14}
                  style={{ display: 'inline', cursor: 'pointer' }}
                >
                  {currency && selectedCurrencyBalance ? (
                    renderBalance ? (
                      renderBalance(selectedCurrencyBalance)
                    ) : (
                      <Trans>Balance: {formatCurrencyAmount(selectedCurrencyBalance, 4)}</Trans>
                    )
                  ) : null}
                </ThemedText.Body>
              </RowFixed>
            ) : (
              <span />
            )}
            {/* <LoadingOpacityContainer $loading={loading}>
              <FiatValue fiatValue={fiatValue} priceImpact={priceImpact} />
            </LoadingOpacityContainer>
            <ThemedText.Body
              color={theme.text3}
              fontWeight={500}
              fontSize={14}
              style={{ display: 'inline', cursor: 'pointer' }}
            >
              {fiatValue && '$' + fiatValue}
            </ThemedText.Body> */}
          </RowBetween>
        </FiatRow>
      </Container>
      {onCurrencySelect &&
        (isA === false || isA === true ? (
          <CurrencySearchModal
            isOpen={modalOpen}
            onDismiss={handleDismissSearch}
            onCurrencySelect={onCurrencySelect}
            selectedCurrency={currency}
            otherSelectedCurrency={otherCurrency}
            aTokenAddress={
              isA ? null : otherCurrency ? otherCurrency?.wrapped.address : '0x0000000000000000000000000000000000000000'
            }
            bTokenAddress={
              isA
                ? otherCurrency
                  ? otherCurrency?.wrapped.address
                  : '0x0000000000000000000000000000000000000000'
                : null
            }
            showCommonBases={showCommonBases}
            showCurrencyAmount={showCurrencyAmount}
            disableNonToken={disableNonToken}
          />
        ) : (
          <CurrencySearchModal
            isOpen={modalOpen}
            onDismiss={handleDismissSearch}
            onCurrencySelect={onCurrencySelect}
            selectedCurrency={currency}
            otherSelectedCurrency={otherCurrency}
            showCommonBases={showCommonBases}
            showCurrencyAmount={showCurrencyAmount}
            disableNonToken={disableNonToken}
          />
        ))}
    </InputPanel>
  )
}
