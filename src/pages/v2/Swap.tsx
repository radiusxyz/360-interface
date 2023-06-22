import styled from 'styled-components/macro'

import RightSection from '../../components/v2/RightSection/RightSection'
import LeftSection from '../../components/v2/LeftSection/LeftSection'
import SwapProvider from '../../store/SwapProvider'

const Wrapper = styled.div`
  margin-top: 40px;
  display: flex;
  justify-content: center;
  align-items: start;
  height: auto;
  gap: 12px;
  width: 100%;
  height: 100%;
  @media (max-width: 634px) {
    flex-direction: column;
    align-items: center;
  }
`

export const Swap = () => {
  return (
    <SwapProvider>
      <Wrapper>
        <LeftSection />
        <RightSection />
      </Wrapper>
    </SwapProvider>
  )
}

export default Swap
