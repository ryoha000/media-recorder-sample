import { EBMLElementDetailWithIsEnd, IndefiniteLengthData, SpliceEBMLData } from './types'
import { getSize, spliceEBML } from './ebml'

const IndefiniteSizeLength = 8

export const fixDataSize = async (prevArr: Uint8Array, data: EBMLElementDetailWithIsEnd[]) => {
  console.log('run fixDataSize')
  const indefiniteLengthData = getIndefiniteLengthData(data)

  console.log('start fixDataSize')
  return await spliceEBML(prevArr, indefiniteLengthData)
}

const getIndefiniteLengthData = (data: EBMLElementDetailWithIsEnd[]): SpliceEBMLData[] => {
  console.log('run getIndefiniteLengthData')
  let diff = 0
  const clusterDatas = data.filter(v => v.name === 'Cluster').map((v, i, arr) => {
    let correctSize: Uint8Array
    if (0 <= i && i < arr.length - 1) {
      correctSize = getSize(arr[i + 1].tagStart - v.dataStart)
    } else {
      correctSize = getSize(data[data.length - 1].dataEnd - v.dataStart)
    }
    diff += correctSize.length - IndefiniteSizeLength
    return { start: v.sizeStart, deleteCount: IndefiniteSizeLength , item: correctSize }
  })
  console.log('almost end getIndefiniteLengthData')
  const segment = data.find(v => v.name === 'Segment')
  if (!segment) throw 'invalid EBML'
  const segmentSize = getSize(data[data.length - 1].dataEnd - segment.dataStart + diff)
  diff += segmentSize.length - IndefiniteSizeLength
  const segmentData = { start: segment.sizeStart, deleteCount: IndefiniteSizeLength , item: segmentSize }
  return [segmentData, ...clusterDatas]
}
