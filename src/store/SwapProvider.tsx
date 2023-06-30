import React, { useState, ReactNode } from 'react'
import SwapContext from './swap-context'

type swapProps = {
  start: boolean
  confirm?: boolean
}

const SwapProvider = ({ children }: { children: ReactNode }) => {
  const [isAtokenSelected, setIsAtokenSelected] = useState(false)
  const [isBtokenSelected, setIsBtokenSelected] = useState(false)
  const [isAtokenSelectionActive, setIsAtokenSelectionActive] = useState(false)
  const [isBtokenSelectionActive, setIsBtokenSelectionActive] = useState(false)
  const [leftSection, setLeftSection] = useState('welcome')
  const [swapParams, setSwapParams] = useState<any>({ start: false })

  const handleSetIsAtokenSelected = () => {
    setIsAtokenSelected(true)
  }
  const handleSetIsBtokenSelected = () => {
    setIsBtokenSelected(true)
  }
  const handleSetIsAtokenSelectionActive = (value: boolean) => {
    setIsAtokenSelectionActive(value)
  }
  const handleSetIsBtokenSelectionActive = (value: boolean) => {
    setIsBtokenSelectionActive(value)
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
    isAtokenSelected,
    handleSetIsAtokenSelected,
    isBtokenSelected,
    handleSetIsBtokenSelected,
    isAtokenSelectionActive,
    handleSetIsAtokenSelectionActive,
    isBtokenSelectionActive,
    handleSetIsBtokenSelectionActive,
    leftSection,
    handleLeftSection,
    swapParams,
    handleSwapParams,
    updateSwapParams,
  }

  return <SwapContext.Provider value={swapContext}>{children}</SwapContext.Provider>
}

export default SwapProvider
