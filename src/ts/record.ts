import { playVideoByBlob, setMessage, download } from './utils'
import { ConfirmVideoID } from './const'
import { getDisplayEBML, getEBML } from './ebml/ebml'
import { insertDuration } from './ebml/duration'
import { fixDataSize } from './ebml/indefiniteLength'
import { insertCues } from './ebml/cues'
import { insertSeekHead } from './ebml/seekHead'

const useRecord = () => {
  const chunks: Blob[] = []
  
  const startRecord = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream)
    recorder.start(1000)
    recorder.ondataavailable = e => {
      chunks.push(e.data)
    }
  }
  const getNewChunks = () => {
    const res: Blob[] = []
    for (const blob of chunks) {
      res.push(new Blob([blob], {type: blob.type}))
    }
    return res
  }
  const playInitialWebM = () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    playVideoByBlob(ConfirmVideoID, videloBlob)
  }
  const playWebMWithBigDuration = () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    playVideoByBlob(ConfirmVideoID, videloBlob);
    (document.getElementById(ConfirmVideoID) as HTMLVideoElement).currentTime = Infinity
  }
  const displayEBML = async () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const data = await getEBML(videloBlob)
    console.log(data)
    setMessage(getDisplayEBML(data))
  }
  const playWebMWithDuration = async () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const data = await getEBML(videloBlob)
    const resUintArray = await insertDuration(videloBlob, data)
    playVideoByBlob(ConfirmVideoID, new Blob([resUintArray], { type: 'webm' }));
  }
  const playWebMWithSheekAndCue = async () => {
    let start = performance.now()
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const initialEBML = await getEBML(videloBlob)
    console.log(`get initialEBML: ${(performance.now() - start) / 1000}s`)
    start = performance.now()

    const arrInsertedDuration = await insertDuration(videloBlob, initialEBML)
    console.log(`get arrInsertedDuration: ${(performance.now() - start) / 1000}s`)
    start = performance.now()
    const insertedDurationBlob = new Blob([arrInsertedDuration], { type: 'webm' })
    const insertedDurationEBML = await getEBML(insertedDurationBlob)
    console.log(`get insertedDurationEBML: ${(performance.now() - start) / 1000}s`)
    download(insertedDurationBlob)
    start = performance.now()

    const arrFixDataSize = await fixDataSize(arrInsertedDuration, insertedDurationEBML)
    console.log(`get arrFixDataSize: ${(performance.now() - start) / 1000}s`)
    start = performance.now()
    const fixDataSizeEBML = await getEBML(new Blob([arrFixDataSize], { type: 'webm' }))
    console.log(`get fixDataSizeEBML: ${(performance.now() - start) / 1000}s`)
    start = performance.now()

    const arrInstertedCues = await insertCues(arrFixDataSize, fixDataSizeEBML)
    console.log(`get arrInstertedCues: ${(performance.now() - start) / 1000}s`)
    start = performance.now()
    const insertedCuesEBML = await getEBML(new Blob([arrInstertedCues], { type: 'webm' }))
    console.log(`get insertedCuesEBML: ${(performance.now() - start) / 1000}s`)
    start = performance.now()

    const arrInstertedSeekHead = await insertSeekHead(arrInstertedCues, insertedCuesEBML)
    console.log(`get arrInstertedSeekHead: ${(performance.now() - start) / 1000}s`)
    start = performance.now()
    const resultBlob = new Blob([arrInstertedSeekHead], { type: 'webm' })
    const insertedSeekHeadEBML = await getEBML(resultBlob)
    checkSeekAndCues(resultBlob)
    download(resultBlob)
    console.log(`get insertedSeekHeadEBML: ${(performance.now() - start) / 1000}s`)
    start = performance.now()
    console.log(insertedSeekHeadEBML)
    playVideoByBlob(ConfirmVideoID, resultBlob);
  }
  return { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration, playWebMWithSheekAndCue }
}

import { Decoder } from 'ts-ebml'
import { EBMLElementDetailWithIsEnd } from './ebml/types';
// @ts-ignore
import ebmlBlock from 'ebml-block'
import { SimpleBlock } from 'ts-ebml'

const checkSeekAndCues = async (blob: Blob) => {
  const decoder = new Decoder();
  const buf = await blob.arrayBuffer()
  const ebml = (decoder.decode(buf) as EBMLElementDetailWithIsEnd[])
  // console.log(ebml)
  let seekData = { id: '', position: 0 }
  let cueData = { time: 0, clusterPosition: 0, blockNumber: 0 }

  const seeks: { id: string, position: number }[] = []
  const cues: { time: number, clusterPosition: number, blockNumber: number }[] = []
  for (const tag of ebml) {
    if (tag.name === 'SeekID') {
      seekData.id = [...(tag.data as Uint8Array)].map(v => v.toString(16)).reduce((acc, cur) => acc + cur)
    }
    if (tag.name === 'SeekPosition') {
      seekData.position = tag.value
    }
    if (tag.name === 'CueTime') {
      cueData.time = tag.value
    }
    if (tag.name === 'CueClusterPosition') {
      cueData.clusterPosition = tag.value
    }
    if (tag.name === 'CueBlockNumber') {
      cueData.blockNumber = tag.value
    }
    if (seekData.id !== '' && seekData.position !== 0) {
      seeks.push(seekData)
      seekData = { id: '', position: 0 }
    }
    if (cueData.time !== 0 && cueData.clusterPosition !== 0 && cueData.blockNumber !== 0) {
      cues.push(cueData)
      cueData = { time: 0, clusterPosition: 0, blockNumber: 0 }
    }
    if (tag.name === 'Cluster') {
      console.log('end get metadata')
      break
    }
  }
  console.log(seeks)
  console.log(cues)

  let blockNumber = 0
  let time = 0
  let baseTime = 0
  let clusterPosition = 0
  for (const tag of ebml) {
    if (tag.name === 'Cluster' && !tag.isEnd) {
      const prevClusterCues = cues.filter(v => v.clusterPosition === clusterPosition)
      if (prevClusterCues.length !== 0) {
        console.warn(`not exist in prevClusterPosition`)
        console.warn(prevClusterCues)
      }
      blockNumber = 0
      clusterPosition = tag.tagStart
    }
    if (tag.name === 'Timecode') {
      baseTime = tag.value ?? 0
    }
    if (tag.name === 'SimpleBlock') {
      blockNumber += 1
      const block: SimpleBlock = ebmlBlock(tag.data)
      time = baseTime + block.timecode
    }
    const seekIndex = seeks.findIndex(v => v.position === tag.tagStart)
    if (seekIndex > -1) {
      if (tag.EBML_ID === seeks[seekIndex].id) {
        console.log(`seek checked! tag: ${tag.EBML_ID}`)
        seeks.splice(seekIndex, 1)
      } else {
        console.warn(`SeekID is invalid (SeekPosition is valid). SeekID: ${seeks[seekIndex].id}, tag.EBML_ID: ${tag.EBML_ID}, SeekPosition: ${seeks[seekIndex].position}`)
      }
    }
    const cueIndex = cues.findIndex(v => v.clusterPosition === clusterPosition && v.blockNumber === blockNumber)
    if (cueIndex > -1) {
      if (time === cues[cueIndex].time) {
        console.log(`cue checked! time: ${time / 1000}s`)
        cues.splice(cueIndex, 1)
      } else {
        console.warn(`time is invalid. CueTime: ${cues[cueIndex].time}, time: ${time}`)
      }
    }
  }
}

export default useRecord
