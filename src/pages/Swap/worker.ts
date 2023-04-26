/* eslint-env worker */
const self = globalThis as unknown as DedicatedWorkerGlobalScope

self.addEventListener('message', async (e) => {
  const timeLockPuzzle = await import('wasm-time-lock-puzzle-zkp')

  const timeLockPuzzleData = await timeLockPuzzle.get_time_lock_puzzle_proof(
    e.data.timeLockPuzzleParam,
    e.data.timeLockPuzzleSnarkParam
  )
  self.postMessage({ target: 'timeLockPuzzle', timeLockPuzzleData })
})

export default {} as any
