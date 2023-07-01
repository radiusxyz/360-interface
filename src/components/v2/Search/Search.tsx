import FrequentTokens from './FrequentTokens'
import { tokens, Tokens } from '../../../assets/v2/data'
import { TableWrapper } from './SearchStyles'
import InputSearch from './InputSearch'

import { Currency, Token } from '@uniswap/sdk-core'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
// import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { useCallback, useContext, useEffect, useMemo, useRef, useState, KeyboardEvent, RefObject } from 'react'
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

// import CurrencyList from 'components/SearchModal/CurrencyList'

const Search = ({ onCurrencySelection }: any) => {
  const { INPUT, OUTPUT } = useSwapState()

  const swapCTX = useContext(SwapContext)
  const [tokensState, setTokensState] = useState(tokens)

  const handleTokensState = useCallback((handler: () => Tokens): void => {
    setTokensState(handler)
  }, [])

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
  const allTokens = useAllTokens()

  useEffect(() => {
    if (aTokenAddress) {
      setAllToken(bTokens)
    } else if (bTokenAddress) {
      setAllToken(aTokens)
    } else {
      setAllToken(allTokens)
    }
  }, [aTokenAddress, bTokenAddress, aTokens, bTokens, allTokens])

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

  const showImportView = () => {
    console.log('showImportView')
  }

  const setImportToken = () => {
    console.log('setImportToken')
  }

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
      <InputSearch
        searchQuery={searchQuery}
        inputRef={inputRef as RefObject<HTMLInputElement>}
        handleInput={handleInput}
        handleEnter={handleEnter}
      />
      <FrequentTokens />
      {/* <CurrencyList
        height={filteredSortedTokens.length * 80}
        currencies={filteredSortedTokens}
        otherListTokens={filteredInactiveTokens}
        onCurrencySelect={onCurrencySelect}
        otherCurrency={null}
        selectedCurrency={null}
        fixedListRef={fixedList}
        showImportView={showImportView}
        setImportToken={setImportToken}
        showCurrencyAmount={true}
      /> */}
      <Table
        currencies={filteredSortedTokens}
        otherListTokens={filteredInactiveTokens}
        onCurrencySelect={onCurrencySelection}
        otherCurrency={null}
        selectedCurrency={null}
        fixedListRef={fixedList}
        showImportView={showImportView}
        setImportToken={setImportToken}
        showCurrencyAmount={true}
      />
    </TableWrapper>
  )
}

export default Search
