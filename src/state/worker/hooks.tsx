import { EncryptedSwapTx } from 'lib/hooks/swap/useSendSwapTransaction'

export function useWorker(e: MessageEvent<any>) {
  if (e.data.target === 'timeLockPuzzle') {
    updateSwapParams({ timeLockPuzzleDone: true, timeLockPuzzleData: { ...e.data.data } })
    isPuzzling.current = false
  }
  if (e.data.target === 'encryptor' && account && chainId && timeLockPuzzleData && signMessage) {
    const encryptData = e.data.data

    const encryptedPath = {
      message_length: encryptData.message_length,
      nonce: encryptData.nonce,
      commitment: timeLockPuzzleData.commitment_hex,
      cipher_text: [encryptData.cipher_text],
      r1: timeLockPuzzleData.r1,
      r3: timeLockPuzzleData.r3,
      s1: timeLockPuzzleData.s1,
      s3: timeLockPuzzleData.s3,
      k: timeLockPuzzleData.k,
      time_lock_puzzle_snark_proof: timeLockPuzzleData.time_lock_puzzle_snark_proof,
      encryption_proof: encryptData.proof,
    }

    const txHash = typedDataEncoder.hash(domain(chainId), { Swap: SWAP_TYPE }, signMessage)
    const mimcHash = '0x' + encryptData.tx_id

    const encryptedSwapTx: EncryptedSwapTx = {
      txOwner: account,
      functionSelector: swapExactTokensForTokens,
      amountIn: `${signMessage.amountIn}`,
      amountOut: `${signMessage.amountOut}`,
      path: encryptedPath,
      to: account,
      nonce: txNonce,
      backerIntegrity: signMessage.backerIntegrity,
      availableFrom: signMessage.availableFrom,
      deadline: signMessage.deadline,
      txHash,
      mimcHash,
    }

    updateSwapParams({ encryptorDone: true, txHash, mimcHash, encryptedSwapTx })

    isEncrypting.current = false
  }
}
