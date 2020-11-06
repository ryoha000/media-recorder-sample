import * as ebml from 'ts-ebml';
import { playVideoByBlob, setMessage } from './utils'
import { ConfirmVideoID } from './const'
import { getDisplayEBML } from './ebml'

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
  const playInitialWebM = () => {
    const videloBlob = new Blob(chunks, { type: 'webm' })
    playVideoByBlob(ConfirmVideoID, videloBlob)
  }
  const setMetadata = async () => {
    const videloBlob = new Blob(chunks, { type: 'webm' })
    const buf = await videloBlob.arrayBuffer()
    const ebmlElms = decoder.decode(buf);
    setMessage(getDisplayEBML(ebmlElms))
  }
  return { startRecord, playInitialWebM, setMetadata }
}

export default useRecord
