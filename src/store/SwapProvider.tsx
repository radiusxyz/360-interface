import { useState, ReactNode } from 'react'
import SwapContext from './swap-context'

type swapProps = {
  start: boolean
  confirm?: boolean
}

const SwapProvider = ({ children }: { children: ReactNode }) => {
  const [isASelected, setIsASelected] = useState(false)
  const [isBSelected, setIsBSelected] = useState(false)
  const [isAActive, setIsAActive] = useState(false)
  const [isBActive, setIsBActive] = useState(false)
  const [leftSection, setLeftSection] = useState('welcome')
  const [swapParams, setSwapParams] = useState<any>({ start: false })

  const handleSetIsASelected = (value: boolean) => {
    setIsASelected(value)
  }
  const handleSetIsBSelected = (value: boolean) => {
    setIsBSelected(value)
  }
  const handleSetIsAActive = (value: boolean) => {
    setIsAActive(value)
  }
  const handleSetIsBActive = (value: boolean) => {
    setIsBActive(value)
  }

  const handleLeftSection = (value: string) => {
    setLeftSection(value)
  }

  const handleSwapParams = (value: any) => {
    setSwapParams(value)
  }
  const updateSwapParams = (value: any) => {
    setSwapParams({ ...swapParams, ...value })
  }

  const swapContext = {
    isASelected,
    handleSetIsASelected,
    isBSelected,
    handleSetIsBSelected,
    isAActive,
    handleSetIsAActive,
    isBActive,
    handleSetIsBActive,
    leftSection,
    handleLeftSection,
    swapParams,
    handleSwapParams,
    updateSwapParams,
  }

  return <SwapContext.Provider value={swapContext}>{children}</SwapContext.Provider>
}

export default SwapProvider
