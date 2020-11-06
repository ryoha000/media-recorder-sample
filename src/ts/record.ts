import { download } from './utils'

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
  const downloadWebM = () => {
    const videloBlob = new Blob(chunks, { type: 'webm' })
    download(videloBlob)
  }
  return { startRecord, downloadWebM }
}

export default useRecord
