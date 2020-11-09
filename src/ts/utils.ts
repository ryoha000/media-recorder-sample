import { MessageTextAreaID } from './const'
import { getDisplayEBML } from './ebml'

export const getMedia = async () => {
  return await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
}

export const playVideoByStream = (id: string, stream: MediaStream) => {
  const element = document.getElementById(id)
  if (!element) {
    console.error(`${id} element not found`)
    return
  }
  (element as HTMLMediaElement).srcObject = stream
}

export const playVideoByBlob = (id: string, blob: Blob) => {
  const element = document.getElementById(id)
  if (!element) {
    console.error(`${id} element not found`)
    return
  }
  (element as HTMLMediaElement).src = window.URL.createObjectURL(blob)
}

export const download = (blob: Blob) => {
  const blobURL = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.download = 'movie.webm'
  anchor.href = blobURL
  anchor.click()
  anchor.remove()
}

export const addClickFunction = (data: { id: string, func: () => void }[]) => {
  for (const d of data) {
    const element = document.getElementById(d.id)
    if (!element) {
      console.error(`#${d.id} is not found`)
      continue
    }
    element.addEventListener('click', d.func)
  }
}

export const setMessage = (text: string) => {
  const element = document.getElementById(MessageTextAreaID)
  if (!element) {
    console.error(`${MessageTextAreaID} element not found`)
    return
  }
  (element as HTMLInputElement).value = text
}
