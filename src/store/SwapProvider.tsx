import { useState, ReactNode } from 'react'
import SwapContext from './swap-context'

const SwapProvider = ({ children }: { children: ReactNode }) => {
  const [isAtokenSelected, setIsAtokenSelected] = useState(false)
  const [isBtokenSelected, setIsBtokenSelected] = useState(false)
  const [isAtokenSelectionActive, setIsAtokenSelectionActive] = useState(false)
  const [isBtokenSelectionActive, setIsBtokenSelectionActive] = useState(false)
  const [leftSection, setLeftSection] = useState('welcome')

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
  }

  return <SwapContext.Provider value={swapContext}>{children}</SwapContext.Provider>
}

export default SwapProvider
