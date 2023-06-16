import styled, { css } from 'styled-components/macro'

export const Wrapper = styled.div`
  display: flex;
  border: 1px solid #dde0ff;
  max-width: 279px;
  height: 36px;
  width: 100%;
  border-radius: 4px;
  background: #f5f4ff;
  margin-top: ;
`

export const Tab = styled.button<{ isActive: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  line-height: 92.08%;
  max-width: 139.5px;
  border: none;
  font-size: 14px;
  width: 100%;
  border-radius: 4px;
  ${({ isActive }) =>
    (isActive &&
      css`
        background: #ffffff;
        box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
        font-weight: 500;
        color: #6b11ff;
        border-radius: 4px;
      `) ||
    css`
      background: #f5f4ff;
      font-weight: 400;
      color: #8d95d7;
    `};
`

export const InProgress = styled(Tab)<{ isActive: boolean }>`
  border-right: ${({ isActive }) => isActive && '1px solid #dde0ff'};
`

export const Completed = styled(Tab)<{ isActive: boolean }>`
  border-left: ${({ isActive }) => isActive && '1px solid #dde0ff'};
`
