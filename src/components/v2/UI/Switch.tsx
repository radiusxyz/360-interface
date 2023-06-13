import styled from 'styled-components/macro'

import React, { useState } from 'react'

const Wrapper = styled.div<{ on: string }>`
  background: ${(props) => (props.on === 'true' && '#6b11ff') || 'transparent'};
  border: 1px solid #dde0ff;
  border-radius: 31px;
  width: 70px;
  height: 32px;
  color: ${(props) => (props.on === 'true' && '#ffffff') || '#A3A3A3'};
  font-weight: 600;
  font-size: 14px;
  line-height: 144.52%;
  display: flex;
  justify-content: center;
  gap: 12px;
  align-items: center;
  padding: 6px;
  transition: all 1s ease;
`

const Circle = styled.div<{ on: string }>`
  border-radius: 50%;
  width: 18px;
  height: 18px;
  background: ${(props) => (props.on === 'true' && '#ffffff') || '#6b11ff'};
  transition: transform 0.8s ease; /* Add transition for transform property */
  transform: translateX(${(props) => (props.on === 'true' ? '0' : '-40px')});
`

const MovingSpan = styled.span<{ on: string }>`
  transition: transform 0.8s ease; /* Add transition for transform property */
  transform: translateX(${(props) => (props.on === 'true' ? '0px' : '27px')});
`

const Switch = () => {
  const [on, setOn] = useState('true')
  const handleSwitch = () => {
    setOn((on) => (on === 'true' ? 'false' : 'true'))
  }

  return (
    <Wrapper on={on}>
      <MovingSpan on={on}>{on === 'true' ? 'ON' : 'OFF'}</MovingSpan>
      <Circle onClick={handleSwitch} on={on} />
    </Wrapper>
  )
}

export default Switch
