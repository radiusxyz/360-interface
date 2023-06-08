import React, { useState } from 'react'
import Table from './Table'
import FrequentTokens from './FrequentTokens'
import { tokens, Tokens } from '../../assets/data'
import { TableWrapper } from './SearchStyles'
import InputSearch from './InputSearch'

const Search: React.FC = () => {
  const [tokensState, setTokensState] = useState(tokens)

  const handleTokensState = (handler: () => Tokens): void => {
    setTokensState(handler)
  }

  return (
    <TableWrapper>
      <InputSearch handler={handleTokensState} />
      <FrequentTokens />
      <Table tokens={tokensState} />
    </TableWrapper>
  )
}

export default Search
