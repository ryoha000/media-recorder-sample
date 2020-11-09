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
    { id: ShowEBMLButtonID, func: () => displayEBML },
    { id: PlayVideoWithBigDurationBUtton, func: () => playWebMWithBigDuration },
    { id: PlayVideoWithDurationBUtton, func: () => playWebMWithDuration },
  ])
}

setup()
