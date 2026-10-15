import { configureAi } from './configureAi'
import { sdk } from '../sdk'
import { setPerformance } from './setPerformance'
import { setPrimaryUrl } from './setPrimaryUrl'
import { toggleSignups } from './toggleSignups'

export const actions = sdk.Actions.of()
  .addAction(toggleSignups)
  .addAction(setPrimaryUrl)
  .addAction(configureAi)
  .addAction(setPerformance)
