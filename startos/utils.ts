import { T } from '@start9labs/start-sdk'
import { sdk } from './sdk'

// Karakeep web port (docker/Dockerfile EXPOSE 3000 / PORT default).
export const uiPort = 3000

// Meilisearch and Chrome are internal sidecars, reached over this package's
// shared loopback network namespace — never exposed via an interface.
export const meiliPort = 7700
export const chromePort = 9222

// Host id (the `sdk.MultiHost.of` group) and interface id for the web UI,
// shared between interfaces.ts and the primary-URL action/init watcher.
export const uiMultiHostId = 'ui'
export const uiInterfaceId = 'ui'

export function getNonLocalUrls(effects: T.Effects): Promise<string[]> {
  return sdk.host
    .getOwn(effects, uiMultiHostId, (host) => {
      const iface =
        host &&
        Object.values(host.bindings)
          .flatMap((b) => Object.values(b.interfaces))
          .find((i) => i.id === uiInterfaceId)
      return iface ? iface.addressInfo.nonLocal.format() : []
    })
    .const()
}
