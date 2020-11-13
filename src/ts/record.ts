import * as ebml from 'ts-ebml';
import { playVideoByBlob, setMessage } from './utils'
import { ConfirmVideoID } from './const'
import { getDisplayEBML, insertSheekAndCue } from './ebml/ebml'
import { insertDuration } from './ebml/duration'
import { EBMLElementDetailWithIsEnd } from '../@types/EBML';

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
  const getEBML = async (blob: Blob) => {
    const decoder = new ebml.Decoder();
    const buf = await blob.arrayBuffer()
    return (decoder.decode(buf) as EBMLElementDetailWithIsEnd[]);
  }
  const displayEBML = async () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const data = await getEBML(videloBlob)
    setMessage(getDisplayEBML(data))
  }
  const playWebMWithDuration = async () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const data = await getEBML(videloBlob)
    const resUintArray = await insertDuration(videloBlob, data)
    playVideoByBlob(ConfirmVideoID, new Blob([resUintArray], { type: 'webm' }));
  }
  const playWebMWithSheekAndCue = async () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const initialEBML = await getEBML(videloBlob)

    const arrInsertedDuration = await insertDuration(videloBlob, initialEBML)
    const insertedDurationEBML = await getEBML(new Blob([arrInsertedDuration], { type: 'webm' }))

    const result = insertSheekAndCue(arrInsertedDuration, insertedDurationEBML)
    console.log(await getEBML(new Blob([result], { type: 'webm' })))
    playVideoByBlob(ConfirmVideoID, new Blob([result], { type: 'webm' }));
  }
  return { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration, playWebMWithSheekAndCue }
}

export default useRecord
