import React, { useState } from 'react'
import styled, { css, keyframes } from 'styled-components/macro'
import completed from '../../../assets/v2/images/completed.svg'
import pending from '../../../assets/v2/images/pending.svg'
import failed from '../../../assets/v2/images/failed.svg'

type Status = { status: number }

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  height: 60px;
  border-radius: 60px;
  border: 1px solid #dde0ff;
  background: #fff;
  box-shadow: 0px 4px 21px 0px rgba(90, 18, 61, 0.1);
  &:hover {
    width: 200px;
    curosr: pointer;
    justify-content: flex-end;
  }
`

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Hint = styled.p<Status>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 16px;
  font-weight: 500;
  line-height: normal;
  color: ${({ status }) => (status === 0 && '#00b84a') || (status === 1 && '#6B11FF') || '#FF5C00'};
`

const Icon = styled.img.attrs(({ status }: Status) => ({
  src: (status === 0 && completed) || (status === 1 && pending) || failed,
}))<Status>`
  animation: ${({ status }) => status === 1 && css`2s ${rotate} linear infinite`};
`

const FabItem = ({ status }: Status) => {
  const [hint, setHint] = useState('')
  const handleHint = (e: any) => {
    if (e.type === 'mouseenter') {
      if (status === 0) setHint('View completed swaps')
      else if (status === 1) setHint('View pending swaps')
      else setHint('View failed swaps')
    }
    if (e.type === 'mouseleave') {
      setHint('')
    }
  }

  return (
    <Wrapper onMouseEnter={handleHint} onMouseLeave={handleHint}>
      {hint && <Hint status={status}>{hint}</Hint>}
      {!hint && <Icon status={status} />}
    </Wrapper>
  )
}

export default FabItem
