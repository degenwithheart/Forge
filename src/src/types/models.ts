export type Modality = 'text' | 'image' | 'audio' | 'video';
export type Provider = 'huggingface' | 'openai';

export interface ModelCard {
  modelId: string;
  name: string;
  author: string;
  description: string;
  tags: string[];
  stats: {
    downloads: number;
    likes: number;
  };
  requirements: {
    minVramGB?: number;
    contextLength?: number;
    architecture?: string;
  };
  license?: string;
  gated: boolean;
  previewUrl?: string;
}

export interface HFModel extends ModelCard {
  id: string;
  pipeline_tag: string;
  lastModified: string;
  modality: Modality;
  isLoaded: boolean;
  isLoading: boolean;
  quantization?: string;
  provider: Provider;
}

export interface InferenceParams {
  temperature: number;
  topP: number;
  maxTokens: number;
  contextWindow: number;
}

export const DEFAULT_PARAMS: InferenceParams = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 256,
  contextWindow: 4096,
};

export type InferenceRole = 'user' | 'assistant' | 'system';

export interface InferenceResult {
  type: 'text' | 'image' | 'audio';
  role: InferenceRole;
  content: string;
  prompt?: string;
  tokens?: number;
  duration?: number;
  tps?: number;
  model?: string;
  provider?: Provider;
}

export interface TelemetryData {
  vramUsed: number;
  vramTotal: number;
  cpuUsage: number;
  gpuUsage: number;
  tps: number;
  modelsLoaded: number;
}

export interface CachedModel {
  modelId: string;
  name: string;
  author: string;
  provider: Provider;
  modality: Modality;
  loadedAt: number;
  lastUsed: number;
  estimatedSizeMB: number;
}

export interface ProviderConfig {
  id: Provider;
  name: string;
  apiKey: string;
  enabled: boolean;
}

export interface ApiValidationStatus {
  provider: Provider;
  isValid: boolean;
  error?: string;
  checkedAt: number;
}

export interface CachedModelMetadata {
  modelId: string;
  name: string;
  author: string;
  description: string;
  provider: Provider;
  modality: Modality;
  card: ModelCard;
  fetchedAt: number;
  expiresAt: number;
}

export interface ModelLoadState {
  modelId: string;
  status: 'idle' | 'downloading' | 'loaded' | 'error';
  progress?: number;
  error?: string;
  lastError?: string;
  activatedAt: number;
}

export const MODALITY_MAP: Record<Modality, string[]> = {
  text: ['text-generation', 'text2text-generation', 'summarization', 'translation', 'fill-mask', 'question-answering'],
  image: ['text-to-image', 'image-to-text', 'image-classification', 'image-segmentation', 'object-detection'],
  audio: ['text-to-speech', 'automatic-speech-recognition', 'audio-classification', 'audio-to-audio'],
  video: ['text-to-video', 'video-classification'],
};

export const MODALITY_LABELS: Record<Modality, string> = {
  text: 'TXT',
  image: 'IMG',
  audio: 'AUD',
  video: 'VID',
};

export const PIPELINE_TAG_MAP: Record<string, Modality> = Object.entries(MODALITY_MAP).reduce(
  (acc, [modality, tags]) => {
    tags.forEach(tag => { acc[tag] = modality as Modality; });
    return acc;
  },
  {} as Record<string, Modality>
);

export async function fetchOpenAIModels(apiKey: string): Promise<HFModel[]> {
  if (!apiKey) return [];
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return [];
    const data = await res.json() as { data: Array<{ id: string }> };
    const openaiModelIds = new Set([
      'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo',
      'dall-e-3', 'tts-1', 'whisper-1',
    ]);
    const availableModels = data.data.filter(m => openaiModelIds.has(m.id));
    return availableModels.map(m => createOpenAIModel(m.id));
  } catch {
    return [];
  }
}

function createOpenAIModel(modelId: string): HFModel {
  const modelMap: Record<string, { name: string; pipeline: string; modality: Modality }> = {
    'gpt-4o': { name: 'GPT-4o', pipeline: 'text-generation', modality: 'text' },
    'gpt-4o-mini': { name: 'GPT-4o Mini', pipeline: 'text-generation', modality: 'text' },
    'gpt-4-turbo': { name: 'GPT-4 Turbo', pipeline: 'text-generation', modality: 'text' },
    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', pipeline: 'text-generation', modality: 'text' },
    'dall-e-3': { name: 'DALL-E 3', pipeline: 'text-to-image', modality: 'image' },
    'tts-1': { name: 'TTS-1', pipeline: 'text-to-speech', modality: 'audio' },
    'whisper-1': { name: 'Whisper', pipeline: 'automatic-speech-recognition', modality: 'audio' },
  };
  const meta = modelMap[modelId] || { name: modelId, pipeline: 'unknown', modality: 'text' as const };
  return {
    id: modelId,
    modelId,
    author: 'OpenAI',
    name: meta.name,
    description: `Official OpenAI ${meta.name} model`,
    pipeline_tag: meta.pipeline,
    tags: ['official', 'openai'],
    lastModified: new Date().toISOString(),
    modality: meta.modality,
    isLoaded: false,
    isLoading: false,
    provider: 'openai',
    stats: { downloads: 0, likes: 0 },
    requirements: {},
    gated: false,
  };
}
