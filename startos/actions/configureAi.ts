import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

const { InputSpec, Value, Variants } = sdk

const modelFields = {
  textModel: Value.text({
    name: i18n('Text Model'),
    description: null,
    default: null,
    required: true,
    placeholder: 'qwen2.5:7b',
  }),
  imageModel: Value.text({
    name: i18n('Image Model'),
    description: null,
    default: null,
    required: true,
    placeholder: 'gemma3:4b',
  }),
  autoSummarize: Value.toggle({
    name: i18n('Summarize Automatically'),
    description: null,
    default: false,
  }),
  semanticSearch: Value.union({
    name: i18n('Semantic Search'),
    description: i18n(
      'Finds bookmarks by meaning as well as keywords. Karakeep creates an embedding of each new bookmark with the model below and keeps it in Meilisearch.',
    ),
    default: 'disabled',
    variants: Variants.of({
      disabled: { name: i18n('Disabled'), spec: InputSpec.of({}) },
      enabled: {
        name: i18n('Enabled'),
        spec: InputSpec.of({
          embeddingModel: Value.text({
            name: i18n('Embedding Model'),
            description: i18n(
              'When you save, Karakeep asks the server for an embedding from this model to confirm it works and to read its dimensions.',
            ),
            default: null,
            required: true,
            placeholder: 'nomic-embed-text',
          }),
        }),
      },
    }),
  }),
}

export const inputSpec = InputSpec.of({
  provider: Value.union({
    name: i18n('Provider'),
    default: 'none',
    variants: Variants.of({
      none: { name: i18n('Disabled'), spec: InputSpec.of({}) },
      ollama: {
        name: i18n('Ollama'),
        spec: InputSpec.of({
          baseUrl: Value.text({
            name: i18n('Server URL'),
            description: null,
            default: null,
            required: true,
            placeholder: 'http://192.168.1.50:11434',
          }),
          ...modelFields,
        }),
      },
      openai: {
        name: i18n('OpenAI-compatible'),
        spec: InputSpec.of({
          baseUrl: Value.text({
            name: i18n('Server URL'),
            description: null,
            default: null,
            required: false,
            placeholder: 'https://api.openai.com/v1',
          }),
          apiKey: Value.text({
            name: i18n('API Key'),
            description: i18n(
              "Required. A local server such as Ollama doesn't check it, so any placeholder value (for example 'ollama') works.",
            ),
            default: null,
            required: true,
            masked: true,
          }),
          ...modelFields,
        }),
      },
    }),
  }),
})

// Embeds one word through the same endpoint Karakeep will use, from a
// container with the same network as the daemon, and returns the vector length.
const probeScript = `
const { PROVIDER, BASE_URL, API_KEY, MODEL } = process.env
const ollama = PROVIDER === 'ollama'
const base = (BASE_URL || 'https://api.openai.com/v1').replace(/\\/+$/, '')
const url = ollama ? base + '/api/embed' : base + '/embeddings'
fetch(url, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(ollama ? {} : { authorization: 'Bearer ' + API_KEY }),
  },
  body: JSON.stringify({ model: MODEL, input: 'hello' }),
  signal: AbortSignal.timeout(100000),
})
  .then(async (res) => {
    const text = await res.text()
    if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + text.slice(0, 300))
    const json = JSON.parse(text)
    const vector = ollama ? json.embeddings?.[0] : json.data?.[0]?.embedding
    if (!Array.isArray(vector) || !vector.length)
      throw new Error('the response contained no embedding')
    console.log(vector.length)
  })
  .catch((e) => {
    console.error(url + ': ' + e.message + (e.cause ? ' (' + e.cause.message + ')' : ''))
    process.exit(1)
  })
`

async function detectEmbeddingDimensions(
  effects: Parameters<typeof sdk.SubContainer.withTemp>[0],
  opts: {
    provider: 'ollama' | 'openai'
    baseUrl: string
    apiKey: string
    model: string
  },
): Promise<number> {
  const res = await sdk.SubContainer.withTemp(
    effects,
    { imageId: 'karakeep' },
    null,
    'embedding-probe',
    (sub) =>
      sub.exec(['node', '-e', probeScript], {
        env: {
          PROVIDER: opts.provider,
          BASE_URL: opts.baseUrl,
          API_KEY: opts.apiKey,
          MODEL: opts.model,
        },
        timeout: 120_000,
      }),
  )
  const dimensions = Number(String(res.stdout).trim())
  if (res.exitCode !== 0 || !Number.isInteger(dimensions) || dimensions < 1) {
    throw new Error(
      `Could not get an embedding for "${opts.model}": ${String(res.stderr).trim() || 'the request timed out'}`,
    )
  }
  return dimensions
}

export const configureAi = sdk.Action.withInput(
  // id
  'configure-ai',

  // metadata
  async () => ({
    name: i18n('Configure AI'),
    description: i18n(
      'Connect Karakeep to an Ollama server or an OpenAI-compatible API for automatic tagging and summaries.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  // form input specification
  inputSpec,

  // pre-fill the input form with the current values
  async ({ effects }) => {
    const ai = await storeJson.read((s) => s.ai).once()
    if (!ai || ai.provider === 'none')
      return { provider: { selection: 'none' } }
    return {
      provider: {
        selection: ai.provider,
        value: {
          baseUrl: ai.baseUrl || undefined,
          apiKey: ai.apiKey || undefined,
          textModel: ai.textModel,
          imageModel: ai.imageModel,
          autoSummarize: ai.autoSummarize,
          semanticSearch: ai.embeddingModel
            ? {
                selection: 'enabled',
                value: {
                  embeddingModel: ai.embeddingModel,
                },
              }
            : { selection: 'disabled' },
        },
      },
    } as any
  },

  // the execution function
  async ({ effects, input }) => {
    const p = input.provider
    const embeddingModel =
      p.selection !== 'none' && p.value.semanticSearch.selection === 'enabled'
        ? p.value.semanticSearch.value.embeddingModel
        : ''
    const embeddingDimensions =
      p.selection !== 'none' && embeddingModel
        ? await detectEmbeddingDimensions(effects, {
            provider: p.selection,
            baseUrl: p.value.baseUrl ?? '',
            apiKey: p.selection === 'openai' ? p.value.apiKey : '',
            model: embeddingModel,
          })
        : 0
    await storeJson.merge(effects, {
      ai:
        p.selection === 'none'
          ? { provider: 'none' }
          : {
              provider: p.selection,
              baseUrl: p.value.baseUrl ?? '',
              apiKey: p.selection === 'openai' ? p.value.apiKey : '',
              textModel: p.value.textModel,
              imageModel: p.value.imageModel,
              autoSummarize: p.value.autoSummarize,
              embeddingModel,
              embeddingDimensions,
            },
    })
  },
)
