// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactGA from 'react-ga4'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useAllTokenBalances } from 'state/wallet/hooks'
import styled from 'styled-components/macro'
import magnifier from '../../assets/images/magnifier.png'

import {
  useAllTokens,
  useATokens,
  useBTokens,
  useIsUserAddedToken,
  useSearchInactiveTokenLists,
  useToken,
} from '../../hooks/Tokens'
import { CloseIcon, ThemedText } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import ImportRow from './ImportRow'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import FrequentTokens from 'components/Search/FrequentTokens'

const ContentWrapper = styled(Column)`
  height: 581px;
  max-width: 500px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #ffffff;
  border: 1px solid #dde0ff;
  box-shadow: 0px 4px 21px rgba(90, 18, 61, 0.1);
  border-radius: 4px;
`

const Footer = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 20px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  background-color: ${({ theme }) => theme.bg1};
  border-top: 1px solid ${({ theme }) => theme.bg2};
`

export const Paddinger = styled.div`
  padding: 20px 20px 0px 20px;
  margin-bottom: 15px;
  width: 100%;
`

export const Wrapper = styled.div`
  display: flex;
  gap: 16px;
  width: 100%;
  height: 46px;
  align-items: center;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #dde0ff;
  border-radius: 2px;
`

export const Input = styled.input`
  display: block;
  border: none;
  background-color: transparent;
  width: 100%;
  height: 100%;
  outline: none;
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 134.84%;
  color: #595959;
`

export const Search = styled.div`
  display: flex;
  align-items: center;
  &:hover {
    cursor: pointer;
    transform: scale(1.1);
    transition: 0.3s all;
  }
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency | null) => void
  otherSelectedCurrency?: Currency | null
  aTokenAddress?: string | null
  bTokenAddress?: string | null
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  showManageView: () => void
  showImportView: () => void
  setImportToken: (token: Token) => void
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  aTokenAddress,
  bTokenAddress,
  onDismiss,
  isOpen,
  showManageView,
  showImportView,
  setImportToken,
}: CurrencySearchProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [allToken, setAllToken] = useState<{ [address: string]: Token }>({})

  const bTokens = useBTokens(aTokenAddress)
  const aTokens = useATokens(bTokenAddress)
  const allTokens = useAllTokens()

  // ALL TOKENS IS IMPORTANT
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

  const handleCurrencySelect = useCallback(
    (currency: Currency | null) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event) => {
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

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )

  return (
    <ContentWrapper>
      <Paddinger>
        <Wrapper>
          <Search>
            <img src={magnifier} width="14px" height="14px" alt="magnifier" />
          </Search>
          <Input
            placeholder="Which token would you like to swap?"
            autoFocus
            type="text"
            id="token-search-input"
            autoComplete="off"
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
        </Wrapper>
      </Paddinger>
      <FrequentTokens />
      <Separator />
      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokens?.length > 0 || filteredInactiveTokens?.length > 0 ? (
        <div style={{ flex: '1', width: '100%', alignItems: 'start', justifyContent: 'start' }}>
          <AutoSizer disableWidth style={{ display: 'flex', width: '100%', height: '100%', justifyContent: 'start' }}>
            {(height) => (
              <CurrencyList
                height={filteredSortedTokens.length * 80}
                currencies={disableNonToken ? filteredSortedTokens : filteredSortedTokensWithETH}
                otherListTokens={filteredInactiveTokens}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showImportView={showImportView}
                setImportToken={setImportToken}
                showCurrencyAmount={showCurrencyAmount}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <ThemedText.Main color={theme.text3} textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </ThemedText.Main>
        </Column>
      )}
    </ContentWrapper>
  )
}
