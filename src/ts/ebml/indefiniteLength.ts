import { EBMLElementDetailWithIsEnd, IndefiniteLengthData } from './types'
import { getSize } from './ebml'

const IndefiniteSizeLength = 8

export const fixDataSize = (prevArr: Uint8Array, data: EBMLElementDetailWithIsEnd[]) => {
  return new Promise<Uint8Array>((resolve) => {
    console.log('run fixDataSize')
    const indefiniteLengthData = getIndefiniteLengthData(data)
  
    const result = new Uint8Array(prevArr.length + indefiniteLengthData.diff)
    let resIndex = 0
    console.log('start fixDataSize')
    let start = 0
    for (const replacedata of indefiniteLengthData.datas) {
      const end = replacedata.sizeStart
      const sizeStartDiff = getSizeStartDiff(replacedata.sizeStart, indefiniteLengthData.datas)
      console.log(`sizeStartDiff: ${sizeStartDiff}`)
      for (let i = start; i < end; i++) {
        result[i] = prevArr[i + sizeStartDiff]
      }
      [...replacedata.correctSize].forEach((v, i) => {
        result[end + i] = v
      })
      start = end + replacedata.correctSize.length
    }
    for (let i = start; i < result.length; i++) {
      result[i] = prevArr[i + indefiniteLengthData.diff]
    }
    // for (let prevArrIndex = 0; prevArrIndex < prevArr.length; prevArrIndex ++) {
    //   const index = indefiniteLengthData.datas.findIndex(v => v.sizeStart === prevArrIndex)
    //   if (index > -1) {
    //     indefiniteLengthData.datas[index].correctSize.forEach(v => {
    //       result[resIndex] = v
    //       resIndex++
    //     })
    //     continue
    //   }
    //   if (indefiniteLengthData.datas.findIndex(v => v.sizeStart < prevArrIndex && prevArrIndex < v.sizeStart + IndefiniteSizeLength) > -1) {
    //     continue
    //   }
    //   result[resIndex] = prevArr[prevArrIndex]
    //   resIndex++
    // }
    resolve(result)
  })
}

const getIndefiniteLengthData = (data: EBMLElementDetailWithIsEnd[]): {
  datas: IndefiniteLengthData[]
  diff: number
} => {
  console.log('run getIndefiniteLengthData')
  let diff = 0
  const clusterDatas = data.filter(v => v.name === 'Cluster').map((v, i, arr) => {
    let correctSize: Uint8Array
    if (0 <= i && i < arr.length - 1) {
      correctSize = getSize(arr[i + 1].tagStart - v.dataStart)
    } else {
      correctSize = getSize(data[data.length - 1].dataEnd - v.dataStart)
    }
    const prevDiff = diff
    diff += correctSize.length - IndefiniteSizeLength
    return { sizeStart: v.sizeStart, correctSize }
  })
  console.log('almost end getIndefiniteLengthData')
  const segment = data.find(v => v.name === 'Segment')
  if (!segment) throw 'invalid EBML'
  const segmentSize = getSize(data[data.length - 1].dataEnd - segment.dataStart + diff)
  diff += segmentSize.length - IndefiniteSizeLength
  const segmentData = { sizeStart: segment.sizeStart, correctSize: segmentSize }
  return { datas: [segmentData, ...clusterDatas], diff }
}

const getSizeStartDiff = (sizeStart: number, datas: IndefiniteLengthData[]) => {
  // sizeStartでsortされてる前提
  const index = datas.findIndex(v => v.sizeStart === sizeStart)
  if (index === -1) {
    console.error('no data')
    return 0
  }
  let diff = 0
  for (let i = 0; i < index; i++) {
    diff += datas[i].correctSize.length - IndefiniteSizeLength
  }
  return diff
}