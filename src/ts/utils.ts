export const getMedia = async () => {
  return await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
}

export const startVideo = (stream: MediaStream) => {
  const element = document.getElementById('video')
  if (!element) {
    console.error('video element not found')
    return
  }
  (element as HTMLMediaElement).srcObject = stream
}

export const download = (blob: Blob) => {
  const blobURL = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.download = 'movie.webm'
  anchor.href = blobURL
  anchor.click()
  anchor.remove()
}
