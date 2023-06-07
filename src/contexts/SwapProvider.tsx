import { ReactNode, useState } from 'react'
import SwapContext from './swap-context'

type Props = {
  children: ReactNode
}

const SwapProvider = (props: Props) => {
  const [leftSection, setLeftSection] = useState('welcome')

  const handleLeftSection = (target: string) => {
    setLeftSection(target)
  }

  const swapContext = {
    leftSection,
    handleLeftSection,
  }

  return <SwapContext.Provider value={swapContext}>{props.children}</SwapContext.Provider>
}

export default SwapProvider
