import localForage from 'localforage'

import { TimeLockPuzzleParam } from './reducer'

export async function fetchTimeLockPuzzleParam(callback: (res: boolean) => void): Promise<TimeLockPuzzleParam> {
  return await fetch('/parameters/time_lock_puzzle_zkp_parameter.data.bin', {
    method: 'GET',
  })
    .then((res) => res.json())
    .then((res) => {
      localForage.setItem('time_lock_puzzle_param', res)
      callback(true)
      return res
    })
}

export async function fetchTimeLockPuzzleSnarkParam(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/time_lock_puzzle_zkp_snark_parameter.data.bin', {
    method: 'GET',
  }).then(async (res) => {
    const bytes = await res.arrayBuffer()
    const uint8bytes = new Uint8Array(bytes)
    const string = Buffer.from(uint8bytes).toString('hex')
    localForage.setItem('time_lock_puzzle_snark_param', string)
    callback(true)
    return string
  })
}
