import { KeyboardEvent, RefObject } from 'react'
import magnifier from '../../../assets/v2/images/magnifying_glass.png'

import { Input, Paddinger, SearchIcon, Wrapper } from './InputSearchStyles'

const InputSearch = ({
  searchQuery,
  inputRef,
  handleInput,
  handleEnter,
}: {
  searchQuery: string
  inputRef: RefObject<HTMLInputElement>
  handleInput: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleEnter: (e: KeyboardEvent<HTMLInputElement>) => void
}) => {
  return (
    <Paddinger>
      <Wrapper>
        <SearchIcon>
          <img src={magnifier} width="14px" height="14px" alt="magnifier" />
        </SearchIcon>
        <Input
          type="text"
          id="token-search-input"
          placeholder={`Which token would you like to swap?`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
          onKeyDown={handleEnter}
        />
      </Wrapper>
    </Paddinger>
  )
}

export default InputSearch
