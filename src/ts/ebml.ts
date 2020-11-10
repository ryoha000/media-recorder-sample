import { SimpleBlock } from 'ts-ebml';
// @ts-ignore
import ebmlBlock from 'ebml-block'
import { EBMLElementDetailWithIsEnd } from '../@types/EBML';
import { isLittleEndian } from './utils'

export interface DurationInfo {
  info: EBMLElementDetailWithIsEnd
  timeCodeScale: EBMLElementDetailWithIsEnd
  duration: number
}

export const getDisplayEBML = (data: EBMLElementDetailWithIsEnd[]) => {
  let indent = 0
  let res = ''
  let isStartCluster = false

  for (const tag of data) {
    if (tag.isEnd === undefined) {
      res += `${new Array(indent).fill(' ').join('')}<${tag.name} />\n`
    }
    if (tag.isEnd === false) {
      if (tag.name === 'Cluster') {
        if (isStartCluster) {
          indent -= 2
          res += `${new Array(indent).fill(' ').join('')}</${tag.name}>\n`
        } else {
          isStartCluster = true
        }
      }
      res += `${new Array(indent).fill(' ').join('')}<${tag.name}>\n`
      indent += 2
    }
    if (tag.isEnd === true) {
      indent -= 2
      res += `${new Array(indent).fill(' ').join('')}</${tag.name}>\n`
    }
  }
  return res
}

export const getDuration = (data: EBMLElementDetailWithIsEnd[]): DurationInfo => {
  const timeCodeScale = data.find(v => v.name === 'TimecodeScale')
  const info = data.find(v => v.name === 'Info')

  if (!info || !timeCodeScale) {
    throw 'invalid EBML'
  }
  let duration = 0
  let baseTimecode = 0

  for (const tag of data) {
    if (tag.name === 'Timecode') {
      baseTimecode = tag.value ?? 0
    }
    if (tag.name === 'SimpleBlock') {
      const block: SimpleBlock = ebmlBlock(tag.data)
      const t = baseTimecode + block.timecode
      if (duration < t) {
        duration = t
      }
    }
  }
  return {
    info,
    timeCodeScale,
    duration
  }
}

export const insertDuration = async (blob: Blob, durationInfo: DurationInfo) => {
  const buf = await blob.arrayBuffer()
  const prevArr = new Uint8Array(buf)

  // https://www.matroska.org/technical/elements.html
  // https://en.wikipedia.org/wiki/Variable-length_quantity
  const durationTag = new Uint8Array([0x44, 0x89])
  const durationSize = new Uint8Array([0b10000000])
  let durationFloatValue: Float32Array | Float64Array
  // Float64に収まらないのは考えない
  if (durationInfo.duration < 3.4 * Math.pow(10, 38)) {
    durationFloatValue = new Float32Array([durationInfo.duration])
  } else {
    durationFloatValue = new Float64Array([durationInfo.duration])
  }
  durationSize[0] += durationFloatValue.BYTES_PER_ELEMENT
  const durationValue = new Uint8Array(durationFloatValue.buffer)
  // byte order が little endian のときはひっくり返す
  if (isLittleEndian()) {
    durationValue.reverse()
  }

  const appendSize = durationTag.length + durationSize.length + durationValue.length
  const resUint8Array = new Uint8Array(prevArr.length + appendSize)
  let resIndex = 0
  for (let i = 0; i < prevArr.length; i ++) {
    if (i === durationInfo.info.sizeStart) {
      const newArr = getNewSizeUintArray(prevArr, appendSize, durationInfo.info)
      newArr.forEach(v => {
        resUint8Array[resIndex] = v
        resIndex++
      })
      continue
    }
    if (i > durationInfo.info.sizeStart && i < durationInfo.info.sizeEnd) continue
    // Duration は TimecodeScale の後ろに挿入
    if (i === durationInfo.timeCodeScale.dataEnd) {
      [...durationTag, ...durationSize, ...durationValue].forEach(v => {
        resUint8Array[resIndex] = v
        resIndex++
      })
    }
    resUint8Array[resIndex] = prevArr[i]
    resIndex++
  }
  return resUint8Array
}

const getNewSizeUintArray = (prevArr: Uint8Array, appendSize: number, ele: EBMLElementDetailWithIsEnd) => {
  // TODO: 桁上がり
  let prevSize = ''
  for (let sizeIndex = ele.sizeStart; sizeIndex < ele.sizeEnd; sizeIndex++) {
    prevSize += prevArr[sizeIndex].toString(2).padStart(8, '0')
  }
  const newSize = parseInt(prevSize, 2) + appendSize

  const len = ele.sizeEnd - ele.sizeStart
  const res = new Uint8Array(len)
  const newSizeStr = newSize.toString(2)
  for (let i = 0; i < len; i++) {
    let ele = ''
    if (i !== 0) {
      ele = newSizeStr.slice(-8 * (i + 1), len + -8 * i)
    } else {
      ele = newSizeStr.slice(-8 * (i + 1))
    }
    res[len - i - 1] = parseInt(ele !== '' ? ele : '0', 2)
  }
  return res
}
