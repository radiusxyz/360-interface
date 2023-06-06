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
import { ButtonGray, ButtonGrayV2 } from '../Button'
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
  background-color: transparent;
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
  border-bottom: 1px solid #dde0ff;
  width: ${({ hideInput }) => (hideInput ? '100%' : 'initial')};
`

const Aligner = styled.div`
  display: flex;
  align-items: center;
  justify-content: start;
  gap: 6px;
  width: 100%;
`

const CurrencySelect = styled(ButtonGrayV2)<{ visible: boolean; selected: boolean; hideInput?: boolean }>`
  align-items: center;
  color: ${({ selected, theme }) => (selected ? theme.text1 : '#000000')};
  font-size: 18px;
  font-weight: 500;
  flex-shrink: 0;
  white-space: nowrap;
  background-color: transparent;
  border-radius: 31px;
  padding: 6px 14px;
  outline: none;
  user-select: none;
  border: none;
  height: ${({ hideInput }) => (hideInput ? '40px' : '40px')};
  // width: ${({ hideInput }) => (hideInput ? '100%' : '160px')};
  max-width: 146px;
  justify-content: space-between;
  visibility: ${({ visible }) => (visible ? 'visible' : 'hidden')};
  &:hover {
    color: #6b11ff;
    background-color: #f5f4ff;
  }
  width: 100%;
`

const InputRow = styled.div<{ selected: boolean; rowId: string }>`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: start;
  justify-content: space-between;
  border-bottom: none;
  gap: 8px;
  padding: ${(props) => (props.rowId === 'swap-currency-input' ? '38px 24px 20px 24px' : '20px 24px 20px 24px')};
`
// Commented out by Gylman
// const LabelRow = styled.div`
//   ${({ theme }) => theme.flexRowNoWrap}
//   align-items: center;
//   color: ${({ theme }) => theme.text1};
//   font-size: 0.75rem;
//   line-height: 1rem;
//   padding: 0 8px 8px;
//   span:hover {
//     cursor: pointer;
//     color: ${({ theme }) => darken(0.2, theme.text2)};
//   }
// `

// const FiatRow = styled(LabelRow)`
//   justify-content: flex-end;
// `

const Divider = styled.div`
  outline: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  width: 100%;
`

const StyledDropDown = styled(DropDown)<{ selected: boolean }>`
  height: 6px;
  width: 10px;
  transform: rotate(270deg);
  path {
    stroke: #9e91e9;
    stroke-width: 1.5px;
  }

  &&& {
    ${CurrencySelect}:hover & {
      path {
        stroke: #6b11ff;
        stroke-width: 1.5px;
      }
    }
  }
`

const StyledTokenName = styled.span<{ active?: boolean }>`
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 144.52%;
`

const StyledTokenNameWrapper = styled.div`
  display: flex;
  align-items: center;
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

const InputWrapper = styled.div<{ paint: string; value: string }>`
  display: flex;
  border: none;
  width: 100%;
  justify-content: end;
  align-items: start;
  height: 60px;
  background-color: ${(props) => (props.value ? '#f5f4ff' : props.paint)};
  outline: ${(props) => props.value && '1px solid #dde0ff'};
  &:hover {
    background: #f5f4ff;
    outline: 1px solid #dde0ff;
  }
  &:focus {
    background: #f5f4ff;
    outline: 1px solid #dde0ff;
  }
  &:active {
    background: #f5f4ff;
    outline: 1px solid #dde0ff;
  }
`

const StyledNumericalInput = styled(NumericalInput)<{ $loading: boolean }>`
  ${loadingOpacityMixin};
  display: flex;
  align-items: start;
  font-weight: 500;
  text-align: right;
  vertical-align: top;
  width: 100%;
  font-size: 22px;
  padding: 6px 6px 0px 0px;
  border-radius: 0;
  background-color: ${({ value }) => (value ? '#f5f4ff' : 'transparent')};
  color: ${({ value }) => (value ? '#6B11FF' : '#D0B2FF')};
  &:hover {
    background: #f5f4ff;
  }
  &:focus {
    background: #f5f4ff;
    color: ${({ value }) => (value ? '#6B11FF' : '#D0B2FF')};
  }
  &:blur {
    color: ${({ value }) => (value ? '#6B11FF' : '#D0B2FF')};
  }
  &:active {
    background: #f5f4ff;
    color: ${({ value }) => (value ? '#6B11FF' : '#D0B2FF')};
  }
`

interface CurrencyInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  onHalf?: () => void
  showMaxButton: boolean
  label?: ReactNode
  onCurrencySelect?: (currency: Currency | null) => void
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
  const [background, setBackground] = useState('transparent')

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const styleTheParentWhenFocus = (e: any) => {
    console.log(e.type)
    setBackground(e.type === 'focus' ? '#f5f4ff' : 'white')
  }

  const styleTheParentWhenBlur = (e: any) => {
    console.log(e.type)
    setBackground('white')
  }

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
        {/* Commented by GYLMAN */}
        {/* <InputRow
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
        > */}
        <InputRow rowId={id} selected={!onCurrencySelect}>
          <CurrencySelect
            visible={currency !== undefined || currency !== null}
            selected={!!currency}
            hideInput={hideInput}
            className="open-currency-select-button"
            onClick={() => {
              if (onCurrencySelect) {
                setModalOpen(true)
              }
            }}
            onMouseOver={() => setMouseOver(true)}
            onMouseOut={() => setMouseOver(false)}
          >
            {/* Commented out by Gylman */}
            {/* <Aligner style={pair || currency ? {} : { justifyContent: 'right' }}> */}
            <Aligner style={pair || currency ? {} : {}}>
              <RowFixed>
                {pair ? (
                  <DoubleCurrencyLogo currency0={pair.token0} currency1={pair.token1} size={24} margin={true} />
                ) : currency ? (
                  <CurrencyLogo style={{ marginRight: '0.5rem' }} currency={currency} size={'32px'} />
                ) : (
                  <></>
                )}
                {pair ? (
                  <StyledTokenName className="pair-name-container">
                    {pair?.token0.symbol}:{pair?.token1.symbol}
                  </StyledTokenName>
                ) : (
                  <StyledTokenNameWrapper>
                    {(currency && currency.symbol && currency.symbol.length > 20
                      ? currency.symbol.slice(0, 4) +
                        '...' +
                        currency.symbol.slice(currency.symbol.length - 5, currency.symbol.length)
                      : currency?.symbol) || (
                      <StyledTokenName>
                        <Trans>Select Token</Trans>
                      </StyledTokenName>
                    )}
                  </StyledTokenNameWrapper>
                )}
              </RowFixed>
              {onCurrencySelect && <StyledDropDown selected={!!currency} />}
            </Aligner>
          </CurrencySelect>
          {!hideInput && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                justifyContent: 'start',
                alignItems: 'end',
              }}
            >
              <InputWrapper value={value} paint={background}>
                <StyledNumericalInput
                  className="token-amount-input"
                  value={value}
                  width="100%"
                  onUserInput={onUserInput}
                  $loading={loading}
                  onFocus={styleTheParentWhenFocus}
                  onBlur={styleTheParentWhenBlur}
                />
              </InputWrapper>
            </div>
          )}
        </InputRow>
        {/* Commented out by Gylman */}
        {/* <FiatRow style={{ padding: '0px 24px 24px 24px' }}> */}
        {/* <FiatRow>
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
          </RowBetween>
        </FiatRow> */}
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
