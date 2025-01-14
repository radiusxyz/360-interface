import styled from 'styled-components/macro'

import React, { useState, useEffect } from 'react'

const Wrapper = styled.div<{ on: boolean }>`
  background: ${(props) => (props.on && '#6b11ff') || 'transparent'};
  border: 1px solid #dde0ff;
  border-radius: 31px;
  width: 70px;
  height: 32px;
  color: ${(props) => (props.on && '#ffffff') || '#A3A3A3'};
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

const Circle = styled.div<{ on: boolean }>`
  border-radius: 50%;
  width: 18px;
  height: 18px;
  background: ${(props) => (props.on && '#ffffff') || '#6b11ff'};
  transition: transform 0.8s ease; /* Add transition for transform property */
  transform: translateX(${(props) => (props.on ? '0' : '-40px')});
`

const MovingSpan = styled.span<{ on: boolean }>`
  transition: transform 0.8s ease; /* Add transition for transform property */
  transform: translateX(${(props) => (props.on ? '0px' : '27px')});
`

const Switch = () => {
  const [backerIntegrity, setBackerIntegrity] = useState<boolean>(false)

  useEffect(() => {
    setBackerIntegrity(localStorage.getItem('backerIntegrity') === 'true' ? true : false)
  }, [])

  const handleSwitch = () => {
    localStorage.setItem('backerIntegrity', backerIntegrity ? 'false' : 'true')
    setBackerIntegrity(!backerIntegrity)
  }

  return (
    <Wrapper onClick={handleSwitch} on={backerIntegrity}>
      <MovingSpan on={backerIntegrity}>{backerIntegrity ? 'ON' : 'OFF'}</MovingSpan>
      <Circle on={backerIntegrity} />
    </Wrapper>
  )
}

export default Switch
