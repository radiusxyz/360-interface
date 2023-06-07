import styled from 'styled-components/macro'

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow: auto;
  border-top: 1px solid #dde0ff;

  &::-webkit-scrollbar {
    width: 6px;
    height: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #ffffff;
    border-radius: 4px;
    border: 1px solid #dde0ff;
    box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
    height: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #ededff;
    height: 10px;
  }

  &::-webkit-scrollbar-thumb:active {
    background: #ededff;
    height: 10px;
  }

  &::-webkit-scrollbar-track {
    background-color: #ffffff;
  }
`
