import { EBMLElementDetail } from 'ts-ebml'

interface SimpleBlock {
  disardable: boolean
  frames: Uint8Array
  invisible: boolean
  keyframe: boolean
  timecode: number
  trackNumber: number
}

declare type EBMLElementDetailWithIsEnd = EBMLElementDetail & {
  isEnd?: boolean
  value?: number | string
  data?: Uint8Array
}

declare module 'ebml-block' {
  export default class EBMLBlock {
    
  }
}
