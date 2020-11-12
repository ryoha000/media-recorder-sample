export const getUintArrayByNumber = (uint: number, isLittleEndian: boolean) => {
  let res: Uint8Array = new Uint8Array([0])
  // Uint32に収まらない者は考えない
  if (uint < Math.pow(2, 8)) {
    res = new Uint8Array([uint])
  }
  if (uint < Math.pow(2, 16)) {
    const uint16 = new Uint16Array([uint])
    res = new Uint8Array(uint16.buffer)
  }
  if (uint < Math.pow(2, 32)) {
    const uint32 = new Uint32Array([uint])
    res = new Uint8Array(uint32.buffer)
  }
  if (isLittleEndian) {
    res.reverse()
  }
  return res
}

export const getFloatArrayByNumber = (float: number, isLittleEndian: boolean) => {
  let floatArray: Float32Array | Float64Array
  // Float64に収まらないのは考えない
  if (float < 3.4 * Math.pow(10, 38)) {
    floatArray = new Float32Array([float])
  } else {
    floatArray = new Float64Array([float])
  }
  const res = new Uint8Array(floatArray.buffer)
  if (isLittleEndian) {
    res.reverse()
  }
  return res
}
