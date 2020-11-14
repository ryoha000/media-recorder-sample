import '../scss/style.scss';
import useRecord from './record'
import { getMedia, playVideoByStream, addClickFunction } from './utils'
import { MediaVideoID, ShowEBMLButtonID, PlayInitialVideoButtonID, PlayVideoWithBigDurationButton, PlayVideoWithDurationButton, PlayVideoWithSheekAndCueButton } from './const'

const setup = async () => {
  const stream = await getMedia()
  const { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration, playWebMWithSheekAndCue } = useRecord()
  startRecord(stream)
  playVideoByStream(MediaVideoID, stream)

  addClickFunction([
    { id: PlayInitialVideoButtonID, func: playInitialWebM },
    { id: ShowEBMLButtonID, func: displayEBML },
    { id: PlayVideoWithBigDurationButton, func: playWebMWithBigDuration },
    { id: PlayVideoWithDurationButton, func: playWebMWithDuration },
    { id: PlayVideoWithSheekAndCueButton, func: playWebMWithSheekAndCue },
  ])
}

setup()

// import { Decoder } from 'ts-ebml'
// import { EBMLElementDetailWithIsEnd } from './ebml/types';
// // @ts-ignore
// import ebmlBlock from 'ebml-block'
// import { SimpleBlock } from 'ts-ebml'

// const checkSeekAndCues = async (blob: Blob) => {
//   const decoder = new Decoder();
//   const buf = await blob.arrayBuffer()
//   const ebml = (decoder.decode(buf) as EBMLElementDetailWithIsEnd[])
//   console.log(ebml)
//   let seekData = { id: '', position: 0 }
//   let cueData = { time: 0, clusterPosition: 0, blockNumber: 0 }

//   const seeks: { id: string, position: number }[] = []
//   const cues: { time: number, clusterPosition: number, blockNumber: number }[] = []
//   for (const tag of ebml) {
//     if (tag.name === 'SeekID') {
//       seekData.id = [...(tag.data as Uint8Array)].map(v => v.toString(16)).reduce((acc, cur) => acc + cur)
//     }
//     if (tag.name === 'SeekPosition') {
//       seekData.position = tag.value
//     }
//     if (tag.name === 'CueTime') {
//       cueData.time = tag.value
//     }
//     if (tag.name === 'CueClusterPosition') {
//       cueData.clusterPosition = tag.value
//     }
//     if (tag.name === 'CueBlockNumber') {
//       cueData.blockNumber = tag.value
//     }
//     if (seekData.id !== '' && seekData.position !== 0) {
//       seeks.push(seekData)
//       seekData = { id: '', position: 0 }
//     }
//     if (cueData.time !== 0 && cueData.clusterPosition !== 0 && cueData.blockNumber !== 0) {
//       cues.push(cueData)
//       cueData = { time: 0, clusterPosition: 0, blockNumber: 0 }
//     }
//     if (tag.name === 'Cluster') {
//       console.log('end get metadata')
//       break
//     }
//   }
//   console.log(seeks)
//   console.log(cues)

//   let blockNumber = 0
//   let time = 0
//   let baseTime = 0
//   let clusterPosition = 0
//   for (const tag of ebml) {
//     if (tag.name === 'Cluster') {
//       const prevClusterCues = cues.filter(v => v.clusterPosition === clusterPosition)
//       if (prevClusterCues.length !== 0) {
//         console.warn(`not exist in prevClusterPosition`)
//         console.warn(prevClusterCues)
//       }
//       blockNumber = 0
//       clusterPosition = tag.tagStart
//     }
//     if (tag.name === 'Timecode') {
//       baseTime = tag.value ?? 0
//     }
//     if (tag.name === 'SimpleBlock') {
//       blockNumber += 1
//       const block: SimpleBlock = ebmlBlock(tag.data)
//       time = baseTime + block.timecode
//     }
//     const seekIndex = seeks.findIndex(v => v.position === tag.tagStart)
//     if (seekIndex > -1) {
//       if (tag.EBML_ID === seeks[seekIndex].id) {
//         console.log(`seek checked! tag: ${tag.EBML_ID}`)
//         seeks.splice(seekIndex, 1)
//       } else {
//         console.warn(`SeekID is invalid (SeekPosition is valid). SeekID: ${seeks[seekIndex].id}, tag.EBML_ID: ${tag.EBML_ID}, SeekPosition: ${seeks[seekIndex].position}`)
//       }
//     }
//     const cueIndex = cues.findIndex(v => v.clusterPosition === tag.tagStart && v.blockNumber === blockNumber)
//     if (cueIndex > -1) {
//       if (time === cues[cueIndex].time) {
//         console.log(`cue checked! time: ${time / 1000}s`)
//         cues.splice(cueIndex, 1)
//       } else {
//         console.warn(`time is invalid. CueTime: ${cues[cueIndex].time}, time: ${time}`)
//       }
//     }
//   }
// }

// fetch('/1hwithCue.webm').then(v => {
//   v.blob().then(a => {
//     checkSeekAndCues(a)
//   })
// })
