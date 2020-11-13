import { DurationInfo, EBMLElementDetailWithIsEnd } from './types'
import { getEBMLTagByFloatValue, getReplaceSize } from './ebml'
import { checkLittleEndian } from '../utils'
// @ts-ignore
import ebmlBlock from 'ebml-block'
import { SimpleBlock } from 'ts-ebml'

const getDuration = (data: EBMLElementDetailWithIsEnd[]): DurationInfo => {
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

export const insertDuration = async (blob: Blob, data: EBMLElementDetailWithIsEnd[]) => {
  const buf = await blob.arrayBuffer()
  const prevArr = new Uint8Array(buf)
  const durationInfo = getDuration(data)

  const duration = getEBMLTagByFloatValue([0x44, 0x89], durationInfo.duration, checkLittleEndian())

  const resUint8Array = new Uint8Array(prevArr.length + duration.length)
  let resIndex = 0
  for (let i = 0; i < prevArr.length; i ++) {
    if (i === durationInfo.info.sizeStart) {
      const newArr = getReplaceSize(prevArr, duration.length, durationInfo.info)
      newArr.forEach(v => {
        resUint8Array[resIndex] = v
        resIndex++
      })
      continue
    }
    if (i > durationInfo.info.sizeStart && i < durationInfo.info.sizeEnd) continue
    // Duration は TimecodeScale の後ろに挿入
    if (i === durationInfo.timeCodeScale.dataEnd) {
      duration.getNumberArray().forEach(v => {
        resUint8Array[resIndex] = v
        resIndex++
      })
    }
    resUint8Array[resIndex] = prevArr[i]
    resIndex++
  }
  return resUint8Array
}
