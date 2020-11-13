import '../scss/style.scss';
import useRecord from './record'
import { getMedia, playVideoByStream, addClickFunction } from './utils'
import { MediaVideoID, ShowEBMLButtonID, PlayInitialVideoButtonID, PlayVideoWithBigDurationButton, PlayVideoWithDurationButton, PlayVideoWithSheekAndCueButton } from './const'

const setup = async () => {
  const stream = await getMedia()
  const { startRecord, playInitialWebM, playWebMWithBigDuration, displayEBML, playWebMWithDuration, playWebMWithSheekAndCue } = useRecord()
  startRecord(stream)
  playVideoByStream(MediaVideoID, stream)

  addClickFunction([
    { id: PlayInitialVideoButtonID, func: playInitialWebM },
    { id: ShowEBMLButtonID, func: displayEBML },
    { id: PlayVideoWithBigDurationButton, func: playWebMWithBigDuration },
    { id: PlayVideoWithDurationButton, func: playWebMWithDuration },
    { id: PlayVideoWithSheekAndCueButton, func: playWebMWithSheekAndCue },
  ])
}

setup()
