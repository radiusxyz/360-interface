import React, { ReactNode } from 'react'
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

export const Loading = styled.img.attrs((props) => ({
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
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
  mrgn?: string
}

const StyledPrimaryButton = styled.button<PrimaryButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  border: none;
  padding: 13px;
  margin: ${({ mrgn }) => mrgn && mrgn};
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
  mrgn?: string
  mt?: string
  mr?: string
  mb?: string
  ml?: string
  isSelected?: boolean
  onClick?: (e: React.MouseEvent<HTMLElement>) => void
}

const StyledSelectTokenButton = styled.button<SelectTokenButtonProps>`
  display: flex;
  white-space: nowrap;
  margin: ${({ isSelected }) => (isSelected && '4px 0px 0px 0px') || '5px 0px 0px 3px'};
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: ${({ isSelected }) => !isSelected && '6px'};
  max-width: ${({ isSelected }) => (isSelected && '129px') || '129px'};
  border-radius: 31px;
  background: transparent;
  color: #000000;
  font-style: normal;
  font-weight: 500;
  font-size: 18px;
  line-height: 26.01px;
  padding: ${({ isSelected }) => (isSelected && '4px 2px 3px 3px') || '3px 8px 3px 14px'}};
  border: none;
  &:hover {
    background: #f5f4ff;
    color: #6b11ff;
    cursor: pointer;
  }
`

const Arrow = styled.svg.attrs({
  viewbox: '0 0 12 14',
  fill: 'none',
  width: 12,
  height: 14,
})`
  color: #9e91e9;
  &&& {
    ${StyledSelectTokenButton}:hover & {
      color: #6b11ff;
    }
  }
`

export const SelectTokenButton = ({ children, ...rest }: SelectTokenButtonProps) => (
  <StyledSelectTokenButton {...rest}>
    {children}
    <Arrow>
      <path d="M4 11L8 7L4 3" stroke="currentColor" strokeWidth="1.5" />
    </Arrow>
  </StyledSelectTokenButton>
)
