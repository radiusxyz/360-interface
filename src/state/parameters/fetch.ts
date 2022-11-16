import localForage from 'localforage'

import { VdfParam } from './reducer'

export async function fetchVdfParam(callback: (res: boolean) => void): Promise<VdfParam> {
  return await fetch('/parameters/vdf_zkp_parameter.data.bin', {
    method: 'GET',
  })
    .then((res) => res.json())
    .then((res) => {
      localForage.setItem('vdf_param', res)
      callback(true)
      return res
    })
}

export async function fetchVdfSnarkParam(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/vdf_zkp_snark_parameter.data.bin', {
    method: 'GET',
  }).then(async (res) => {
    const bytes = await res.arrayBuffer()
    const uint8bytes = new Uint8Array(bytes)
    const string = Buffer.from(uint8bytes).toString('hex')
    localForage.setItem('vdf_snark_param', string)
    callback(true)
    return string
  })
}

export async function fetchEncryptionParam(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/encryption_zkp_parameter.txt', {
    method: 'GET',
  }).then(async (res) => {
    const string = await res.text()
    localForage.setItem('encryption_param', string)
    callback(true)
    return string
  })
}

export async function fetchEncryptionProverKey(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/encryption_prover_key.txt', {
    method: 'GET',
  }).then(async (res) => {
    const string = await res.text()
    localForage.setItem('encryption_prover_key', string)
    callback(true)
    return string
  })
}

export async function fetchEncryptionVerifierData(callback: (res: boolean) => void): Promise<string> {
  return await fetch('/parameters/encryption_verifier_data.txt', {
    method: 'GET',
  }).then(async (res) => {
    const string = await res.text()
    console.log(string)
    localForage.setItem('encryption_verifier_data', string)
    callback(true)
    return string
  })
}
