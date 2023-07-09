import React, { useContext } from 'react'
import Search from '../../../components/v2/Search/Search'
import Preview from '../../../components/v2/Preview/Preview'
import AlmostThere from '../../../components/v2/AlmostThere/AlmostThere'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import SwapContext from 'store/swap-context'
import { CurvedProgress } from '../Progress/CurvedProgress'
import Instruction from '../Instruction/Instruction'

export const LeftSection = () => {
  const swapCTX = useContext(SwapContext)
  const { isASelected, isBSelected, leftSection } = swapCTX

  const { onCurrencySelection } = useSwapActionHandlers()
  const { typedValue } = useSwapState()

  return (
    <>
      {(leftSection === 'welcome' && (
        <Instruction isASelected={isASelected} isBSelected={isBSelected} typedValue={typedValue} />
      )) ||
        (leftSection === 'search-table' && <Search onCurrencySelection={onCurrencySelection} />) ||
        (leftSection === 'preview' && <Preview />) ||
        (leftSection === 'almost-there' && <AlmostThere />) ||
        (leftSection === 'progress' && <CurvedProgress percentage={0} />)}
    </>
  )
}

export default LeftSection
