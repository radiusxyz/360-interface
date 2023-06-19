import FrequentTokens from './FrequentTokens'
import { tokens, Tokens } from '../../../assets/v2/data'
import { TableWrapper } from './SearchStyles'
import InputSearch from './InputSearch'

import { Token } from '@uniswap/sdk-core'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
// import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { useEffect, useMemo, useRef, useState } from 'react'
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

import CurrencyList from 'components/SearchModal/CurrencyList'

const Search: React.FC = () => {
  const [tokensState, setTokensState] = useState(tokens)

  const handleTokensState = (handler: () => Tokens): void => {
    setTokensState(handler)
  }

  // const { chainId } = useActiveWeb3React()
  // const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [allToken, setAllToken] = useState<{ [address: string]: Token }>({})

  const aTokenAddress = ''
  const bTokenAddress = ''

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

  // const native = useNativeCurrency()

  // const filteredSortedTokensWithETH: Currency[] = useMemo(() => {
  //   if (!native) return filteredSortedTokens

  //   const s = debouncedQuery.toLowerCase().trim()
  //   if (native.symbol?.toLowerCase()?.indexOf(s) !== -1) {
  //     return native ? [native, ...filteredSortedTokens] : filteredSortedTokens
  //   }
  //   return filteredSortedTokens
  // }, [debouncedQuery, native, filteredSortedTokens])

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )

  const onCurrencySelect = () => {
    console.log('onCurrencySelect')
  }

  const showImportView = () => {
    console.log('showImportView')
  }

  const setImportToken = () => {
    console.log('setImportToken')
  }

  return (
    <TableWrapper>
      <InputSearch handler={handleTokensState} />
      <FrequentTokens />
      <CurrencyList
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
      />
      {/* <Table tokens={tokensState} /> */}
    </TableWrapper>
  )
}

export default Search
