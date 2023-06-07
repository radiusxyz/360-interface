import React from 'react'

const SwapContext = React.createContext({
  leftSection: 'welcome',
  handleLeftSection: (leftSection: string): void => {
    console.log(leftSection)
  },
})

export default SwapContext
