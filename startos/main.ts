import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import { chromePort, meiliPort, uiPort } from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Karakeep!'))

  // Generated once on install by init/seedFiles.ts.
  const nextAuthSecret =
    (await storeJson.read((s) => s.nextAuthSecret).const(effects)) ?? ''
  const meiliMasterKey =
    (await storeJson.read((s) => s.meiliMasterKey).const(effects)) ?? ''
  // Selected by the user via the "Set Primary URL" action (init/taskSetPrimaryUrl.ts
  // seeds a default on install). Reactive so NEXTAUTH_URL — and therefore the
  // daemon — updates if the choice changes later.
  const domain = (await storeJson.read((s) => s.domain).const(effects)) ?? ''
  const signupsDisabled = await storeJson
    .read((s) => s.signupsDisabled)
    .const(effects)

  const meilisearchSub = sdk.SubContainer.of(
    effects,
    { imageId: 'meilisearch' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'meilisearch',
      mountpoint: '/meili_data',
      readonly: false,
    }),
    'meilisearch-sub',
  )

  const chromeSub = sdk.SubContainer.of(
    effects,
    { imageId: 'chrome' },
    sdk.Mounts.of(),
    'chrome-sub',
  )

  const karakeepSub = sdk.SubContainer.of(
    effects,
    { imageId: 'karakeep' },
    sdk.Mounts.of().mountVolume({
      volumeId: 'main',
      subpath: 'data',
      mountpoint: '/data',
      readonly: false,
    }),
    'karakeep-sub',
  )

  return sdk.Daemons.of(effects)
    .addDaemon('meilisearch', {
      subcontainer: meilisearchSub,
      exec: {
        command: sdk.useEntrypoint(),
        env: {
          MEILI_MASTER_KEY: meiliMasterKey,
          MEILI_NO_ANALYTICS: 'true',
        },
      },
      ready: {
        display: null, // internal sidecar, not shown to the user
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://127.0.0.1:${meiliPort}/health`,
            {
              successMessage: i18n('Meilisearch is ready'),
              errorMessage: i18n('Meilisearch is not ready'),
            },
          ),
      },
      requires: [],
    })
    .addDaemon('chrome', {
      subcontainer: chromeSub,
      exec: {
        command: sdk.useEntrypoint([
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--hide-scrollbars',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1440,900',
        ]),
        // The bundled Chrome launcher expects to run as PID 1.
        runAsInit: true,
      },
      ready: {
        display: null, // internal sidecar, not shown to the user
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, chromePort, {
            successMessage: i18n('Chrome is ready'),
            errorMessage: i18n('Chrome is not ready'),
          }),
      },
      requires: [],
    })
    .addDaemon('karakeep', {
      subcontainer: karakeepSub,
      exec: {
        command: sdk.useEntrypoint(),
        // Bundles s6-overlay, which must run as PID 1.
        runAsInit: true,
        env: {
          DATA_DIR: '/data',
          NEXTAUTH_SECRET: nextAuthSecret,
          NEXTAUTH_URL: domain || `http://localhost:${uiPort}`,
          MEILI_ADDR: `http://127.0.0.1:${meiliPort}`,
          MEILI_MASTER_KEY: meiliMasterKey,
          BROWSER_WEB_URL: `http://127.0.0.1:${chromePort}`,
          DISABLE_SIGNUPS: signupsDisabled ? 'true' : 'false',
        },
      },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkWebUrl(
            effects,
            `http://127.0.0.1:${uiPort}/api/health`,
            {
              successMessage: i18n('Karakeep is ready'),
              errorMessage: i18n('Karakeep is not ready'),
            },
          ),
      },
      requires: ['meilisearch', 'chrome'],
    })
})
