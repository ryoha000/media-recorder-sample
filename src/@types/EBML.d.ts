import { EBMLElementDetail } from 'ts-ebml'

declare type EBMLElementDetailWithIsEnd = EBMLElementDetail & {
  isEnd?: boolean
  value?: number | string
  data?: Uint8Array
}

declare module 'ebml-block' {
  export default class EBMLBlock {
    
  }
}
