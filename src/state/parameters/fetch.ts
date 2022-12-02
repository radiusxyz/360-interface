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
