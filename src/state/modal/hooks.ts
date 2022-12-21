import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { ModalState, setCancel, setProgress, setReimbursement, setShowHistory } from './reducer'

export function useCancel(): number {
  return useAppSelector((state) => state.modal.readyTxIdForCancel)
}

export function useReimbursement(): number {
  return useAppSelector((state) => state.modal.historyTxIdForReimbursement)
}

export function useShowHistory(): boolean {
  return useAppSelector((state) => state.modal.showHistory)
}

export function useProgress(): number {
  return useAppSelector((state) => state.modal.progress)
}

export function useModal(): ModalState {
  return useAppSelector((state) => state.modal)
}

export function useCancelManager(): [number, (readyTxId: number) => void] {
  const dispatch = useAppDispatch()
  const cancel = useCancel()

  const updateCancel = useCallback(
    (readyTxId: number) => {
      dispatch(setCancel({ readyTxId }))
    },
    [dispatch]
  )

  return [cancel, updateCancel]
}

export function useReimbursementManager(): [number, (historyTxIdForReimbursement: number) => void] {
  const dispatch = useAppDispatch()
  const reimbursement = useReimbursement()

  const updateReimbursement = useCallback(
    (historyTxIdForReimbursement: number) => {
      dispatch(setReimbursement({ historyTxId: historyTxIdForReimbursement }))
    },
    [dispatch]
  )

  return [reimbursement, updateReimbursement]
}

export function useShowHistoryManager(): [boolean, (showHistory: boolean) => void] {
  const dispatch = useAppDispatch()
  const showHistory = useShowHistory()

  const updateShowHistory = useCallback(
    (showHistory: boolean) => {
      dispatch(setShowHistory({ showHistory }))
    },
    [dispatch]
  )

  return [showHistory, updateShowHistory]
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
