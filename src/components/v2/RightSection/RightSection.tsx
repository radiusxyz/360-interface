import { MainWrapper } from './RightSectionStyles'

// import { Contract } from '@ethersproject/contracts'
// import { _TypedDataEncoder as typedDataEncoder } from '@ethersproject/hash'

// import { domain, SWAP_TYPE } from 'constants/eip712'
// import useActiveWeb3React from 'hooks/useActiveWeb3React'
// import { useSwapCallback } from 'hooks/useSwapCallback'
// import useTransactionDeadline from 'hooks/useTransactionDeadline'
// import { useAppDispatch } from 'state/hooks'
// import { useParameters } from 'state/parameters/hooks'
// import localForage from 'localforage'
// import { useCallback, useEffect, useMemo, useRef } from 'react'
// import { fetchTimeLockPuzzleParam, fetchTimeLockPuzzleSnarkParam } from 'state/parameters/fetch'
// import { setTimeLockPuzzleParam, setTimeLockPuzzleSnarkParam, TimeLockPuzzleParam } from 'state/parameters/reducer'
// import Worker from 'worker-loader!workers/worker'

// import { ApprovalState, useApprovalOptimizedTrade, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
// import { useV2RouterContract } from 'hooks/useContract'
// import { useERC20PermitFromTrade } from 'hooks/useERC20Permit'
// import { TxInfo } from 'lib/hooks/swap/useSendSwapTransaction'
// import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo } from 'state/swap/hooks'

// import { useContext } from 'react'
// import SwapContext from 'store/swap-context'

// eslint-disable-next-line import/no-webpack-loader-syntax

export const RightSection = () => {
  console.log('RightSection')
  const trade = useDerivedSwapInfo()

  return <MainWrapper></MainWrapper>
}

export default RightSection
