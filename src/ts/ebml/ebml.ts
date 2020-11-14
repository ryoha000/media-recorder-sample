import { EBMLElementDetailWithIsEnd, EBMLTag } from './types';
import { checkByteOrder, checkLittleEndian } from '../utils'
import { getFloatArrayByNumber, getUintArrayByNumber } from '../typeArrayUtils';
import { Decoder } from 'ts-ebml'

export const getEBML = async (blob: Blob) => {
  const decoder = new Decoder();
  const buf = await blob.arrayBuffer()
  return (decoder.decode(buf) as EBMLElementDetailWithIsEnd[]);
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
  let ebmlSize: Uint8Array
  if (data.length === 0) {
    ebmlSize = new Uint8Array([0b10000000])
  } else {
    ebmlSize = getSize(data.map(v => v.length).reduce((acc, cur) => acc + cur))
  }
  return new EBMLTag(ebmlTag, ebmlSize, data)
}

export const readUint = (arr: Uint8Array) => {
  if (arr.length === 1) return arr[0]
  if (checkLittleEndian()) arr.reverse()
  if (arr.length === 2) {
    return (new Uint16Array(arr.buffer))[0]
  }
  if (arr.length === 3) {
    return (new Uint32Array(arr.buffer))[0]
  }
  return 0
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
