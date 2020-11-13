import { ClusterSizeData, EBMLElementDetailWithIsEnd, CuePointData, EBMLTag } from './types'
import { getEBMLTagByEBMLTags, getEBMLTagByUintValue } from './ebml'
import { checkLittleEndian, getSecFromNanoSec } from '../utils'
// @ts-ignore
import ebmlBlock from 'ebml-block'
import { SimpleBlock } from 'ts-ebml'

export const getInsertCues = (data: EBMLElementDetailWithIsEnd[], seekSize: number, clusterSizeDatas: ClusterSizeData[]) => {
  let diffSize = seekSize
  let cues = getCues(data, diffSize, clusterSizeDatas)
  while (diffSize !== seekSize + cues.length) {
    diffSize = seekSize + cues.length
    cues = getCues(data, diffSize, clusterSizeDatas)
  }
  return cues
}

const getCues = (data: EBMLElementDetailWithIsEnd[], diffSize: number, clusterSizeDatas: ClusterSizeData[]) => {
  const cuePointDatas = getCuesData(data, clusterSizeDatas)
  const isLittleEndian = checkLittleEndian()

  const cuePoints: EBMLTag[] = []
  for (const cuePointData of cuePointDatas) {
    const cueTrack = getEBMLTagByUintValue([0xF7], cuePointData.cueTrack, isLittleEndian)
    const cueClusterPosition = getEBMLTagByUintValue([0xF1], cuePointData.cueClusterPosition + diffSize, isLittleEndian)
    const cueBlockNumber = getEBMLTagByUintValue([0x53, 0x78], cuePointData.cueBlockNumber, isLittleEndian)

    const cueTrackPositions = getEBMLTagByEBMLTags([0xB7], [cueTrack, cueClusterPosition, cueBlockNumber])
    const cueTime = getEBMLTagByUintValue([0xB3], cuePointData.cueTime, isLittleEndian)

    const cuePoint = getEBMLTagByEBMLTags([0xBB], [cueTime, cueTrackPositions])
    cuePoints.push(cuePoint)
  }

  const cues = getEBMLTagByEBMLTags([0x1C, 0x53, 0xBB, 0x6B], cuePoints)
  return cues
}

const getCuesData = (data: EBMLElementDetailWithIsEnd[], clusterSizeDatas: ClusterSizeData[]) => {
  const timeCodeScaleValue: number = data.find(v => v.name === 'TimecodeScale')?.value

  let time = 0
  let baseTimecode = 0
  let blockNumber = 0
  let clusterPosition = 0
  const cuePointDatas: CuePointData[] = []
  for (const tag of data) {
    if (tag.name == 'Cluster') {
      blockNumber = 0
      const targetCluster = clusterSizeDatas.find(v => v.cluster.tagStart === tag.tagStart)
      if (!targetCluster) throw 'unhandled error: getClusterSizeDatas is bad in getCuesData'
      clusterPosition = tag.tagStart + targetCluster.clusterDiff
    }
    if (tag.name === 'Timecode') {
      baseTimecode = tag.value ?? 0
    }
    if (tag.name === 'SimpleBlock') {
      blockNumber++

      const block: SimpleBlock = ebmlBlock(tag.data)
      const t = baseTimecode + block.timecode
      const sec = getSecFromNanoSec(t * timeCodeScaleValue)
      if (Math.floor(time) < Math.floor(sec)) {
        cuePointDatas.push({
          cueTime: t,
          cueTrack: block.trackNumber,
          cueClusterPosition: clusterPosition,
          cueBlockNumber: blockNumber
        })
      }
      time = sec
    }
  }
  return cuePointDatas
}
