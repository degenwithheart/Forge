# API Reference

Complete API documentation for FORGE's frontend, backend, and provider integrations.

## Table of Contents

- [Frontend APIs](#frontend-apis)
- [Python Backend APIs](#python-backend-apis)
- [Provider APIs](#provider-apis)
- [Cache APIs](#cache-apis)
- [Telemetry APIs](#telemetry-apis)

## Frontend APIs

### Core Hooks

#### `useForgeEngine`
Central state management hook for the entire application.

```typescript
const useForgeEngine = () => {
  // State
  const [activeModality, setActiveModality] = useState<Modality>('text');
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  const [activeModel, setActiveModel] = useState<HFModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [results, setResults] = useState<InferenceResult[]>([]);
  const [params, setParams] = useState<InferenceParams>(DEFAULT_PARAMS);
  
  // Methods
  const handleModelLoad = useCallback((model: HFModel) => { /* ... */ });
  const handleModelUnload = useCallback(async (model: HFModel) => { /* ... */ });
  const handleInference = useCallback(async (prompt: string) => { /* ... */ });
  const cancelInference = useCallback(() => { /* ... */ });
  
  return {
    // State
    activeModality, setActiveModality,
    loadedModels, loadingModels,
    activeModel, isGenerating,
    streamingText, results,
    telemetry, params, setParams,
    
    // Sub-hooks
    cache, providers,
    
    // Methods
    handleModelLoad, handleModelUnload,
    handleInference, cancelInference,
    openaiModels, isLoadingOpenAI
  };
};
```

**Usage:**
```typescript
const engine = useForgeEngine();

// Load a model
engine.handleModelLoad(selectedModel);

// Run inference
await engine.handleInference("What is AI?");

// Update parameters
engine.setParams({ ...engine.params, temperature: 0.8 });
```

#### `useModelCache`
Cache management operations and statistics.

```typescript
const useModelCache = () => {
  const [cachedModels, setCachedModels] = useState<CachedModel[]>([]);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  
  const addToCache = useCallback(async (model: ModelMetadata) => { /* ... */ });
  const removeFromCache = useCallback(async (modelId: string) => { /* ... */ });
  const clearCache = useCallback(async () => { /* ... */ });
  const pruneOldModels = useCallback(async (daysOld: number) => { /* ... */ });
  
  return {
    cachedModels,
    cacheStats,
    addToCache,
    removeFromCache,
    clearCache,
    pruneOldModels,
    isCacheManagerOpen,
    setIsCacheManagerOpen
  };
};
```

#### `useProviders`
API key management and provider validation.

```typescript
const useProviders = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [validationStatus, setValidationStatus] = useState<ApiValidationStatus[]>([]);
  
  const updateProvider = useCallback(async (provider: Provider, config: Partial<ProviderConfig>) => { /* ... */ });
  const validateApiKey = useCallback(async (provider: Provider, apiKey: string) => { /* ... */ });
  const getApiKey = useCallback((provider: Provider) => { /* ... */ });
  const isProviderEnabled = useCallback((provider: Provider) => { /* ... */ });
  
  return {
    providers,
    validationStatus,
    updateProvider,
    validateApiKey,
    getApiKey,
    isProviderEnabled,
    isValidating
  };
};
```

### Core Components

#### `ModelCard`
Model loading and management interface.

```typescript
interface ModelCardProps {
  model: HFModel;
  onLoad: (model: HFModel) => void;
  onUnload: (model: HFModel) => void;
  isLoaded: boolean;
  isLoading: boolean;
  compact?: boolean;
}

<ModelCard
  model={selectedModel}
  onLoad={handleModelLoad}
  onUnload={handleModelUnload}
  isLoaded={loadedModels.has(model.modelId)}
  isLoading={loadingModels.has(model.modelId)}
/>
```

#### `ParameterControls`
Inference parameter adjustment interface.

```typescript
interface ParameterControlsProps {
  params: InferenceParams;
  onChange: (params: InferenceParams) => void;
  disabled?: boolean;
  compact?: boolean;
}

<ParameterControls
  params={engine.params}
  onChange={engine.setParams}
  disabled={!engine.activeModel}
/>
```

#### `TelemetryPanel`
Real-time system metrics display.

```typescript
interface TelemetryPanelProps {
  data: TelemetryData;
  isGenerating: boolean;
  params: InferenceParams;
  onParamsChange: (params: InferenceParams) => void;
  providers: ProviderConfig[];
  onProviderUpdate: (provider: Provider, config: Partial<ProviderConfig>) => void;
}
```

## Python Backend APIs

### Base URL: `http://localhost:5000`

### Server Information

#### `GET /info`
Get server capabilities and current state.

**Response:**
```json
{
  "status": "ready",
  "device": "cuda:0",
  "device_name": "NVIDIA RTX 3080",
  "loaded_models": ["distilbert-base-uncased", "gpt2"],
  "supported_tasks": [
    "text-generation",
    "text2text-generation",
    "feature-extraction",
    "question-answering"
  ],
  "memory_usage": {
    "allocated": 2147483648,
    "cached": 1073741824,
    "max_allocated": 4294967296
  },
  "version": "1.0.0"
}
```

### Model Management

#### `POST /load`
Load a model into memory.

**Request:**
```json
{
  "model_id": "distilbert-base-uncased",
  "model_name": "DistilBERT Base Uncased",
  "task": "text-generation"
}
```

**Response:**
```json
{
  "status": "loaded",
  "model_id": "distilbert-base-uncased",
  "task": "text-generation",
  "device": "cuda:0",
  "memory_footprint": 268435456,
  "load_time": 12.5
}
```

**Errors:**
```json
{
  "detail": "Model not found on HuggingFace",
  "error_code": "MODEL_NOT_FOUND"
}
```

#### `POST /unload`
Unload a model from memory.

**Request:**
```json
{
  "model_id": "distilbert-base-uncased"
}
```

**Response:**
```json
{
  "status": "unloaded",
  "model_id": "distilbert-base-uncased",
  "memory_freed": 268435456
}
```

#### `GET /models`
List all currently loaded models.

**Response:**
```json
{
  "loaded_models": [
    {
      "model_id": "distilbert-base-uncased",
      "task": "text-generation",
      "device": "cuda:0",
      "memory_footprint": 268435456,
      "loaded_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Inference

#### `POST /infer`
Run inference with a loaded model.

**Request:**
```json
{
  "model_id": "distilbert-base-uncased",
  "prompt": "What is artificial intelligence?",
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 256,
  "stream": false
}
```

**Response (non-streaming):**
```json
{
  "output": "Artificial intelligence is a branch of computer science...",
  "tokens_generated": 45,
  "inference_time": 2.3,
  "tokens_per_second": 19.6
}
```

**Response (streaming):**
```json
{
  "stream_id": "abc123",
  "status": "streaming"
}
```

Then via WebSocket or Server-Sent Events:
```
data: {"token": "Artificial", "tps": 15.2}
data: {"token": " intelligence", "tps": 18.7}
data: {"token": " is", "tps": 20.1}
data: {"status": "completed", "total_tokens": 45}
```

#### `POST /infer/stream`
Streaming inference endpoint.

**Request:** Same as `/infer` but with `"stream": true`

**Response:** Server-Sent Events stream
```
event: token
data: {"token": "Artificial", "index": 0, "tps": 15.2}

event: token
data: {"token": " intelligence", "index": 1, "tps": 18.7}

event: completed
data: {"total_tokens": 45, "total_time": 2.3, "average_tps": 19.6}
```

### System Monitoring

#### `GET /telemetry`
Get current system metrics.

**Response:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "memory": {
    "allocated": 2147483648,
    "cached": 1073741824,
    "max_allocated": 4294967296
  },
  "gpu": {
    "utilization": 0.75,
    "memory_used": 8589934592,
    "memory_total": 10737418240,
    "temperature": 72,
    "power_usage": 250
  },
  "cpu": {
    "utilization": 0.45,
    "memory_used": 8589934592
  },
  "models": {
    "loaded": 2,
    "total_inferences": 15,
    "average_inference_time": 2.1
  }
}
```

## Provider APIs

### OpenAI API Integration

#### Supported Models
```typescript
const OPENAI_MODELS = {
  'gpt-4o': { name: 'GPT-4o', modality: 'text', pipeline: 'text-generation' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', modality: 'text', pipeline: 'text-generation' },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', modality: 'text', pipeline: 'text-generation' },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', modality: 'text', pipeline: 'text-generation' },
  'dall-e-3': { name: 'DALL-E 3', modality: 'image', pipeline: 'text-to-image' },
  'tts-1': { name: 'TTS-1', modality: 'audio', pipeline: 'text-to-speech' },
  'whisper-1': { name: 'Whisper', modality: 'audio', pipeline: 'automatic-speech-recognition' }
};
```

#### API Usage
```typescript
const streamOpenAI = async (
  apiKey: string,
  model: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  params: InferenceParams,
  onChunk: (text: string) => void,
  onError: (error: string) => void
): Promise<{ fullText: string; tokenCount: number; duration: number }> => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: params.temperature,
      top_p: params.topP,
      max_tokens: params.maxTokens,
      stream: true,
    }),
  });
  
  // Handle streaming response
  const reader = response.body?.getReader();
  // ... streaming implementation
};
```

### HuggingFace API Integration

#### API Usage
```typescript
const streamHuggingFace = async (
  modelId: string,
  prompt: string,
  apiKey: string,
  params: InferenceParams,
  onChunk: (text: string) => void,
  onError: (error: string) => void,
  modality: 'text' | 'image' | 'audio' = 'text'
): Promise<{ content: string; tokenCount: number; duration: number; type: string }> => {
  const response = await fetch(`https://api-inference.huggingface.co/models/${modelId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: params.maxTokens,
        temperature: params.temperature,
        top_p: params.topP,
        do_sample: params.temperature > 0,
      },
    }),
  });
  
  // Handle response based on modality
  if (modality === 'image') {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    return { content: url, tokenCount: prompt.split(/\s+/).length, duration: Date.now() - startTime, type: 'image' };
  } else {
    const data = await response.json();
    const generated = data[0]?.generated_text || '';
    return { content: generated, tokenCount: generated.split(/\s+/).length, duration: Date.now() - startTime, type: 'text' };
  }
};
```

## Cache APIs

### Cache Manager Interface

```typescript
interface CacheManager {
  // Model operations
  addModel(model: CachedModel): Promise<void>;
  removeModel(modelId: string): Promise<{ success: boolean; freedMB: number }>;
  getCachedModels(): Promise<CachedModel[]>;
  getCachedModel(modelId: string): Promise<CachedModel | undefined>;
  
  // Cache operations
  clearAll(): Promise<number>;
  pruneOldModels(daysOld: number): Promise<number>;
  getTotalCacheSize(): Promise<number>;
  getCacheStats(): Promise<CacheStats>;
  
  // Configuration
  setStorageLimit(limitMB: number): void;
  getStorageLimit(): number;
}

interface CachedModel {
  modelId: string;
  name: string;
  author: string;
  provider: 'openai' | 'huggingface';
  modality: 'text' | 'image' | 'audio' | 'video';
  estimatedSizeMB: number;
  loadedAt: number;
  lastUsed: number;
  accessCount: number;
}

interface CacheStats {
  totalModels: number;
  totalSizeMB: number;
  oldestModel: CachedModel | null;
  newestModel: CachedModel | null;
  mostUsedModel: CachedModel | null;
}
```

### Cache Operations

#### Add Model to Cache
```typescript
const cacheManager = getCacheManager();

await cacheManager.addModel({
  modelId: 'distilbert-base-uncased',
  name: 'DistilBERT Base Uncased',
  author: 'HuggingFace',
  provider: 'huggingface',
  modality: 'text',
  estimatedSizeMB: 268,
  loadedAt: Date.now(),
  lastUsed: Date.now(),
  accessCount: 1
});
```

#### Get Cache Statistics
```typescript
const stats = await cacheManager.getCacheStats();
console.log(`Cache: ${stats.totalModels} models, ${stats.totalSizeMB}MB total`);
```

#### Prune Old Models
```typescript
const freedSpace = await cacheManager.pruneOldModels(7); // 7 days
console.log(`Freed ${freedSpace}MB by pruning old models`);
```

## Telemetry APIs

### Telemetry Data Structure

```typescript
interface TelemetryData {
  vramUsed: number;        // MB
  vramTotal: number;       // MB
  cpuUsage: number;        // Percentage 0-1
  gpuUsage: number;        // Percentage 0-1
  tps: number;            // Tokens per second
  modelsLoaded: number;   // Count of loaded models
}

interface SystemStats {
  memoryUsage: number;    // MB
  memoryTotal: number;    // MB
  cpuUsage: number;       // Percentage
  gpuUsage: number;       // Percentage
}
```

### Telemetry Collection

#### Frontend Telemetry
```typescript
const getSystemStats = (): SystemStats => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      memoryUsage: memory.usedJSHeapSize / 1024 / 1024,
      memoryTotal: memory.totalJSHeapSize / 1024 / 1024,
      cpuUsage: 0, // Not available in browser
      gpuUsage: 0  // Not available in browser
    };
  }
  return { memoryUsage: 0, memoryTotal: 0, cpuUsage: 0, gpuUsage: 0 };
};
```

#### Backend Telemetry
```typescript
const fetchServerSystemStats = async (): Promise<SystemStats | null> => {
  try {
    const response = await fetch('http://localhost:5000/telemetry');
    if (response.ok) {
      const data = await response.json();
      return {
        memoryUsage: data.memory.allocated / 1024 / 1024,
        memoryTotal: data.memory.max_allocated / 1024 / 1024,
        cpuUsage: data.cpu.utilization,
        gpuUsage: data.gpu.utilization
      };
    }
  } catch (error) {
    return null;
  }
};
```

### Real-time Updates

#### Telemetry Hook
```typescript
const useTelemetry = () => {
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    vramUsed: 0,
    vramTotal: 8.0,
    cpuUsage: 0,
    gpuUsage: 0,
    tps: 0,
    modelsLoaded: 0
  });
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const serverStats = await fetchServerSystemStats();
      if (serverStats) {
        setTelemetry(prev => ({
          ...prev,
          vramUsed: serverStats.memoryUsage,
          vramTotal: serverStats.memoryTotal,
          cpuUsage: serverStats.cpuUsage,
          gpuUsage: serverStats.gpuUsage
        }));
      }
    }, 500); // Update every 500ms
    
    return () => clearInterval(interval);
  }, []);
  
  return telemetry;
};
```

## Error Handling

### Standard Error Format
```typescript
interface ApiError {
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}
```

### Common Error Codes
- `MODEL_NOT_FOUND`: Model not available on provider
- `INVALID_API_KEY`: API key validation failed
- `INSUFFICIENT_RESOURCES`: Not enough memory/VRAM
- `INFERENCE_FAILED`: Inference execution failed
- `NETWORK_ERROR`: Network connectivity issues
- `RATE_LIMITED`: API rate limit exceeded

### Error Handling Example
```typescript
try {
  await engine.handleInference(prompt);
} catch (error) {
  if (error.code === 'MODEL_NOT_FOUND') {
    toast.error('Model not found. Please check the model name and try again.');
  } else if (error.code === 'INSUFFICIENT_RESOURCES') {
    toast.error('Not enough memory. Try unloading some models or using a smaller model.');
  } else {
    toast.error('Inference failed. Please try again.');
  }
}
```

This API reference provides comprehensive documentation for all FORGE APIs, enabling developers to integrate and extend the platform effectively.
