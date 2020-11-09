import * as ebml from 'ts-ebml';
import { playVideoByBlob, setMessage } from './utils'
import { ConfirmVideoID } from './const'
import { getDisplayEBML, getDuration } from './ebml'

const useRecord = () => {
  const chunks: Blob[] = []
  
  const startRecord = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream)
    recorder.start(1000)
    recorder.ondataavailable = e => {
      console.log('blob size: ', e.data.size)
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
  const getEBML = async () => {
    const decoder = new ebml.Decoder();
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const buf = await videloBlob.arrayBuffer()
    return decoder.decode(buf);
  }
  const displayEBML = async () => {
    const data = await getEBML()
    setMessage(getDisplayEBML(data))
  }
  const playWebMWithDuration = async () => {
    const data = await getEBML()
    const duration = getDuration(data)
    alert(`duration is ${duration}`)
  }
  return { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration }
}

export default useRecord
