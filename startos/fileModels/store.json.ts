import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

const shape = z.looseObject({
  // Signs NextAuth's JWT session tokens. Generated once on install; no
  // .catch() default on purpose — it must be a real random value, never a
  // static fallback every install would otherwise share.
  nextAuthSecret: z.string().optional().catch(undefined),
  // Meilisearch's own auth key. Generated once on install and shared between
  // the meilisearch daemon (MEILI_MASTER_KEY) and karakeep (MEILI_MASTER_KEY)
  // so karakeep can query the index.
  meiliMasterKey: z.string().optional().catch(undefined),
  // Full URL (e.g. https://karakeep.mydomain.local) used for NextAuth's
  // NEXTAUTH_URL, which anchors auth callback/redirect URLs. Picked from the
  // service's own interfaces (init/taskSetPrimaryUrl.ts, actions/setPrimaryUrl.ts).
  domain: z.string().catch(''),
  // Mirrors karakeep's DISABLE_SIGNUPS env var. Karakeep has no admin-bootstrap
  // API — the first account a user signs up with becomes admin automatically
  // — so signups start enabled and this flips to true once the user runs the
  // Toggle Signups action after creating that first account.
  signupsDisabled: z.boolean().catch(false),
  // Set by the Configure AI action; mapped to karakeep's OLLAMA_*/OPENAI_*/
  // INFERENCE_* env vars in main.ts.
  ai: z
    .looseObject({
      provider: z.enum(['none', 'ollama', 'openai']).catch('none'),
      baseUrl: z.string().catch(''),
      apiKey: z.string().catch(''),
      textModel: z.string().catch(''),
      imageModel: z.string().catch(''),
      autoSummarize: z.boolean().catch(false),
      embeddingModel: z.string().catch(''),
      embeddingDimensions: z.number().catch(0),
    })
    .catch({
      provider: 'none',
      baseUrl: '',
      apiKey: '',
      textModel: '',
      imageModel: '',
      autoSummarize: false,
      embeddingModel: '',
      embeddingDimensions: 0,
    }),
})

export const storeJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: './store.json' },
  shape,
)
