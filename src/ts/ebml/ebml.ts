import { EBMLElementDetailWithIsEnd, EBMLTag } from './types';
import { checkByteOrder } from '../utils'
import { getFloatArrayByNumber, getUintArrayByNumber } from '../typeArrayUtils';
import { getClusterSizeDatas } from './cluster'
import { getInsertCues } from './cues'


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


export const insertSheekAndCue = (prevArr: Uint8Array, data: EBMLElementDetailWithIsEnd[]) => {
  const clusters = data.filter(v => v.name === 'Cluster')
  const segment = data.find(v => v.name === 'Segment')
  if (!segment) {
    throw 'invalid EBML'
  }
  const seekSize = 0
  // TODO: seekheadを入れる
  let diffSize = seekSize
  const { datas: clusterSizeDatas, diff } = getClusterSizeDatas(data)
  diffSize += diff
  const cues = getInsertCues(data, seekSize, clusterSizeDatas)
  diffSize += cues.length
  const segmentSize = getSize(data[data.length - 1].dataEnd - segment.dataStart + seekSize)
  diffSize += segmentSize.length - 8

  const resUint8Array = new Uint8Array(prevArr.length + diffSize)
  let resIndex = 0
  for (let i = 0; i < prevArr.length; i ++) {
    const clusterIndex = clusters.findIndex(v => v.sizeStart === i)
    if (clusterIndex > -1) {
      clusterSizeDatas[clusterIndex].clusterSize.forEach(v => {
        resUint8Array[resIndex] = v
        resIndex++
      })
      continue
    }
    if (clusters.findIndex(v => v.sizeStart < i && i < v.sizeEnd) > -1) continue
    if (i === segment.sizeStart) {
      segmentSize.forEach(v => {
        resUint8Array[resIndex] = v
        resIndex++
      })
      continue
    }
    if (i > segment.sizeStart && i < segment.sizeEnd) continue
    if (i === data.find(v => v.name === 'Tracks' && v.isEnd)?.dataEnd) {
      
      cues.getNumberArray().forEach(v => {
        resUint8Array[resIndex] = v
        resIndex++
      })
    }
    resUint8Array[resIndex] = prevArr[i]
    resIndex++
  }
  return resUint8Array
}

export const getReplaceSize = (prevArr: Uint8Array, appendSize: number, ele: EBMLElementDetailWithIsEnd) => {
  let prevSize = ''
  for (let sizeIndex = ele.sizeStart; sizeIndex < ele.sizeEnd; sizeIndex++) {
    prevSize += prevArr[sizeIndex].toString(2).padStart(8, '0')
  }
  const newSize = parseInt(prevSize.replace('1', '0'), 2) + appendSize
  const size = getSize(newSize)
  return size
}

export const getSize = (dataLength: number) => {
  const sizeLength = checkByteOrder(dataLength, true)
  const sizeBase = (Array(sizeLength - 1).fill('0').join('') + '1').padEnd(8 * sizeLength, '0')
  const sizeStr = (parseInt(sizeBase, 2) + dataLength).toString(2).padStart(8 * sizeLength, '0')
  const size = new Uint8Array(sizeLength)
  for (let i = 0; i < sizeLength; i++) {
    size[i] = parseInt(sizeStr.slice(8 * i, 8 * (i + 1)), 2)
  }
  return size
}

export const getEBMLTagByUintValue = (tag: number[], data: number, isLittleEndian: boolean) => {
  const ebmlTag = new Uint8Array(tag)
  const ebmlValue = getUintArrayByNumber(data, isLittleEndian)
  const ebmlSize = getSize(ebmlValue.length)
  return new EBMLTag(ebmlTag, ebmlSize, ebmlValue)
}

export const getEBMLTagByFloatValue = (tag: number[], data: number, isLittleEndian: boolean) => {
  const ebmlTag = new Uint8Array(tag)
  const ebmlValue = getFloatArrayByNumber(data, isLittleEndian)
  const ebmlSize = getSize(ebmlValue.length)
  return new EBMLTag(ebmlTag, ebmlSize, ebmlValue)
}

export const getEBMLTagByEBMLTags = (tag: number[], data: EBMLTag[]) => {
  const ebmlTag = new Uint8Array(tag)
  const ebmlSize = getSize(data.map(v => v.length).reduce((acc, cur) => acc + cur))
  return new EBMLTag(ebmlTag, ebmlSize, data)
}
