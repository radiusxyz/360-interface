import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import {
  ParameterState,
  setEncryptionParam,
  setEncryptionProverKey,
  setEncryptionVerifierData,
  setVdfParam,
  setVdfSnarkParam,
  setZkpParameters,
} from './reducer'

export function useVdfParam(): boolean {
  return useAppSelector((state) => state.parameters.vdfParam)
}

export function useVdfSnarkParam(): boolean {
  return useAppSelector((state) => state.parameters.vdfSnarkParam)
}

export function useEncryptionParam(): boolean {
  return useAppSelector((state) => state.parameters.encryptionParam)
}

export function useEncryptionProverKey(): boolean {
  return useAppSelector((state) => state.parameters.encryptionProverKey)
}

export function useEncryptionVerifierData(): boolean {
  return useAppSelector((state) => state.parameters.encryptionVerifierData)
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

export function useEncryptionParamManager(): [boolean, (newParam: boolean) => void] {
  const dispatch = useAppDispatch()
  const encryptionParam = useEncryptionParam()

  const updateEncryptionParam = useCallback(
    (newParam: boolean) => {
      dispatch(setEncryptionParam({ newParam }))
    },
    [dispatch]
  )

  return [encryptionParam, updateEncryptionParam]
}

export function useEncryptionProverKeyManager(): [boolean, (newParam: boolean) => void] {
  const dispatch = useAppDispatch()
  const encryptionProverKey = useEncryptionProverKey()

  const updateEncryptionProverKey = useCallback(
    (newParam: boolean) => {
      dispatch(setEncryptionProverKey({ newParam }))
    },
    [dispatch]
  )

  return [encryptionProverKey, updateEncryptionProverKey]
}

export function useEncryptionVerifierDataManager(): [boolean, (newParam: boolean) => void] {
  const dispatch = useAppDispatch()
  const encryptionVerifierData = useEncryptionVerifierData()

  const updateEncryptionVerifierData = useCallback(
    (newParam: boolean) => {
      dispatch(setEncryptionVerifierData({ newParam }))
    },
    [dispatch]
  )
  return [encryptionVerifierData, updateEncryptionVerifierData]
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
