import React from 'react'

const SwapContext = React.createContext<any>({
  isAtokenSelected: false,
  isBtokenSelected: false,
  isAtokenSelectionActive: false,
  isBtokenSelectionActive: false,
  leftSection: 'welcome',
  swapParams: {},

  handleSetIsAtokenSelected: () => {
    return
  },
  handleSetIsBtokenSelected: () => {
    return
  },
  handleSetIsAtokenSelectionActive: (value: boolean) => {
    return
  },
  handleSetIsBtokenSelectionActive: (value: boolean) => {
    return
  },
  handleLeftSection: (target: string) => {
    return
  },
  handleSwapParams: (target: any) => {
    return
  },
  updateSwapParams: (target: any) => {
    return
  },
})

export default SwapContext
