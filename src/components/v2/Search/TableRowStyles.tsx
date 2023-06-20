import styled from 'styled-components/macro'
export const Wrapper = styled.div`
  padding: 19px 53px;
  display: flex;
  justify-content: space-between;
  width: 100%;
  background: #ffffff;
  &: hover {
    background: #ededff;
    cursor: pointer;
  }
`

export const DetailsWrapper = styled.div`
  display: flex;
  gap: 14px;
  align-items: center;
`

export const Logo = styled.img`
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 50%;
  border: 1px solid #dde0ff;
  background: #8347e6;
`

export const Title = styled.p`
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 17px;
  color: #000000;
`

export const Description = styled.span`
  font-style: normal;
  font-weight: 400;
  font-size: 12px;
  line-height: 14px;
  color: #6421d0;
  margin-left: -4px;
`
