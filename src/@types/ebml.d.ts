import { SimpleBlock } from "ts-ebml";

declare module 'ebml-block' {
  export default function EBMLBlock(data: Uint8Array): SimpleBlock {
    return
  }
}
