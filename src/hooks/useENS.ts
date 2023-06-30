import { useMemo } from 'react'

/**
 * Given a name or address, does a lookup to resolve to an address and name
 * @param nameOrAddress ENS name or address
 */
export default function useENS(nameOrAddress?: string | null): {
  loading: boolean
  address: string | null
  name: string | null
} {
  console.log('useEns outside useeffect')

  return useMemo(() => {
    return {
      loading: true,
      address: '1',
      name: '2',
    }
  }, [])
}
