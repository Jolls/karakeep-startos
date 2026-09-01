export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Karakeep!': 0,
  'Web Interface': 1,
  'Meilisearch is ready': 2,
  'Meilisearch is not ready': 3,
  'Chrome is ready': 4,
  'Chrome is not ready': 5,
  'Karakeep is ready': 6,
  'Karakeep is not ready': 7,
  // interfaces.ts
  'The Karakeep bookmark manager UI': 8,
  // actions/toggleSignups.ts
  'Enable Signups': 9,
  'Disable Signups': 10,
  'Signups are currently disabled. Run this action to permit new account creation.': 11,
  'Signups are currently enabled. Run this action to prohibit new account creation.': 12,
  'Anyone with your Karakeep URL will be able to create an account on your server — and the first account to sign up becomes an admin. Be careful!': 13,
  // actions/setPrimaryUrl.ts
  URL: 14,
  'Set Primary URL': 15,
  'Choose which of your Karakeep addresses is used for NEXTAUTH_URL — the address Karakeep anchors its login and OAuth callback links to.': 16,
  // init/taskSetPrimaryUrl.ts
  'Primary URL is no longer available. Select a new one.': 17,
  // init/taskToggleSignups.ts
  "After creating your first account (which becomes the admin), you should run the Toggle Signups action to disable further registrations. As it stands, anyone with your Karakeep URL can create an account on your server.": 18,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
