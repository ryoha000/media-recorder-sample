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
    download(resultBlob)
    console.log(`get insertedSeekHeadEBML: ${(performance.now() - start) / 1000}s`)
    start = performance.now()
    console.log(insertedSeekHeadEBML)
    playVideoByBlob(ConfirmVideoID, resultBlob);
  }
  return { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration, playWebMWithSheekAndCue }
}

export default useRecord
