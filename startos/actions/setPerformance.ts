import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value } = sdk

export const inputSpec = InputSpec.of({
  performance: Value.select({
    name: i18n('Hardware Speed'),
    description: i18n(
      'Limits how many background indexing jobs run at once. Higher values index large libraries faster but use more CPU and memory. Only matters when many bookmarks are processed at once, such as Reindex All Bookmarks.',
    ),
    default: 'high',
    values: {
      low: i18n('Low: slow hardware (5 search, 2 embedding jobs)'),
      medium: i18n('Medium (20 search, 5 embedding jobs)'),
      high: i18n('High: fast hardware (50 search, 10 embedding jobs)'),
    },
  }),
})

// main.ts reads `performance` reactively via .const(), so saving here
// restarts the karakeep daemon with the new worker counts.
export const setPerformance = sdk.Action.withInput(
  // id
  'set-performance',

  // metadata
  async () => ({
    name: i18n('Set Performance'),
    description: i18n(
      'Choose how many search and embedding jobs Karakeep runs at once. Lower it on slower hardware if the server becomes sluggish while indexing.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // pre-fill the input form with the current values
  async () => ({
    performance:
      (await storeJson.read((s) => s.performance).once()) ?? undefined,
  }),

  // the execution function
  async ({ effects, input }) => {
    await storeJson.merge(effects, { performance: input.performance })
  },
)
