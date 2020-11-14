import { EBMLElementDetailWithIsEnd, SeekData, EBMLTag, SpliceEBMLData } from './types'
import { getEBMLTagByEBMLTags, getEBMLTagByUintValue, getSize, spliceEBML } from './ebml'
import { checkLittleEndian } from '../utils'
import { getUintArrayByNumber } from '../typeArrayUtils'

export const insertSeekHead = async (prevArr: Uint8Array, data: EBMLElementDetailWithIsEnd[]) => {
  console.log('run insertSeekHead')
  const seekHead = getInsertSeekHead(data)

  const segment = data.find(v => v.name === 'Segment')
  const info = data.find(v => v.name === 'Info')
  if (!segment || !info) throw 'invalid EBML'
  // 桁上がりは考えない
  const segmentSize = getSize(data[data.length - 1].dataEnd - segment.dataStart + seekHead.length)
  const cues = data.filter(v => v.name === 'CueClusterPosition')

  const spliceDatas: SpliceEBMLData[] = []
  spliceDatas.push({ start: segment.sizeStart, deleteCount: segment.sizeEnd - segment.sizeStart, item: segmentSize })
  spliceDatas.push({ start: info.tagStart, deleteCount: 0, item: seekHead.getNumberArray() })
  cues.map(v => {
    const prevValue = v.value
    const newVal = getUintArrayByNumber(prevValue + seekHead.length, checkLittleEndian())
    if (v.data.length !== newVal.length) {
      console.error('change size', v, prevValue, seekHead.length, newVal);
      return { start: v.dataStart, deleteCount: 0, item: [] }
    }
    return { start: v.dataStart, deleteCount: v.dataSize, item: newVal }
  }).forEach(v => spliceDatas.push(v))

  return await spliceEBML(prevArr, spliceDatas)
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
