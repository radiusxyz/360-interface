import React from 'react'
import { useState } from 'react'
import Search from '../../../components/v2/Search/Search'
import Preview from '../../../components/v2/Preview/Preview'
import AlmostThere from '../../../components/v2/AlmostThere/AlmostThere'
import { useSwapActionHandlers } from 'state/swap/hooks'
import { FerrisWheel, GreetingMessage, Wrapper } from './LeftSectionStyles'

export const LeftSection = () => {
  const [leftSection, setLeftSection] = useState('search-table')
  const handleClickSelect = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLButtonElement

    if (target.textContent === 'Select Token') setLeftSection('search-table')
    if (target.textContent === 'Connect Wallet') setLeftSection('preview')
    if (target.textContent === '') setLeftSection('almost-there')
  }

  const { onCurrencySelection } = useSwapActionHandlers()

  return (
    <>
      {(leftSection === 'welcome' && (
        <Wrapper>
          <FerrisWheel />
          <GreetingMessage>Welcome to 360</GreetingMessage>
        </Wrapper>
      )) ||
        (leftSection === 'search-table' && <Search onCurrencySelection={onCurrencySelection} />) ||
        (leftSection === 'preview' && <Preview />) ||
        (leftSection === 'almost-there' && <AlmostThere />)}
    </>
  )
}

export default LeftSection
