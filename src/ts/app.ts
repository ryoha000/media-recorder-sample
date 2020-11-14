import '../scss/style.scss';
import useRecord from './record'
import { getMedia, playVideoByStream, addClickFunction, playVideoByURL } from './utils'
import {
  MediaVideoID,
  ShowEBMLButtonID,
  PlayInitialVideoButtonID,
  PlayVideoWithBigDurationButton,
  PlayVideoWithDurationButton,
  PlayVideoWithSheekAndCueButton,
  Play3hOnlyDurationButton,
  ConfirmVideoID,
  Play3hWithMetaButton
} from './const'

const setup = async () => {
  const stream = await getMedia()
  const {
    startRecord,
    playInitialWebM,
    playWebMWithBigDuration,
    displayEBML,
    playWebMWithDuration,
    playWebMWithSheekAndCue
  } = useRecord()
  startRecord(stream)
  playVideoByStream(MediaVideoID, stream)

  addClickFunction([
    { id: PlayInitialVideoButtonID, func: playInitialWebM },
    { id: ShowEBMLButtonID, func: displayEBML },
    { id: PlayVideoWithBigDurationButton, func: playWebMWithBigDuration },
    { id: PlayVideoWithDurationButton, func: playWebMWithDuration },
    { id: PlayVideoWithSheekAndCueButton, func: playWebMWithSheekAndCue },
    { id: Play3hOnlyDurationButton, func: () =>
      playVideoByURL(ConfirmVideoID, 'https://github.com/ryoha000/media-recorder-sample/releases/download/1.0.0/3hOnlyDuration.webm')
    },
    { id: Play3hWithMetaButton, func: () =>
      playVideoByURL(ConfirmVideoID, 'https://github.com/ryoha000/media-recorder-sample/releases/download/1.0.0/3hWithMeta.webm')
    }
  ])
}

setup()
