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
            description: null,
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
    if (!ai || ai.provider === 'none') return { provider: { selection: 'none' } }
    return {
      provider: {
        selection: ai.provider,
        value: {
          baseUrl: ai.baseUrl || undefined,
          apiKey: ai.apiKey || undefined,
          textModel: ai.textModel,
          imageModel: ai.imageModel,
          autoSummarize: ai.autoSummarize,
        },
      },
    } as any
  },

  // the execution function
  async ({ effects, input }) => {
    const p = input.provider
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
            },
    })
  },
)
