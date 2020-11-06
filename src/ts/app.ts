import '../scss/style.scss';
import useRecord from './record'
import { getMedia, playVideoByStream, addClickFunction } from './utils'
import { MediaVideoID, ShowEBMLButtonID, PlayInitialVideoButtonID } from './const'

const setup = async () => {
  const stream = await getMedia()
  const { startRecord, playInitialWebM, setMetadata } = useRecord()
  startRecord(stream)
  playVideoByStream(MediaVideoID, stream)

  addClickFunction([
    { id: PlayInitialVideoButtonID, func: playInitialWebM },
    { id: ShowEBMLButtonID, func: setMetadata },
  ])
}

setup()
