import { TxInfo } from 'lib/hooks/swap/useSendSwapTransaction'

interface EncryptResponse {
  message_length: number
  cipher_text: string
  proof: string
  nonce: string
}
interface EncryptResponseWithTxId {
  message_length: number
  cipher_text: string
  proof: string
  nonce: string
  tx_id: string
}

export async function poseidonEncrypt(
  tx_info: TxInfo,
  s2_string: string,
  s2_field_hex: string,
  commitment: string,
  plainText: string
): Promise<EncryptResponseWithTxId> {
  const poseidon = await import('wasm-encryptor-zkp')
  const data = await poseidon
    .encrypt_threesixty_tx(tx_info, s2_string, s2_field_hex, commitment, plainText)
    .then((res) => {
      console.log(res)
      return res
    })
    .catch((error) => {
      console.error(error)
      return error
    })

  return data
}
