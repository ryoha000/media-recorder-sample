import { ClusterSizeData, EBMLElementDetailWithIsEnd } from './types'
import { getSize } from './ebml'

export const fixClusterSize = () => {
  
}
export const getClusterSizeDatas = (data: EBMLElementDetailWithIsEnd[]): {
  datas: ClusterSizeData[],
  diff: number
} => {
  let diff = 0
  return {
    datas: data.filter(v => v.name === 'Cluster').map((v, i, arr) => {
      let clusterSize: Uint8Array
      if (i === arr.length - 1) {
        clusterSize =  getSize(data[data.length - 1].dataEnd - v.dataStart)
      } else {
        clusterSize = getSize(arr[i + 1].tagStart - v.dataStart)
      }
      diff += clusterSize.length - 8
      return { cluster: v, clusterSize, clusterDiff: diff }
    }),
    diff
  }
}
