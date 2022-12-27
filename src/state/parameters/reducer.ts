import { createSlice } from '@reduxjs/toolkit'

export interface TimeLockPuzzleParam {
  readonly t: number
  readonly g: string
  readonly g_two_t: string
  readonly g_two_t_plus_one: string
  readonly n: string
  readonly base: string
  readonly word_size: number
  readonly word_count: number
}

export interface ParameterState {
  readonly timeLockPuzzleParam: boolean
  readonly timeLockPuzzleSnarkParam: boolean
}

const initialState: ParameterState = {
  timeLockPuzzleParam: false,
  timeLockPuzzleSnarkParam: false,
}

const parameterSlice = createSlice({
  name: 'parameters',
  initialState,
  reducers: {
    setTimeLockPuzzleParam(state, action: { payload: { newParam: boolean } }) {
      state.timeLockPuzzleParam = action.payload.newParam
    },
    setTimeLockPuzzleSnarkParam(state, action: { payload: { newParam: boolean } }) {
      state.timeLockPuzzleSnarkParam = action.payload.newParam
    },
    setZkpParameters(state, action: { payload: { newParam: ParameterState } }) {
      state = action.payload.newParam
    },
  },
})

export const { setTimeLockPuzzleParam, setTimeLockPuzzleSnarkParam, setZkpParameters } = parameterSlice.actions
export default parameterSlice.reducer
