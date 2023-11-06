import styled from 'styled-components/macro'

export const TopMostWrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  max-width: 500px;
  min-height: 381px;
  padding: 26px 28px 25px 28px;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  background: #ffffff;
`

export const Wrapper = styled.div<{ background: string }>`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  gap: ${({ background }) => (background === '#ffffff' ? '12px' : '33px')};
  background-color: ${({ background }) => background};
  border-radius: 4px;
  width: 100%;
  min-height: 100%;
`

export const ImageWrapper = styled.div``

export const Message = styled.p`
  font-weight: 500;
  font-size: 20px;
  line-height: 26.97px;
  color: #5800af;
  margin: 0;
`
