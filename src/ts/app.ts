import '../scss/style.scss';
import useRecord from './record'
import { getMedia, startVideo } from './utils'

const setup = async () => {
  const stream = await getMedia()

  const { startRecord, downloadWebM } = useRecord()
  const btn = document.getElementById('downloadButton')
  if (!btn) throw 'button not found'
  btn.addEventListener('click', downloadWebM)

  startRecord(stream)
  startVideo(stream)
}

setup()
