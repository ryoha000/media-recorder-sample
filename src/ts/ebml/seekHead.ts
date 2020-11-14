import { EBMLElementDetailWithIsEnd, SeekData, EBMLTag } from './types'
import { getEBMLTagByEBMLTags, getEBMLTagByUintValue, getSize } from './ebml'
import { checkLittleEndian } from '../utils'
import { getUintArrayByNumber } from '../typeArrayUtils'

export const insertSeekHead = (prevArr: Uint8Array, data: EBMLElementDetailWithIsEnd[]) => {
  return new Promise<Uint8Array>((resolve) => {
    console.log('run insertSeekHead')
    const start = performance.now()
    const seekHead = getInsertSeekHead(data)
  
    const segment = data.find(v => v.name === 'Segment')
    if (!segment) throw 'invalid EBML'
    // 桁上がりは考えない
    const segmentSize = getSize(data[data.length - 1].dataEnd - segment.dataStart + seekHead.length)
    const cues = data.filter(v => v.name === 'CueClusterPosition')
  
    const result = new Uint8Array(prevArr.length + seekHead.length)
    console.log(`start insert seek: ${(performance.now() - start) / 1000}s`)
    let resIndex = 0
    for (let prevArrIndex = 0; prevArrIndex < prevArr.length; prevArrIndex ++) {
      if (prevArrIndex === segment.sizeStart) {
        segmentSize.forEach(v => {
          result[resIndex] = v
          resIndex++
        })
        continue
      }
      if (prevArrIndex > segment.sizeStart && prevArrIndex < segment.sizeEnd) continue
      if (prevArrIndex === data.find(v => v.name === 'Info' && !v.isEnd)?.tagStart) {
        seekHead.getNumberArray().forEach(v => {
          result[resIndex] = v
          resIndex++
        })
      }
      const cueDataStartIndex = cues.findIndex(v => v.dataStart === prevArrIndex)
      if (cueDataStartIndex > -1) {
        const prevValue = cues[cueDataStartIndex].value
        const newVal = getUintArrayByNumber(prevValue + seekHead.length, checkLittleEndian())
        if (cues[cueDataStartIndex].data.length !== newVal.length) {
          console.error('change size', cues[cueDataStartIndex], prevValue, seekHead.length, newVal);
          (cues[cueDataStartIndex].data as Uint8Array).forEach(v => {
            result[resIndex] = v
            resIndex++
          })
          continue
        }
        newVal.forEach(v => {
          result[resIndex] = v
          resIndex++
        })
        continue
      }
      if (cues.findIndex(v => v.dataStart < prevArrIndex && prevArrIndex < v.dataEnd) > -1) continue
      result[resIndex] = prevArr[prevArrIndex]
      resIndex++
    }
    resolve(result)
  })
}

const getInsertSeekHead = (data: EBMLElementDetailWithIsEnd[]) => {
  let seekSize = 0
  let seekHead = getSeekHead(data, seekSize)
  while (seekSize !== seekHead.length) {
    seekSize = seekHead.length
    seekHead = getSeekHead(data, seekSize)
    console.log('seek reload')
  }
  return seekHead
}

const getSeekHead = (data: EBMLElementDetailWithIsEnd[], seekSize: number) => {
  console.log('run getSeekHead')
  const ebmlTagEnd = data.find(v => v.name === 'EBML')?.dataEnd ?? 0
  const level1Tags = data.filter(v => v.level === 1 && !v.isEnd && v.tagStart >= ebmlTagEnd)
  const isLittleEndian = checkLittleEndian()

  console.log('getSeekData')
  const seekDatas: SeekData[] = level1Tags.map(v =>
    ({
      id: parseInt(v.EBML_ID, 16),
      position: v.tagStart + seekSize
    })
  )
  console.log('finish getSeekData')

  const seeks: EBMLTag[] = []
  for (const seekData of seekDatas) {
    const seekID = getEBMLTagByUintValue([0x53, 0xAB], seekData.id, isLittleEndian)
    const seekPosition = getEBMLTagByUintValue([0x53, 0xAC], seekData.position, isLittleEndian)

    const seek = getEBMLTagByEBMLTags([0x4D, 0xBB], [seekID, seekPosition])
    seeks.push(seek)
  }

  const seekHead = getEBMLTagByEBMLTags([0x11, 0x4D, 0x9B, 0x74], seeks)
  console.log('finish getSeekHead')
  return seekHead
}
