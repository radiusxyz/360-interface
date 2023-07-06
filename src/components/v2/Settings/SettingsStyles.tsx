import styled from 'styled-components/macro'

export const Wrapper = styled.div<{ longerVersion?: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  height: ${({ longerVersion }) => (longerVersion && '471.38px') || '381px'};
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
  width: 372px;
`

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 24px;
  align-items: center;
  border-bottom: 1px solid #dde0ff;
  max-height: 44px;
`

export const HeaderTitle = styled.span`
  font-style: normal;
  font-weight: 500;
  font-size: 16px;
  line-height: 144.52%;
  color: #000000;
`

export const Close = styled.svg.attrs({
  viewBox: '0 0 20 20',
  width: 20,
  height: 20,
  fill: 'none',
})`
  &: hover {
    filter: brightness(30%);
    cursor: pointer;
  }
`

export const Body = styled.div`
  display: flex;
  flex-direction: column;
  padding: 40px 24px 0px 24px;
  gap: 30px;
`

export const OptionsRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 18px;
`

export const TopDescWrapper = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
`

export const Description = styled.span`
  font-weight: 400;
  font-size: 16px;
  line-height: 144.52%;
  color: #000000;
`

export const Option = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 96px;
  width: 100%;
  height: 32px;
  border-radius: 31px;
  border: 1px solid #dde0ff;
  &:hover {
    color: #6b11ff;
    border: 1px solid var(--primary-color, #6b11ff);
  }
`

export const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 43px;
  padding: 13px 36px 12px 26px;
  background: #f5f4ff;
  border-radius: 49px;
`

export const Input = styled.input.attrs({
  type: 'number',
  inputMode: 'decimal',
  spellCheck: 'false',
  minLength: 1,
  maxLength: 79,
})`
  text-align: right;
  width: 100%;
  border: none;
  outline: none;
  background-color: inherit;
  font-weight: 400;
  font-size: 16px;
  line-height: 18px;
  color: #000000;
  ::placeholder {
    color: #000000;
  }

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type='number'] {
    -moz-appearance: textfield;
  }
`

export const SlippageSettingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 13px;
`

export const MevSettingWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export const BottomDescWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

export const Footer = styled.div`
  margin-top: auto;
  border-top: 1px solid #dde0ff;
  padding: 24px 24px 25px 24px;
`
