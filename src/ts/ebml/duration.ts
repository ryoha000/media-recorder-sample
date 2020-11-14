import { DurationInfo, EBMLElementDetailWithIsEnd, SpliceEBMLData } from './types'
import { getEBMLTagByFloatValue, getReplaceSize, spliceEBML } from './ebml'
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
  const spliceData: SpliceEBMLData[] = []
  spliceData.push({
    start: durationInfo.info.sizeStart,
    deleteCount: durationInfo.info.sizeEnd - durationInfo.info.sizeEnd,
    item: getReplaceSize(prevArr, duration.length, durationInfo.info)
  })
  spliceData.push({ start: durationInfo.timeCodeScale.dataEnd, deleteCount: 0, item: duration.getNumberArray() })
  return await spliceEBML(prevArr, spliceData)
}
