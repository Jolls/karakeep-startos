import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Karakeep's DISABLE_SIGNUPS env var only takes effect on daemon restart —
// main.ts reads signupsDisabled reactively via .const(), so flipping this
// value here restarts the karakeep daemon automatically.
export const toggleSignups = sdk.Action.withoutInput(
  // id
  'toggle-signups',

  // metadata
  async ({ effects }) => {
    const disabled = await storeJson
      .read((s) => s.signupsDisabled)
      .const(effects)

    return {
      name: disabled ? i18n('Enable Signups') : i18n('Disable Signups'),
      description: disabled
        ? i18n(
            'Signups are currently disabled. Run this action to permit new account creation.',
          )
        : i18n(
            'Signups are currently enabled. Run this action to prohibit new account creation.',
          ),
      warning: disabled
        ? null
        : i18n(
            'Anyone with your Karakeep URL will be able to create an account on your server — and the first account to sign up becomes an admin. Be careful!',
          ),
      allowedStatuses: 'any',
      group: null,
      visibility: 'enabled',
    }
  },

  // handler
  async ({ effects }) => {
    const disabled = await storeJson
      .read((s) => s.signupsDisabled)
      .const(effects)

    await storeJson.merge(effects, {
      signupsDisabled: !disabled,
    })
  },
)
