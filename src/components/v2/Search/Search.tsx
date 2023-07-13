import FrequentTokens from './FrequentTokens'
import { TableWrapper } from './SearchStyles'
import magnifier from '../../../assets/v2/images/magnifying_glass.png'
import { Input, Paddinger, SearchIcon, Wrapper } from './InputSearchStyles'

import { Currency, Token } from '@uniswap/sdk-core'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { useCallback, useContext, useEffect, useMemo, useRef, useState, RefObject, KeyboardEvent } from 'react'
import ReactGA from 'react-ga4'
import { FixedSizeList } from 'react-window'
import { useAllTokenBalances } from 'state/wallet/hooks'

import {
  useAllTokens,
  useATokens,
  useBTokens,
  useIsUserAddedToken,
  useSearchInactiveTokenLists,
  useToken,
} from 'hooks/Tokens'
import { isAddress } from 'utils'
import Table from './Table'
import SwapContext from 'store/swap-context'
import { useSwapState } from 'state/swap/hooks'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'

const Search = ({ onCurrencySelection }: any) => {
  const { INPUT, OUTPUT } = useSwapState()

  const swapCTX = useContext(SwapContext)
  const { isAActive, isBActive } = swapCTX

  // const { chainId } = useActiveWeb3React()
  // const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [allToken, setAllToken] = useState<{ [address: string]: Token }>({})

  const aTokenAddress = INPUT.currencyId
  const bTokenAddress = OUTPUT.currencyId

  const bTokens = useBTokens(aTokenAddress)
  const aTokens = useATokens(bTokenAddress)
  const allTokensWithWELT = useAllTokens()

  const allTokens: {
    [address: string]: Token
  } = useMemo(
    () =>
      Object.keys(allTokensWithWELT).reduce((result, key) => {
        if (key !== '0x23E8B6A3f6891254988B84Da3738D2bfe5E703b9') return { ...result, [key]: allTokensWithWELT[key] }
        else return { ...result }
      }, {}),
    [allTokensWithWELT]
  )

  useEffect(() => {
    if (aTokenAddress && isAActive && bTokenAddress) {
      setAllToken(aTokens)
    } else if (aTokenAddress && isBActive && bTokenAddress) {
      setAllToken(bTokens)
    } else if (aTokenAddress && isBActive && !bTokenAddress) {
      setAllToken(bTokens)
    } else if (bTokenAddress && isAActive && !aTokenAddress) {
      setAllToken(aTokens)
    } else {
      setAllToken(allTokens)
    }
  }, [aTokenAddress, bTokenAddress, aTokens, bTokens, allTokens, isAActive, isBActive])

  // if they input an address, use it
  const isAddressSearch = isAddress(debouncedQuery)

  const searchToken = useToken(debouncedQuery)

  const searchTokenIsAdded = useIsUserAddedToken(searchToken)

  useEffect(() => {
    if (isAddressSearch) {
      ReactGA.event({
        category: 'Currency Select',
        action: 'Search by address',
        label: isAddressSearch,
      })
    }
  }, [isAddressSearch])

  const filteredTokens: Token[] = useMemo(() => {
    return Object.values(allToken).filter(getTokenFilter(debouncedQuery))
  }, [allToken, debouncedQuery])

  const balances = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator.bind(null, balances))
  }, [balances, filteredTokens])

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens)
  // console.log(filteredSortedTokens.map((item) => item.symbol))

  const native = useNativeCurrency()

  const filteredSortedTokensWithETH: Currency[] = useMemo(() => {
    if (!native) return filteredSortedTokens

    const s = debouncedQuery.toLowerCase().trim()
    if (native.symbol?.toLowerCase()?.indexOf(s) !== -1) {
      return native ? [native, ...filteredSortedTokens] : filteredSortedTokens
    }
    return filteredSortedTokens
  }, [debouncedQuery, native, filteredSortedTokens])

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency | null) => {
      onCurrencySelection(currency)
    },
    [onCurrencySelection]
  )

  const inputRef = useRef<HTMLInputElement>()

  const handleInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])
  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = debouncedQuery.toLowerCase().trim()
        if (s === native?.symbol?.toLowerCase()) {
          handleCurrencySelect(native)
        } else if (filteredSortedTokensWithETH.length > 0) {
          if (
            filteredSortedTokensWithETH[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
            filteredSortedTokensWithETH.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokensWithETH[0])
          }
        }
      }
    },
    [debouncedQuery, native, filteredSortedTokensWithETH, handleCurrencySelect]
  )

  return (
    <TableWrapper>
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
      <FrequentTokens
        currencies={filteredSortedTokens}
        onCurrencySelect={onCurrencySelection}
        selectedCurrency={null}
      />
      <Table
        currencies={filteredSortedTokens}
        otherListTokens={filteredInactiveTokens}
        onCurrencySelect={onCurrencySelection}
        otherCurrency={null}
        selectedCurrency={null}
        fixedListRef={fixedList}
        showCurrencyAmount={true}
      />
    </TableWrapper>
  )
}

export default Search
