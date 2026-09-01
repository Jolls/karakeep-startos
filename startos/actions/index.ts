import { sdk } from '../sdk'
import { setPrimaryUrl } from './setPrimaryUrl'
import { toggleSignups } from './toggleSignups'

export const actions = sdk.Actions.of()
  .addAction(toggleSignups)
  .addAction(setPrimaryUrl)
