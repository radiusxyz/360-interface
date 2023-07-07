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
  const { isAtokenSelected, isBtokenSelected, leftSection } = swapCTX
  // const [leftSection, setLeftSection] = useState('welcome')

  // const handleDisplaySearchTable = () => {}

  // const handleClickSelect = (e: React.MouseEvent<HTMLElement>) => {
  //   const target = e.target as HTMLButtonElement

  //   if (target.textContent === 'Select Token') setLeftSection('search-table')
  //   if (target.textContent === 'Connect Wallet') setLeftSection('preview')
  //   if (target.textContent === '') setLeftSection('almost-there')
  // }

  const { id } = swapCTX.swapParams

  const { onCurrencySelection } = useSwapActionHandlers()
  const { typedValue } = useSwapState()

  return (
    <>
      {(leftSection === 'welcome' && (
        <Instruction isAtokenSelected={isAtokenSelected} isBtokenSelected={isBtokenSelected} typedValue={typedValue} />
      )) ||
        (leftSection === 'search-table' && <Search onCurrencySelection={onCurrencySelection} />) ||
        (leftSection === 'preview' && <Preview />) ||
        (leftSection === 'almost-there' && <AlmostThere />) ||
        (leftSection === 'progress' && <CurvedProgress percentage={0} />)}
    </>
  )
}

export default LeftSection
