import { EBMLElementDetail } from 'ts-ebml'

export interface DurationInfo {
  info: EBMLElementDetailWithIsEnd
  timeCodeScale: EBMLElementDetailWithIsEnd
  duration: number
}

export class EBMLTag {
  tag: Uint8Array;
  size: Uint8Array
  data: EBMLTag[] | Uint8Array
  length: number
  constructor (tag: Uint8Array, size: Uint8Array, data: EBMLTag[] | Uint8Array) {
    this.tag = tag
    this.size = size
    this.data = data
    if (Array.isArray(data)) {
      if (data.length === 0) {
        this.length = tag.length + size.length
      } else {
        this.length = tag.length + size.length + data.map(v => v.length).reduce((acc, cur) => acc + cur)
      }
    } else {
      this.length = tag.length + size.length + data.length
    }
  }
  getNumberArray(): number[] {
    if (Array.isArray(this.data)) {
      if (this.data.length === 0) {
        return [...this.tag, ...this.size]
      } else {
        return [...this.tag, ...this.size, ...this.data.map(v => v.getNumberArray()).reduce((acc, cur) => [...acc, ...cur])]
      }
    } else {
      return [...this.tag, ...this.size, ...this.data]
    }
  }
}

export interface CuePointData {
  cueTime: number
  cueTrack: number
  cueClusterPosition: number
  cueBlockNumber: number
}

export interface IndefiniteLengthData {
  sizeStart: number
  correctSize: Uint8Array
}

export interface ClusterSizeData {
  cluster: EBMLElementDetailWithIsEnd
  clusterSize: Uint8Array
  clusterDiff: number
}

export interface SeekData {
  id: number
  position: number
}

export interface SpliceEBMLData {
  start: number
  deleteCount: number
  item: Uint8Array | number[]
}

export declare type EBMLElementDetailWithIsEnd = EBMLElementDetail & {
  isEnd?: boolean
  value?: number | string
  data?: Uint8Array
}
