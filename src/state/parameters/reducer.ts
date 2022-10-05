import { createSlice } from '@reduxjs/toolkit'

export interface VdfParam {
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
  readonly vdfParam: boolean
  readonly vdfSnarkParam: boolean
  readonly encryptionParam: boolean
  readonly encryptionProverKey: boolean
  readonly encryptionVerifierData: boolean
}

const initialState: ParameterState = {
  vdfParam: false,
  vdfSnarkParam: false,
  encryptionParam: false,
  encryptionProverKey: false,
  encryptionVerifierData: false,
}

const parameterSlice = createSlice({
  name: 'parameters',
  initialState,
  reducers: {
    setVdfParam(state, action: { payload: { newParam: boolean } }) {
      state.vdfParam = action.payload.newParam
    },
    setVdfSnarkParam(state, action: { payload: { newParam: boolean } }) {
      state.vdfSnarkParam = action.payload.newParam
    },
    setEncryptionParam(state, action: { payload: { newParam: boolean } }) {
      state.encryptionParam = action.payload.newParam
    },
    setEncryptionProverKey(state, action: { payload: { newParam: boolean } }) {
      state.encryptionProverKey = action.payload.newParam
    },
    setEncryptionVerifierData(state, action: { payload: { newParam: boolean } }) {
      state.encryptionVerifierData = action.payload.newParam
    },
    setZkpParameters(state, action: { payload: { newParam: ParameterState } }) {
      state = action.payload.newParam
    },
  },
})

export const {
  setVdfParam,
  setVdfSnarkParam,
  setEncryptionParam,
  setEncryptionProverKey,
  setEncryptionVerifierData,
  setZkpParameters,
} = parameterSlice.actions
export default parameterSlice.reducer
