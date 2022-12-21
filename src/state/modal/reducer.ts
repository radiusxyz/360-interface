import { createSlice } from '@reduxjs/toolkit'

export interface ModalState {
  readonly readyTxIdForCancel: number
  readonly historyTxIdForReimbursement: number
  readonly progress: number
  readonly showHistory: boolean
}

const initialState: ModalState = {
  readyTxIdForCancel: 0,
  historyTxIdForReimbursement: 0,
  progress: 0,
  showHistory: false,
}

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    setCancel(state, action: { payload: { readyTxId: number } }) {
      state.readyTxIdForCancel = action.payload.readyTxId
    },
    setReimbursement(state, action: { payload: { historyTxId: number } }) {
      state.historyTxIdForReimbursement = action.payload.historyTxId
    },
    setProgress(state, action: { payload: { newParam: number } }) {
      state.progress = action.payload.newParam
    },
    setShowHistory(state, action: { payload: { showHistory: boolean } }) {
      state.showHistory = action.payload.showHistory
    },
  },
})

export const { setCancel, setReimbursement, setShowHistory, setProgress } = modalSlice.actions
export default modalSlice.reducer
