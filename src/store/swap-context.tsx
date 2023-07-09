import React from 'react'

const SwapContext = React.createContext<any>({
  isASelected: false,
  isBSelected: false,
  isAActive: false,
  isBActive: false,
  leftSection: 'welcome',
  swapParams: {},

  handleSetIsASelected: (value: boolean) => {
    return
  },
  handleSetIsBSelected: (value: boolean) => {
    return
  },
  handleSetIsAActive: (value: boolean) => {
    return
  },
  handleSetIsBActive: (value: boolean) => {
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
