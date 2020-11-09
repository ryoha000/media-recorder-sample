import * as ebml from 'ts-ebml';
import { playVideoByBlob, setMessage } from './utils'
import { ConfirmVideoID } from './const'
import { getDisplayEBML, getDuration } from './ebml'

const useRecord = () => {
  const chunks: Blob[] = []
  const decoder = new ebml.Decoder();

  const startRecord = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream)
    recorder.start(1000)
    recorder.ondataavailable = e => {
      console.log('blob size: ', e.data.size)
      chunks.push(e.data)
    }
  }
  const getNewChunks = () => chunks.concat()
  const playInitialWebM = () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    playVideoByBlob(ConfirmVideoID, videloBlob)
  }
  const playWebMWithBigDuration = () => {
    console.warn('a')
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    playVideoByBlob(ConfirmVideoID, videloBlob);
    (document.getElementById(ConfirmVideoID) as HTMLVideoElement).currentTime = Infinity
  }
  const getEBML = async () => {
    const videloBlob = new Blob(getNewChunks(), { type: 'webm' })
    const buf = await videloBlob.arrayBuffer()
    return decoder.decode(buf);
  }
  const displayEBML = async () => {
    const data = await getEBML()
    const str = getDisplayEBML(data)
    setMessage(str)
  }
  const playWebMWithDuration = async () => {
    const data = await getEBML()
    const duration = getDuration(data)
    alert(`duration is ${duration}`)
  }
  return { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration }
}

export default useRecord
