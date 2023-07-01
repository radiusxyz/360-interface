// import {  } from 'lib/hooks/multicall'

import { useMemo } from 'react'

// import isZero from '../utils/isZero'
// import { useENSResolverContract } from './useContract'

/**
 * Does a lookup for an ENS name to find its address.
 */
export default function useENSAddress(ensName?: string | null): { loading: boolean; address: string | null } {
  console.log('useENSAddress')

  // const resolverAddress = useSingleCallResult(undefined, 'resolver')
  // const resolverAddressResult = resolverAddress.result?.[0]

  // const addr = useSingleCallResult(undefined, 'addr'))
  return useMemo(() => {
    return { loading: true, address: 'string' }
  }, [])
}
