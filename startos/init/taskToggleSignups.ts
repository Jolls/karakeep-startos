import { toggleSignups } from '../actions/toggleSignups'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Karakeep has no admin-bootstrap API — the first account a user signs up
// with becomes admin automatically — so signups start enabled. Nudge the
// user to lock registration back down once they've created that account.
export const taskToggleSignups = sdk.setupOnInit(async (effects, kind) => {
  if (kind === 'install') {
    await sdk.action.createOwnTask(effects, toggleSignups, 'important', {
      reason: i18n(
        'After creating your first account (which becomes the admin), you should run the Toggle Signups action to disable further registrations. As it stands, anyone with your Karakeep URL can create an account on your server.',
      ),
    })
  }
})
