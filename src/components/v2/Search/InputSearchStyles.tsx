import styled from 'styled-components/macro'

export const Paddinger = styled.div`
  padding: 20px 20px 0px 20px;
  margin-bottom: 15px;
  width: 100%;
`

export const Wrapper = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  height: 46px;
  align-items: center;
  padding: 14px 17px 13px;
  background: #ffffff;
  border: 1px solid #dde0ff;
  border-radius: 2px;
`

export const Input = styled.input`
  display: block;
  border: none;
  background-color: transparent;
  width: 100%;
  height: 100%;
  outline: none;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 134.84%;
  color: #595959;
`

export const SearchIcon = styled.div`
  display: flex;
  align-items: center;
  &:hover {
    cursor: pointer;
    transform: scale(1.1);
    transition: 0.3s all;
  }
`
