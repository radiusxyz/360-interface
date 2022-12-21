import { VdfParam } from 'state/parameters/reducer'

export interface VdfResponse {
  r1: string
  r3: string
  s1: string
  s3: string
  k: string
  vdf_snark_proof: string
  s2_string: string
  s2_field_hex: string
  commitment_hex: string
}

export async function getVdfProof(vdfParam: VdfParam, vdfSnarkParam: string): Promise<VdfResponse> {
  const vdf = await import('wasm-vdf-zkp')
  const data = await vdf
    .get_vdf_proof(vdfParam, vdfSnarkParam)
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
