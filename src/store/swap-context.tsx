import React from 'react'

const SwapContext = React.createContext({
  isAtokenSelected: false,
  isBtokenSelected: false,
  isAtokenSelectionActive: false,
  isBtokenSelectionActive: false,
  leftSection: 'welcome',

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
})

export default SwapContext
