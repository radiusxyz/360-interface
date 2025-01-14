import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { ChainTokenMap, tokensToChainTokenMap } from 'lib/hooks/useTokenList/utils'
import { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from 'state/hooks'
import sortByListPriority from 'utils/listSort'

import BROKEN_LIST from '../../constants/tokenLists/broken.tokenlist.json'
import UNSUPPORTED_TOKEN_LIST from '../../constants/tokenLists/unsupported.tokenlist.json'
import { AppState } from '../index'
import { UNSUPPORTED_LIST_URLS } from './../../constants/lists'
export type TokenAddressMap = ChainTokenMap

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export function useAllLists(): AppState['lists']['byUrl'] {
  return useAppSelector((state) => state.lists.byUrl)
}

/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
export function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true
        return memo
      }, {})
  ).map((id) => parseInt(id))

  return chainIds.reduce<Mutable<TokenAddressMap>>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId],
    }
    return memo
  }, {}) as TokenAddressMap
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined): TokenAddressMap {
  const lists = useAllLists()
  return useMemo(() => {
    if (!urls) return {}
    const sorted = urls
      .slice()
      // sort by priority so top priority goes last
      .sort(sortByListPriority)
    const a = sorted.reduce((allTokens, currentUrl) => {
      let current = lists[currentUrl]?.current
      if (currentUrl === 'https://api.theradius.xyz/threesixty.tokenlist.json') {
        current = {
          name: '360',
          logoURI: 'https://ethereum-optimism.github.io/logos/optimism.svg',
          keywords: ['scaling', 'layer2', 'infrastructure'],
          timestamp: '2021-03-22T10:01:21.042+00:00',
          tokens: [
            {
              chainId: 420,
              address: '0xDadd1125B8Df98A66Abd5EB302C0d9Ca5A061dC2',
              name: 'USD Coin',
              symbol: 'USDC',
              decimals: 6,
              logoURI: 'https://ethereum-optimism.github.io/logos/USDC.svg',
              extensions: {
                optimismBridgeAddress: '0x22F24361D548e5FaAfb36d1437839f080363982B',
              },
            },
          ],
          version: {
            major: 4,
            minor: 2,
            patch: 0,
          },
        }
        // debugger
      }
      if (!current) return allTokens
      try {
        return combineMaps(allTokens, tokensToChainTokenMap(current))
      } catch (error) {
        console.error('Could not show token list due to error', error)
        return allTokens
      }
    }, {})

    return a
  }, [lists, urls])
}

// filter out unsupported lists
export function useActiveListUrls(): string[] | undefined {
  const activeListUrls = useAppSelector((state) => {
    return state.lists.activeListUrls
  })
  return useMemo(() => activeListUrls?.filter((url) => !UNSUPPORTED_LIST_URLS.includes(url)), [activeListUrls])
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists()
  const allActiveListUrls = useActiveListUrls()
  return useMemo(
    () => Object.keys(lists).filter((url) => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS.includes(url)),
    [lists, allActiveListUrls]
  )
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  const activeListUrls = useActiveListUrls()
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls)
  // debugger
  return activeTokens
}

export function useCombinedActiveAList(bTokenAddress: string | null | undefined): TokenAddressMap {
  const { chainId } = useActiveWeb3React()
  const activeListUrls = useActiveListUrls()
  const allTokens = useCombinedTokenMapFromUrls(activeListUrls)
  const [activeTokens, setActiveTokens] = useState({ chainId: {} })

  useEffect(() => {
    if (chainId && allTokens[chainId] && bTokenAddress)
      fetch(`${process.env.REACT_APP_360_OPERATOR}/token/availableSwapTokens?bTokenAddress=${bTokenAddress}`)
        .then((res) => {
          res.json().then((json) => {
            const tmpTokens: any = {}
            tmpTokens[chainId] = {}
            for (const token of json) {
              if (isInListNoCase(token, Object.keys(allTokens[chainId])))
                for (const findToken of Object.keys(allTokens[chainId])) {
                  if (token.toLowerCase() === findToken.toLowerCase())
                    tmpTokens[chainId][token] = allTokens[chainId][findToken]
                }
            }
            setActiveTokens(tmpTokens)
          })
        })
        .catch((e) => console.error(e))
  }, [chainId, bTokenAddress, activeListUrls, allTokens])

  // debugger
  return activeTokens
}

function isInListNoCase(val: string, list: string[]) {
  for (const a of list) {
    if (a.toLowerCase() === val.toLowerCase()) {
      return true
    }
  }
  return false
}

export function useCombinedActiveBList(aTokenAddress: string | null | undefined): TokenAddressMap {
  const { chainId } = useActiveWeb3React()
  const activeListUrls = useActiveListUrls()
  const allTokens = useCombinedTokenMapFromUrls(activeListUrls)
  const [activeTokens, setActiveTokens] = useState({ chainId: {} })

  useEffect(() => {
    if (chainId && allTokens[chainId] && aTokenAddress)
      fetch(`${process.env.REACT_APP_360_OPERATOR}/token/availableSwapTokens?aTokenAddress=${aTokenAddress}`)
        .then((res) => {
          res.json().then((json) => {
            const tmpTokens: any = {}
            tmpTokens[chainId] = {}
            for (const token of json) {
              if (isInListNoCase(token, Object.keys(allTokens[chainId])))
                for (const findToken of Object.keys(allTokens[chainId])) {
                  if (token.toLowerCase() === findToken.toLowerCase())
                    tmpTokens[chainId][token] = allTokens[chainId][findToken]
                }
            }
            setActiveTokens(tmpTokens)
          })
        })
        .catch((e) => console.error(e))
  }, [chainId, aTokenAddress, activeListUrls, allTokens])
  // debugger
  return activeTokens
}

// list of tokens not supported on interface for various reasons, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): TokenAddressMap {
  // get hard-coded broken tokens
  const brokenListMap = useMemo(() => tokensToChainTokenMap(BROKEN_LIST), [])

  // get hard-coded list of unsupported tokens
  const localUnsupportedListMap = useMemo(() => tokensToChainTokenMap(UNSUPPORTED_TOKEN_LIST), [])

  // get dynamic list of unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)

  // format into one token address map
  return useMemo(
    () => combineMaps(brokenListMap, combineMaps(localUnsupportedListMap, loadedUnsupportedListMap)),
    [brokenListMap, localUnsupportedListMap, loadedUnsupportedListMap]
  )
}
export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()
  return Boolean(activeListUrls?.includes(url))
}
