import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { ParameterState, setTimeLockPuzzleParam, setTimeLockPuzzleSnarkParam, setZkpParameters } from './reducer'

export function useTimeLockPuzzleParam(): boolean {
  return useAppSelector((state) => state.parameters.timeLockPuzzleParam)
}

export function useTimeLockPuzzleSnarkParam(): boolean {
  return useAppSelector((state) => state.parameters.timeLockPuzzleSnarkParam)
}

export function useParameters(): ParameterState {
  return useAppSelector((state) => state.parameters)
}

export function useTimeLockPuzzleParamManager(): [boolean, (newParam: boolean) => void] {
  const dispatch = useAppDispatch()
  const timeLockPuzzleParam = useTimeLockPuzzleParam()

  const updateTimeLockPuzzleParam = useCallback(
    (newParam: boolean) => {
      dispatch(setTimeLockPuzzleParam({ newParam }))
    },
    [dispatch]
  )

  return [timeLockPuzzleParam, updateTimeLockPuzzleParam]
}

export function useTimeLockPuzzleSnarkParamManager(): [boolean, (newParam: boolean) => void] {
  const dispatch = useAppDispatch()
  const timeLockPuzzleSnarkParam = useTimeLockPuzzleSnarkParam()

  const updateTimeLockPuzzleSnarkParam = useCallback(
    (newParam: boolean) => {
      dispatch(setTimeLockPuzzleSnarkParam({ newParam }))
    },
    [dispatch]
  )

  return [timeLockPuzzleSnarkParam, updateTimeLockPuzzleSnarkParam]
}

export function useParametersManager(): [ParameterState, (newParam: ParameterState) => void] {
  const dispatch = useAppDispatch()
  const parameters = useParameters()

  const updateParameters = useCallback(
    (newParam: ParameterState) => {
      dispatch(setZkpParameters({ newParam }))
    },
    [dispatch]
  )

  return [parameters, updateParameters]
}
