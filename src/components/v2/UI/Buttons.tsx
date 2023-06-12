import { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components/macro'
import loading_icon from '../../../assets/v2/images/loading_icon.png'

const rotate = () => keyframes`
from{
  transform: rotate(0deg)
}
to {
  transform:rotate(360deg)
}
`

const Loading = styled.img.attrs((props) => ({
  src: loading_icon,
  width: '12px',
  height: '12px',
}))`
  animation: ${rotate} 2s linear infinite;
`

type PrimaryButtonProps = {
  loading?: boolean
  disabled?: boolean
  children?: ReactNode
}

const StyledPrimaryButton = styled.button<PrimaryButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  border: none;
  padding: 13px;
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 144.52%;
  gap: 6px;
  color: ${({ loading, disabled }) => (loading && '#6B11FF') || (disabled && '#C5C5C5') || '#ffffff'};
  background-color: ${({ loading, disabled }) => (loading && '#E1E1FF') || (disabled && 'transparent') || '#6b11ff'};
  outline: ${({ disabled }) => disabled && '1px solid #C5C5C5'};
  &:hover {
    cursor: pointer;
  }
  &:active {
    cursor: pointer;
  }
`

export const PrimaryButton = ({ loading, children, disabled, ...rest }: PrimaryButtonProps) => (
  <StyledPrimaryButton loading={loading} disabled={disabled} {...rest}>
    {loading && <Loading />}
    {children}
  </StyledPrimaryButton>
)

type SelectTokenButtonProps = {
  children?: ReactNode
}

const StyledSelectTokenButton = styled.button<SelectTokenButtonProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 31px;
  background: transparent;
  color: #000000;
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 144.52%;
  padding: 3px 8px 3px 14px;
  border: none;
  &:hover {
    background: #f5f4ff;
    color: #6b11ff;
  }
`

export const SelectTokenButton = ({ children, ...rest }: SelectTokenButtonProps) => (
  <StyledSelectTokenButton {...rest}>{children}</StyledSelectTokenButton>
)
