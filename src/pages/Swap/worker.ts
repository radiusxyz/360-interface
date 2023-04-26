/* eslint-env worker */
// const self = globalThis// as unknown as DedicatedWorkerGlobalScope
const self = window.globalThis

console.log('raynear')

self.onmessage = async (e) => {
  console.log('raynear', e.data)
  const timeLockPuzzle = await import('wasm-time-lock-puzzle-zkp')

  const timeLockPuzzleData = await timeLockPuzzle.get_time_lock_puzzle_proof(
    e.data.timeLockPuzzleParam,
    e.data.timeLockPuzzleSnarkParam
  )
  self.postMessage({ target: 'timeLockPuzzle', timeLockPuzzleData })
}

console.log(self.onmessage)
export default self
