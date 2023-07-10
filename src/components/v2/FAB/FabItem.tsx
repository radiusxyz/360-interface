import React, { useState } from 'react'
import styled, { css, keyframes } from 'styled-components/macro'
import completed from '../../../assets/v2/images/completed.svg'
import pending from '../../../assets/v2/images/pending.svg'
import failed from '../../../assets/v2/images/failed.svg'
import { NavLink } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, Status } from '../../../utils/db'

type StatusType = { status: number | undefined }

const Wrapper = styled.div`
  position: absolute;
  bottom: 200px;
  right: 200px;
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

const Hint = styled.p<StatusType>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  font-size: 16px;
  font-weight: 500;
  line-height: normal;
  color: ${({ status }) => (status === 1 && '#00b84a') || (status === 0 && '#6B11FF') || '#FF5C00'};
`

const Icon = styled.img.attrs(({ status }: StatusType) => ({
  src: (status === 1 && completed) || (status === 0 && pending) || failed,
}))<StatusType>`
  animation: ${({ status }) => status === 0 && css`2s ${rotate} linear infinite`};
`

const FabItem = () => {
  const tx = useLiveQuery(async () => {
    const tx = await db.getRecentSwap()

    if (!tx)
      return {
        status: 0,
        from: { amount: '0', decimal: '0', token: '' },
        to: { amount: '0', decimal: '0', token: '' },
      }
    return tx
  })

  const [hint, setHint] = useState('')
  const url = `/history/${tx?.status === Status.PENDING ? 'in-progress' : 'completed'}`

  const handleHint = (e: any) => {
    if (e.type === 'mouseenter') {
      if (tx?.status === Status.PENDING) setHint('View pending swaps')
      else if (tx?.status === Status.COMPLETED) setHint('View completed swaps')
      else setHint('View failed swaps')
    }
    if (e.type === 'mouseleave') {
      setHint('')
    }
  }

  return (
    <NavLink to={url}>
      <Wrapper onMouseEnter={handleHint} onMouseLeave={handleHint}>
        {hint && <Hint status={tx?.status}>{hint}</Hint>}
        {!hint && <Icon status={tx?.status} />}
      </Wrapper>
    </NavLink>
  )
}

export default FabItem
