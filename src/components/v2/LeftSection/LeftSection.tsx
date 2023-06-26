import React, { useContext } from 'react'
import Search from '../../../components/v2/Search/Search'
import Preview from '../../../components/v2/Preview/Preview'
import AlmostThere from '../../../components/v2/AlmostThere/AlmostThere'
import { useSwapActionHandlers } from 'state/swap/hooks'
import { FerrisWheel, GreetingMessage, Wrapper } from './LeftSectionStyles'
import SwapContext from 'store/swap-context'

export const LeftSection = () => {
  const swapCTX = useContext(SwapContext)
  // const [leftSection, setLeftSection] = useState('welcome')

  // const handleDisplaySearchTable = () => {}

  // const handleClickSelect = (e: React.MouseEvent<HTMLElement>) => {
  //   const target = e.target as HTMLButtonElement

  //   if (target.textContent === 'Select Token') setLeftSection('search-table')
  //   if (target.textContent === 'Connect Wallet') setLeftSection('preview')
  //   if (target.textContent === '') setLeftSection('almost-there')
  // }

  const { onCurrencySelection } = useSwapActionHandlers()

  return (
    <>
      {(swapCTX.leftSection === 'welcome' && (
        <Wrapper>
          <FerrisWheel />
          <GreetingMessage>
            {(!swapCTX.isAtokenSelected && 'Select a token') ||
              (swapCTX.isAtokenSelected && !swapCTX.isBtokenSelected && 'Select another token') ||
              (swapCTX.isAtokenSelected && swapCTX.isBtokenSelected && 'Click swap')}
          </GreetingMessage>
        </Wrapper>
      )) ||
        (swapCTX.leftSection === 'search-table' && <Search onCurrencySelection={onCurrencySelection} />) ||
        (swapCTX.leftSection === 'preview' && <Preview />) ||
        (swapCTX.leftSection === 'almost-there' && <AlmostThere />)}
    </>
  )
}

export default LeftSection
