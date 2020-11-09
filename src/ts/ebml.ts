import { EBMLElementDetail, SimpleBlock } from 'ts-ebml';
// @ts-ignore
import ebmlBlock from 'ebml-block'

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

export const getDuration = (data: EBMLElementDetailWithIsEnd[]) => {
  // @ts-ignore
  const timeScale = data.find(v => v.name === 'TimestampScale')?.value
  if (typeof timeScale !== 'number' || !timeScale) {
    return 0
  }
  let duration = 0
  for (const tag of data) {
    if (tag.name === 'SimpleBlock') {
      // @ts-ignore
      const block: SimpleBlock = ebmlBlock(tag.data)
      duration += block.timecode * timeScale
    }
  }
  return duration
}
