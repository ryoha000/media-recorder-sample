import { SimpleBlock } from 'ts-ebml';
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
  const timeScale = data.find(v => v.name === 'TimecodeScale')?.value
  if (typeof timeScale !== 'number' || !timeScale) {
    console.error('no time scale')
    return 0
  }
  let baseTimecode = 0
  let duration = 0
  for (const tag of data) {
    if (tag.name === 'Timecode') {
      baseTimecode = tag.value
    }
    if (tag.name === 'SimpleBlock') {
      // @ts-ignore
      const block: SimpleBlock = ebmlBlock(tag.data)
      const t = (baseTimecode + block.timecode) * timeScale
      if (duration < t) {
        duration = t
      }
    }
  }
  return duration / Math.pow(10, 9)
}
