import { MessageTextAreaID } from './const'

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

export const playVideoByURL = (id: string, url: string) => {
  const element = document.getElementById(id)
  if (!element) {
    console.error(`${id} element not found`)
    return
  }
  (element as HTMLMediaElement).src = url
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

export const checkLittleEndian = () => {
  const arr = new Uint16Array([0x1122])
  const checkArr = new Uint8Array(arr.buffer)
  return checkArr[0] === 0x22
}

export const checkByteOrder = (byteLen: number, unsigned: boolean) => {
  const pow = unsigned ? 7 : 6
  for (let i = 1; i < 9; i++) {
    if (byteLen < Math.pow(2, i * pow)) {
      return i
    }
  }
  throw 'size length over 9'
}

export const getSecFromNanoSec = (t: number) => {
  return t / Math.pow(10, 9)
}
