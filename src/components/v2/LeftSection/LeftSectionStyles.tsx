import styled from 'styled-components/macro'
import ferris_wheel from '../../../assets/v2/images/ferris_wheel.png'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  border: 1px solid #dde0ff;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  width: 100%;
  max-width: 500px;
  min-height: 381px;
  height: 100%;
`

export const FerrisWheel = styled.img.attrs(() => ({
  src: ferris_wheel,
  height: '60px',
  width: '60px',
}))``

export const GreetingMessage = styled.p`
  font-weight: 500;
  font-size: 20px;
  line-height: 26.97px;
  color: #5800af;
  margin: 0;
`
