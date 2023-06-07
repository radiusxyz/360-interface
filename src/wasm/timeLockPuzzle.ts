import { TimeLockPuzzleParam } from 'state/parameters/reducer'

export interface TimeLockPuzzleResponse {
  r1: string
  r3: string
  s1: string
  s3: string
  k: string
  time_lock_puzzle_snark_proof: string
  s2_string: string
  s2_field_hex: string
  commitment_hex: string
}

export async function getTimeLockPuzzleProof(
  timeLockPuzzleParam: TimeLockPuzzleParam,
  timeLockPuzzleSnarkParam: string
): Promise<TimeLockPuzzleResponse> {
  const timeLockPuzzle = await import('wasm-time-lock-puzzle-zkp')
  const data = await timeLockPuzzle
    .get_time_lock_puzzle_proof(timeLockPuzzleParam, timeLockPuzzleSnarkParam)
    .then((res) => {
      //console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return data
}
