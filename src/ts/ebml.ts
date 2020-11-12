import { SimpleBlock } from 'ts-ebml';
// @ts-ignore
import ebmlBlock from 'ebml-block'
import { EBMLElementDetailWithIsEnd } from '../@types/EBML';
import { checkByteOrder, getSecFromNanoSec, checkLittleEndian } from './utils'
import { getFloatArrayByNumber, getUintArrayByNumber } from './typeArrayUtils';

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

class EBMLTag {
  tag: Uint8Array;
  size: Uint8Array
  data: EBMLTag[] | Uint8Array
  length: number
  constructor (tag: Uint8Array, size: Uint8Array, data: EBMLTag[] | Uint8Array) {
    this.tag = tag
    this.size = size
    this.data = data
    if (Array.isArray(data)) {
      this.length = tag.length + size.length + data.map(v => v.length).reduce((acc, cur) => acc + cur)
    } else {
      this.length = tag.length + size.length + data.length
    }
  }
  getNumberArray(): number[] {
    if (Array.isArray(this.data)) {
      return [...this.tag, ...this.size, ...this.data.map(v => v.getNumberArray()).reduce((acc, cur) => [...acc, ...cur])]
    } else {
      return [...this.tag, ...this.size, ...this.data]
    }
  }
}

interface CuePointData {
  cueTime: number
  cueTrack: number
  cueClusterPosition: number
  cueBlockNumber: number
}

const getInsertCues = (data: EBMLElementDetailWithIsEnd[], seekSize: number) => {
  const cuePointDatas = getCuesData(data)
  const isLittleEndian = checkLittleEndian()

  const cuePoints: EBMLTag[] = []
  console.log(cuePointDatas)
  for (const cuePointData of cuePointDatas) {
    const cueTrack = getEBMLTagByUintValue([0xF7], cuePointData.cueTrack, isLittleEndian)
    const cueClusterPosition = getEBMLTagByUintValue([0xF1], cuePointData.cueClusterPosition + seekSize, isLittleEndian)
    const cueBlockNumber = getEBMLTagByUintValue([0x53, 0x78], cuePointData.cueBlockNumber, isLittleEndian)

    const cueTrackPositions = getEBMLTagByEBMLTags([0xB7], [cueTrack, cueClusterPosition, cueBlockNumber])
    const cueTime = getEBMLTagByUintValue([0xB3], cuePointData.cueTime, isLittleEndian)

    const cuePoint = getEBMLTagByEBMLTags([0xBB], [cueTime, cueTrackPositions])
    cuePoints.push(cuePoint)
    break
  }

  const cues = getEBMLTagByEBMLTags([0x1C, 0x53, 0xBB, 0x6B], cuePoints)
  return cues
}

const getReplaceSize = (prevArr: Uint8Array, appendSize: number, ele: EBMLElementDetailWithIsEnd) => {
  let prevSize = ''
  for (let sizeIndex = ele.sizeStart; sizeIndex < ele.sizeEnd; sizeIndex++) {
    prevSize += prevArr[sizeIndex].toString(2).padStart(8, '0')
  }
  const newSize = parseInt(prevSize, 2) + appendSize
  const size = getSize(newSize)
  return size
}

const getSize = (dataLength: number) => {
  const sizeLength = checkByteOrder(dataLength, true)
  const sizeBase = (Array(sizeLength - 1).fill('0').join('') + '1').padEnd(8 * sizeLength, '0')
  const sizeStr = (parseInt(sizeBase, 2) + dataLength).toString(2).padStart(8 * sizeLength, '0')
  const size = new Uint8Array(sizeLength)
  for (let i = 0; i < sizeLength; i++) {
    size[i] = parseInt(sizeStr.slice(8 * i, 8 * (i + 1)), 2)
  }
  return size
}

const getCuesData = (data: EBMLElementDetailWithIsEnd[]) => {
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

const getEBMLTagByUintValue = (tag: number[], data: number, isLittleEndian: boolean) => {
  const ebmlTag = new Uint8Array(tag)
  const ebmlValue = getUintArrayByNumber(data, isLittleEndian)
  const ebmlSize = getSize(ebmlValue.length)
  return new EBMLTag(ebmlTag, ebmlSize, ebmlValue)
}

const getEBMLTagByFloatValue = (tag: number[], data: number, isLittleEndian: boolean) => {
  const ebmlTag = new Uint8Array(tag)
  const ebmlValue = getFloatArrayByNumber(data, isLittleEndian)
  const ebmlSize = getSize(ebmlValue.length)
  return new EBMLTag(ebmlTag, ebmlSize, ebmlValue)
}

const getEBMLTagByEBMLTags = (tag: number[], data: EBMLTag[]) => {
  const ebmlTag = new Uint8Array([0xB7])
  const ebmlSize = getSize(data.map(v => v.length).reduce((acc, cur) => acc + cur))
  return new EBMLTag(ebmlTag, ebmlSize, data)
}
