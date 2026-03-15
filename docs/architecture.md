# Architecture Overview

Technical architecture of FORGE's multi-provider AI orchestration system.

## High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FORGE Architecture                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                                  │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐    │
│  │ Mobile UI   │ Desktop UI  │ Components  │ State Management│    │
│  │ Controller  │ Studio      │ Library     │ TanStack Query  │    │
│  │ Mode        │ Mode        │ shadcn/ui   │ Custom Hooks    │    │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘    │
│           │                    │                    │              │
│           ▼                    ▼                    ▼              │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                Provider Abstraction Layer                   │    │
│  │  ┌─────────────┬─────────────┬─────────────────────────────┐ │    │
│  │  │ Local       │ OpenAI      │ HuggingFace               │ │    │
│  │  │ Python      │ API         │ API                       │ │    │
│  │  │ Backend     │ GPT-4o      │ Inference                 │ │    │
│  │  │ (localhost) │ DALL-E 3    │ Any Model                 │ │    │
│  │  └─────────────┴─────────────┴─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                 │
│                              ▼                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Storage Layer                             │    │
│  │  ┌─────────────┬─────────────┬─────────────────────────────┐ │    │
│  │  │ Browser     │ Python      │ Provider APIs              │ │    │
│  │  │ localStorage│ Model Cache │ HuggingFace Hub            │ │    │
│  │  │ (500MB)     │ (Disk)      │ OpenAI API                 │ │    │
│  │  └─────────────┴─────────────┴─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Core Technologies
```
React 18 + TypeScript
├── Vite (build tool + dev server)
├── TanStack Query (server state management)
├── TailwindCSS + shadcn/ui (design system)
├── Framer Motion (animations)
├── React Router DOM (navigation)
└── React Hook Form + Zod (form validation)
```

### Component Hierarchy

```
App.tsx
├── QueryClientProvider
├── BrowserRouter
│   └── Routes
│       └── Index.tsx
│           └── useIsMobile()
│               ├── MobileLayout.tsx
│               └── DesktopLayout.tsx
```

### State Management Architecture

#### Client State (React Hooks)
```typescript
// useForgeEngine.ts - Central state orchestration
const useForgeEngine = () => {
  const [activeModality, setActiveModality] = useState<Modality>('text');
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  const [activeModel, setActiveModel] = useState<HFModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<InferenceResult[]>([]);
  const [params, setParams] = useState<InferenceParams>(DEFAULT_PARAMS);
  // ... orchestration logic
};
```

#### Server State (TanStack Query)
```typescript
// API calls with automatic caching and refetching
const { data: models, isLoading, error } = useQuery({
  queryKey: ['models', modality],
  queryFn: () => fetchModels(modality),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

#### Persistence Layer
```typescript
// cache-db.ts - Local storage management
class CacheManager {
  private index: CacheIndex = {
    models: new Map(),
    lastSync: 0,
  };
  
  async addModel(modelData: CachedModel): Promise<void> {
    // Store in localStorage with metadata
  }
  
  async enforceStorageLimit(): Promise<void> {
    // Auto-prune when over 500MB limit
  }
}
```

## Backend Architecture

### Python FastAPI Server
```
model-server.py (localhost:5000)
├── FastAPI Application
├── CORS Middleware
├── Model Registry
├── Inference Engine
└── Telemetry Collector
```

### Core Endpoints
```python
@app.get("/info")
async def get_server_info():
    """Server capabilities and device info"""
    return {
        "device": "cuda:0" if torch.cuda.is_available() else "cpu",
        "loaded_models": list(loaded_models.keys()),
        "supported_tasks": ["text-generation", "text2text-generation"]
    }

@app.post("/load")
async def load_model(request: LoadRequest):
    """Load model with progress tracking"""
    model = transformers.AutoModelForCausalLM.from_pretrained(
        request.model_id,
        device_map="auto"
    )
    loaded_models[request.model_id] = model
    return {"status": "loaded", "model_id": request.model_id}

@app.post("/infer")
async def run_inference(request: InferenceRequest):
    """Run inference with streaming support"""
    model = loaded_models[request.model_id]
    inputs = tokenizer(request.prompt, return_tensors="pt")
    outputs = model.generate(**inputs, max_new_tokens=request.max_tokens)
    return {"output": tokenizer.decode(outputs[0])}
```

### Model Management
```python
class ModelRegistry:
    def __init__(self):
        self.loaded_models: Dict[str, Pipeline] = {}
        self.model_configs: Dict[str, ModelConfig] = {}
    
    async def load_model(self, model_id: str, task: str):
        """Load model with automatic task detection"""
        pipeline = pipeline(
            task,
            model=model_id,
            device=0 if torch.cuda.is_available() else -1
        )
        self.loaded_models[model_id] = pipeline
        return pipeline
    
    async def unload_model(self, model_id: str):
        """Unload model and free memory"""
        if model_id in self.loaded_models:
            del self.loaded_models[model_id]
            torch.cuda.empty_cache()  # Free GPU memory
```

## Multi-Provider System

### Provider Abstraction
```typescript
interface Provider {
  name: string;
  type: 'local' | 'openai' | 'huggingface';
  loadModel(modelId: string): Promise<ModelInfo>;
  runInference(modelId: string, prompt: string, params: InferenceParams): Promise<InferenceResult>;
  isAvailable(): boolean;
}

class LocalPythonProvider implements Provider {
  name = 'Local Python';
  type = 'local' as const;
  
  async runInference(modelId: string, prompt: string, params: InferenceParams) {
    // Call localhost:5000/infer
    const response = await fetch('http://localhost:5000/infer', {
      method: 'POST',
      body: JSON.stringify({
        model_id: modelId,
        prompt,
        temperature: params.temperature,
        top_p: params.topP,
        max_tokens: params.maxTokens
      })
    });
    return response.json();
  }
}
```

### Smart Fallback Logic
```typescript
async function runInferenceWithFallback(modelId: string, prompt: string, params: InferenceParams) {
  const providers = [localProvider, huggingfaceProvider, openaiProvider];
  
  for (const provider of providers) {
    if (await provider.isAvailable()) {
      try {
        return await provider.runInference(modelId, prompt, params);
      } catch (error) {
        console.warn(`${provider.name} failed, trying next provider`);
        continue;
      }
    }
  }
  throw new Error('All providers unavailable');
}
```

## Data Flow Architecture

### Model Discovery Flow
```
User searches → HuggingFace API → TanStack Query Cache → UI Display
     ↓
5-minute cache → Background refresh → Cache invalidation → Fresh data
```

### Model Loading Flow
```
User clicks Load → Progress UI → Python Backend → Model Download
     ↓
localStorage → Cache Manager → Size Tracking → Limit Enforcement
```

### Inference Flow
```
User submits prompt → Provider Selection → Streaming Response → Real-time UI
     ↓
Telemetry Updates → TPS Calculation → Performance Metrics → Cache Update
```

## Cache System Architecture

### Multi-Layer Caching
```
┌─────────────────────────────────────────────────────────┐
│                    Cache Layers                          │
├─────────────────────────────────────────────────────────┤
│  Browser Cache (HTTP)                                    │
│  ├─ Static assets (JS, CSS)                             │
│  └─ API responses (5-minute TTL)                        │
├─────────────────────────────────────────────────────────┤
│  TanStack Query Cache                                    │
│  ├─ Model metadata (5 minutes)                          │
│  ├─ Provider status (1 minute)                          │
│  └─ User preferences (persistent)                        │
├─────────────────────────────────────────────────────────┤
│  localStorage Cache                                      │
│  ├─ Model metadata (7 days)                             │
│  ├─ Usage statistics (persistent)                        │
│  ├─ API keys (encrypted)                                │
│  └─ Parameter presets (persistent)                       │
├─────────────────────────────────────────────────────────┤
│  Python Model Cache                                       │
│  ├─ Downloaded models (disk)                            │
│  ├─ Loaded models (RAM/VRAM)                           │
│  └─ Model artifacts (cache)                              │
└─────────────────────────────────────────────────────────┘
```

### Cache Operations
```typescript
// Cache lifecycle management
class CacheManager {
  // Add model with metadata
  async addModel(model: CachedModel): Promise<void> {
    this.index.models.set(model.modelId, model);
    await this.enforceStorageLimit();
    this.persistIndex();
  }
  
  // Smart pruning based on usage
  async pruneOldModels(daysOld: number): Promise<number> {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const toRemove = Array.from(this.index.models.values())
      .filter(model => model.lastUsed < cutoff);
    
    for (const model of toRemove) {
      await this.removeModel(model.modelId);
    }
    return toRemove.length;
  }
  
  // LRU eviction when over limit
  private async enforceStorageLimit(): Promise<void> {
    const currentSize = await this.getTotalCacheSize();
    if (currentSize > this.storageLimitMB) {
      const models = Array.from(this.index.models.values())
        .sort((a, b) => a.lastUsed - b.lastUsed);
      
      let freedSize = 0;
      for (const model of models) {
        if (currentSize - freedSize <= this.storageLimitMB * 0.9) break;
        await this.removeModel(model.modelId);
        freedSize += model.estimatedSizeMB;
      }
    }
  }
}
```

## Telemetry Architecture

### Real-time Monitoring
```typescript
// 500ms update interval
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
      // Try Python backend first
      const serverStats = await fetchServerSystemStats();
      if (serverStats) {
        setTelemetry(prev => ({ ...prev, ...serverStats }));
      } else {
        // Fallback to browser measurements
        const browserStats = getSystemStats();
        setTelemetry(prev => ({ ...prev, ...browserStats }));
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return telemetry;
};
```

### Performance Metrics
```typescript
// Real-time TPS calculation during inference
const calculateTPS = (tokens: number, startTime: number): number => {
  const elapsed = (Date.now() - startTime) / 1000;
  return tokens / Math.max(elapsed, 0.1);
};

// Memory usage tracking
const trackMemoryUsage = async (): Promise<MemoryStats> => {
  if (window.performance.memory) {
    return {
      used: window.performance.memory.usedJSHeapSize,
      total: window.performance.memory.totalJSHeapSize,
      limit: window.performance.memory.jsHeapSizeLimit
    };
  }
  return null;
};
```

## Security Architecture

### Client-Side Security
```typescript
// API key encryption in localStorage
class SecureStorage {
  private encryptKey(key: string): string {
    // Simple XOR encryption (consider Web Crypto API for production)
    return btoa(key.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ 42)
    ).join(''));
  }
  
  setApiKey(provider: string, apiKey: string): void {
    const encrypted = this.encryptKey(apiKey);
    localStorage.setItem(`forge_api_key_${provider}`, encrypted);
  }
}
```

### Network Security
```python
# CORS configuration for Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (optional)
@app.middleware("http")
async def rate_limit(request: Request, call_next):
    # Implement rate limiting logic
    response = await call_next(request)
    return response
```

## Performance Optimizations

### Frontend Optimizations
```typescript
// Code splitting in vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("framer-motion")) return "framer-motion";
          if (id.includes("recharts")) return "recharts";
          if (id.includes("lucide-react")) return "icons";
        }
      }
    }
  }
});

// Lazy loading components
const ModelLibrary = lazy(() => import('./components/ModelLibrary'));
const TelemetryPanel = lazy(() => import('./components/TelemetryPanel'));
```

### Backend Optimizations
```python
# Model loading optimizations
def load_model_optimized(model_id: str):
    # Use quantization when available
    model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,  # Use FP16 for GPU
        device_map="auto",           # Automatic device placement
        low_cpu_mem_usage=True       # Reduce CPU memory usage
    )
    return model

# Streaming inference
async def stream_inference(model_id: str, prompt: str):
    # Generate tokens incrementally
    for token in model.generate_stream(prompt):
        yield {"token": token, "tps": calculate_tps()}
```

## Development Architecture

### Build System
```
Vite Build Process
├── TypeScript Compilation
├── React Component Processing
├── CSS/Tailwind Processing
├── Asset Optimization
├── Code Splitting
└── Bundle Analysis
```

### Testing Architecture
```
Testing Pyramid
├── E2E Tests (Playwright)
│   └── User workflows
├── Integration Tests
│   └── Provider interactions
├── Unit Tests (Vitest)
│   └── Component logic
└── Type Checking
    └── TypeScript compilation
```

This architecture enables FORGE to provide a seamless, performant, and secure AI model testing environment across multiple providers and interfaces.
