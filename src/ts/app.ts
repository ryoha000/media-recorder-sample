import '../scss/style.scss';
import useRecord from './record'
import { getMedia, playVideoByStream, addClickFunction } from './utils'
import { MediaVideoID, ShowEBMLButtonID, PlayInitialVideoButtonID, PlayVideoWithBigDurationBUtton, PlayVideoWithDurationBUtton } from './const'

const setup = async () => {
  const stream = await getMedia()
  const { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration } = useRecord()
  startRecord(stream)
  playVideoByStream(MediaVideoID, stream)

  addClickFunction([
    { id: PlayInitialVideoButtonID, func: playInitialWebM },
    { id: ShowEBMLButtonID, func: displayEBML },
    { id: PlayVideoWithBigDurationBUtton, func: playWebMWithBigDuration },
    { id: PlayVideoWithDurationBUtton, func: playWebMWithDuration },
  ])
}

setup()

// test
import * as ebml from 'ts-ebml';
import { EBMLElementDetailWithIsEnd } from '../@types/EBML';
fetch("sample.webm").then(async e => {
  e.arrayBuffer().then(v => {
    const decoder = new ebml.Decoder();
    const prevArr = new Uint8Array(v)

    const data = (decoder.decode(v) as EBMLElementDetailWithIsEnd[])
    console.log(data);
    const d = data.find(v => v.name === 'Duration')
    const c = data.filter(v => v.name === 'CueTrack')
    console.log(d)
    for (const tmp of c) {
      if (tmp.value !== 1) {
        console.log(tmp)
      }
    }
    const start = d?.dataStart
    const end = d?.dataEnd
    let str = ''
    for (let i = start ?? 0; i < (end ?? 0); i++) {
      console.log(prevArr[i].toString(2).padStart(8, '0'))
      str += prevArr[i].toString(2).padStart(8, '0')
    }
    console.log(str)
    console.log(parseInt(str, 2))
  })
})
