import { ClusterSizeData, EBMLElementDetailWithIsEnd, SeekData, EBMLTag } from './types'
import { getEBMLTagByEBMLTags, getEBMLTagByUintValue } from './ebml'
import { checkLittleEndian } from '../utils'

const getInsertSeekHead = (data: EBMLElementDetailWithIsEnd[], cuesSize: number) => {
  let seekSize = 0
  let seekHead = getSeekHead(data, seekSize)
  while (seekSize !== seekHead.length) {
    seekSize = seekHead.length
    seekHead = getSeekHead(data, seekSize)
  }
  return seekHead
}

const getSeekHead = (data: EBMLElementDetailWithIsEnd[], seekSize: number) => {
  const level1Tags = data.filter(v => v.level === 1 && !v.isEnd)
  const isLittleEndian = checkLittleEndian()

  const seekDatas: SeekData[] = level1Tags.map(v =>
    ({
      id: parseInt(v.EBML_ID, 16),
      position: v.tagStart + seekSize
    })
  )
  // 今はCuesが入っていないけど Tracks の後ろに入る
  const tracks = data.find(v => v.name === 'Tracks')
  if (!tracks) throw 'invalid EBML'
  seekDatas.push({
    id: 0x1C53BB6B,
    position: tracks.dataEnd + seekSize
  })

  const seeks: EBMLTag[] = []
  for (const seekData of seekDatas) {
    const seekID = getEBMLTagByUintValue([0x53, 0xAB], seekData.id, isLittleEndian)
    const seekPosition = getEBMLTagByUintValue([0x53, 0xAC], seekData.position, isLittleEndian)

    const seek = getEBMLTagByEBMLTags([0x4D, 0xBB], [seekID, seekPosition])
    seeks.push(seek)
  }

  const seekHead = getEBMLTagByEBMLTags([0x11, 0x4D, 0x9B, 0x74], seeks)
  return seekHead
}
