import { EBMLElementDetailWithIsEnd, CuePointData, EBMLTag } from './types'
import { getEBMLTagByEBMLTags, getEBMLTagByUintValue, getSize } from './ebml'
import { checkLittleEndian, getSecFromNanoSec } from '../utils'
// @ts-ignore
import ebmlBlock from 'ebml-block'
import { SimpleBlock } from 'ts-ebml'

export const insertCues = (prevArr: Uint8Array, data: EBMLElementDetailWithIsEnd[]) => {
  return new Promise<Uint8Array>((resolve, reject) => {
    console.log('run insertCues')
    const start = performance.now()
    const cues = getInsertCues(data)
  
    const segment = data.find(v => v.name === 'Segment')
    if (!segment) throw 'invalid EBML'
    // 桁上がりは考えない
    const segmentSize = getSize(data[data.length - 1].dataEnd - segment.dataStart + cues.length)
  
    const result = new Uint8Array(prevArr.length + cues.length)
    console.log(`start insert cues: ${(performance.now() - start) / 1000}s`)
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
      if (prevArrIndex === data.find(v => v.name === 'Tracks' && v.isEnd)?.dataEnd) {
        cues.getNumberArray().forEach(v => {
          result[resIndex] = v
          resIndex++
        })
      }
      result[resIndex] = prevArr[prevArrIndex]
      resIndex++
    }
    resolve(result)
  })
}

export const getInsertCues = (data: EBMLElementDetailWithIsEnd[]) => {
  let cueSize = 0
  let cues = getCues(data, cueSize)
  while (cueSize !== cues.length) {
    cueSize = cues.length
    cues = getCues(data, cueSize)
    console.log('cue reload')
  }
  return cues
}

const getCues = (data: EBMLElementDetailWithIsEnd[], cueSize: number) => {
  console.log('getCues')
  const cuePointDatas = getCuesData(data)
  console.log(cuePointDatas)
  const isLittleEndian = checkLittleEndian()

  const cuePoints: EBMLTag[] = []
  for (const cuePointData of cuePointDatas) {
    const cueTrack = getEBMLTagByUintValue([0xF7], cuePointData.cueTrack, isLittleEndian)
    const cueClusterPosition = getEBMLTagByUintValue([0xF1], cuePointData.cueClusterPosition + cueSize, isLittleEndian)
    const cueBlockNumber = getEBMLTagByUintValue([0x53, 0x78], cuePointData.cueBlockNumber, isLittleEndian)

    const cueTrackPositions = getEBMLTagByEBMLTags([0xB7], [cueTrack, cueClusterPosition, cueBlockNumber])
    const cueTime = getEBMLTagByUintValue([0xB3], cuePointData.cueTime, isLittleEndian)

    const cuePoint = getEBMLTagByEBMLTags([0xBB], [cueTime, cueTrackPositions])
    cuePoints.push(cuePoint)
  }

  const cues = getEBMLTagByEBMLTags([0x1C, 0x53, 0xBB, 0x6B], cuePoints)
  console.log('finish getCues')
  return cues
}

const getCuesData = (data: EBMLElementDetailWithIsEnd[]) => {
  console.log('getCuesData')
  const timeCodeScaleValue: number = data.find(v => v.name === 'TimecodeScale')?.value

  let time = 0
  let baseTimecode = 0
  let blockNumber = 0
  let clusterPosition = 0
  const cuePointDatas: CuePointData[] = []
  for (const tag of data) {
    if (tag.name == 'Cluster') {
      blockNumber = 0
      clusterPosition = tag.tagStart
    }
    if (tag.name === 'Timecode') {
      baseTimecode = tag.value ?? 0
    }
    if (tag.name === 'SimpleBlock') {
      blockNumber++

      const block: SimpleBlock = ebmlBlock(tag.data)
      const t = baseTimecode + block.timecode
      const sec = getSecFromNanoSec(t * timeCodeScaleValue)
      if (Math.floor(time) + 3 < Math.floor(sec)) {
        time = sec
        cuePointDatas.push({
          cueTime: t,
          cueTrack: block.trackNumber,
          cueClusterPosition: clusterPosition,
          cueBlockNumber: blockNumber
        })
      }
    }
  }
  return cuePointDatas
}
