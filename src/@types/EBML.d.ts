interface SimpleBlock {
  disardable: boolean
  frames: Uint8Array
  invisible: boolean
  keyframe: boolean
  timecode: number
  trackNumber: number
}

type EBMLElementDetailWithIsEnd = EBMLElementDetail & {
  isEnd?: boolean
}

declare module 'ebml-block' {

}
