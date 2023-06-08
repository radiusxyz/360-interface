import styled from 'styled-components/macro'

export const TableWrapper = styled.div`
  max-height: 554px;
  max-width: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
`

export const Bridge = styled.p`
  margin-top: 18px;
  color: #a3a3a3;
  font-style: normal;
  font-weight: 400;
  font-size: 20px;
  line-height: 23px;
  text-decoration-line: underline;
  &:hover {
    cursor: pointer;
  }
`
