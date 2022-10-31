interface EncryptResponse {
  message_length: number
  cipher_text: string
  proof: string
  nonce: string
}

export async function poseidonEncrypt(
  param: string,
  proverKey: string,
  verifierData: string,
  s2_string: string,
  s2_field_hex: string,
  commitment: string,
  plainText: string
): Promise<EncryptResponse> {
  console.log(s2_string, commitment, plainText)
  const poseidon = await import('wasm-encryptor-zkp')
  const data = await poseidon
    .encrypt(param, proverKey, verifierData, s2_string, s2_field_hex, commitment, plainText)
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
