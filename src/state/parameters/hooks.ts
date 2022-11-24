import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { ParameterState, setProgress, setVdfParam, setVdfSnarkParam, setZkpParameters } from './reducer'

export function useVdfParam(): boolean {
  return useAppSelector((state) => state.parameters.vdfParam)
}

export function useVdfSnarkParam(): boolean {
  return useAppSelector((state) => state.parameters.vdfSnarkParam)
}

export function useProgress(): number {
  return useAppSelector((state) => state.parameters.progress)
}

export function useParameters(): ParameterState {
  return useAppSelector((state) => state.parameters)
}

export function useVdfParamManager(): [boolean, (newParam: boolean) => void] {
  const dispatch = useAppDispatch()
  const vdfParam = useVdfParam()

  const updateVdfParam = useCallback(
    (newParam: boolean) => {
      dispatch(setVdfParam({ newParam }))
    },
    [dispatch]
  )

  return [vdfParam, updateVdfParam]
}

export function useVdfSnarkParamManager(): [boolean, (newParam: boolean) => void] {
  const dispatch = useAppDispatch()
  const vdfSnarkParam = useVdfSnarkParam()

  const updateVdfSnarkParam = useCallback(
    (newParam: boolean) => {
      dispatch(setVdfSnarkParam({ newParam }))
    },
    [dispatch]
  )

  return [vdfSnarkParam, updateVdfSnarkParam]
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

export function useProgressManager(): [number, (newParam: number) => void] {
  const dispatch = useAppDispatch()
  const progress = useProgress()

  const updateProgress = useCallback(
    (newParam: number) => {
      dispatch(setProgress({ newParam }))
    },
    [dispatch]
  )

  return [progress, updateProgress]
}
