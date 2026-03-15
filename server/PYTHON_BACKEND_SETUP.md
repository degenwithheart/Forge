# FORGE Model Loading Setup - Python Backend

## Overview
FORGE uses a **Python FastAPI backend** to support `.safetensor` models from HuggingFace. This enables loading ANY model format that the transformers library supports, providing local inference capabilities alongside cloud-based APIs.

## Architecture

```
Frontend (React/Vite + TypeScript)
    ↓
useForgeEngine Hook (state management)
    ↓
ModelCard.tsx (user clicks Load)
    ↓
model-loader.ts (API calls + progress tracking)
    ↓
Python FastAPI Server (localhost:5000)
    ↓
transformers library (loads .safetensor/.bin models)
    ↓
GPU/CPU inference with streaming
```

## Key Components

### Frontend (src/src/)
- **useForgeEngine.ts**: Central state management hook
- **model-loader.ts**: Python backend API client
- **cache-db.ts**: Local storage cache system
- **streaming.ts**: Real-time streaming for all providers
- **types/models.ts**: TypeScript interfaces and OpenAI model mapping

### Backend (server/)
- **model-server.py**: FastAPI server with model loading
- **requirements.txt**: Python dependencies
- **Port**: 5000 (configurable)

### Data Flow
1. Model metadata cached in localStorage (7-day expiry)
2. Loading state tracked in React state + localStorage
3. Inference streamed in real-time with TPS calculation
4. Telemetry updated continuously (500ms intervals)

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd server
pip install -r requirements.txt
```

**What gets installed:**
- `fastapi` - REST API framework
- `uvicorn` - ASGI server
- `torch` - Deep learning framework
- `transformers` - Model loading library
- `accelerate` - GPU optimization

### 2. Start Python Model Server

```bash
cd server
python model-server.py
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:5000
INFO:     Application startup complete
```

Server runs on: **http://localhost:5000**

### 3. Start Frontend (in another terminal)

```bash
cd src
npm run dev
```

Frontend runs on: **http://localhost:8080**

## Testing Model Loading

### Step 1: Load a Model
1. Open http://localhost:8080
2. Browse or search for a model (e.g., "Qwen/Qwen3-VL-7B-Instruct")
3. Click **Load** button
4. Watch toast notifications:
   - "📥 Loading Qwen3..."
   - "⚙️ Initializing text-generation pipeline..."
   - "✅ Qwen3 ready!"

### Step 2: Run Inference
1. Enter a prompt in PromptInput component
2. Click **Run** (or press Ctrl+Enter)
3. Watch real-time streaming in OutputStream
4. Telemetry shows live TPS (tokens/second)
5. Results stored in inference history

### Step 3: Verify Persistence
1. Refresh browser page
2. Model should still show as "loaded" (from localStorage metadata)
3. Can run inference immediately without reloading
4. Cache manager tracks usage statistics

## Advanced Features

### Multi-Provider Support
- **Local Python**: Highest performance, no API costs
- **OpenAI**: GPT-4o, GPT-4o Mini, DALL-E 3, TTS-1, Whisper
- **HuggingFace**: Fallback when local not available
- **Automatic fallback**: Local → HF → OpenAI based on availability

### Real-time Telemetry
- **VRAM Usage**: Actual GPU memory from Python backend
- **CPU Usage**: System monitoring with fallback
- **TPS**: Live tokens/second during generation
- **Model Count**: Currently loaded models tracking

### Cache Management
- **Smart Caching**: 5-minute query cache for model metadata
- **Local Storage**: Model loading state persists across sessions
- **Size Tracking**: Estimated model sizes with storage limits
- **Auto-pruning**: 7-day automatic cleanup option
- **Manual Control**: Per-model removal with statistics

### Parameter Controls
- **Temperature**: 0.0-2.0 (default 0.7)
- **Top-P**: 0.0-1.0 (default 0.9)
- **Max Tokens**: 1-4096 (default 256)
- **Context Window**: 512-32768 (default 4096)
- **Real-time Updates**: Changes apply to next inference

## Supported Models

Any model on HuggingFace with `.safetensor` weights:
- **Text Generation**: Qwen, Llama, Mistral, GPT2, etc.
- **Text-to-Text**: T5, BART, Pegasus, etc.
- **Feature Extraction**: BERT, RoBERTa, etc.
- **Question Answering**: DistilBERT-QA, etc.

### Example Models to Try
```
- Qwen/Qwen3-VL-7B-Instruct (multimodal)
- meta-llama/Llama-2-7b-hf
- mistralai/Mistral-7B-v0.1
- google/t5-small (text2text)
- distilbert-base-uncased (fast, small)
```

## Troubleshooting

### Error: "Python model server not running"
**Solution:** Start the server with `python model-server.py` in `/server` directory

### Error: "Model not found on HuggingFace"
**Solution:** Check model name is correct. Use `organization/model-name` format.

### Error: Model takes forever to download
**Solution:** This is normal! First load downloads full model weights (50MB-300GB depending on model). Subsequent loads are cached.

### Error: "CUDA out of memory"
**Solution:** Use smaller models or enable CPU-only mode:
```python
# In model-server.py, change device detection
device = -1  # Force CPU
```

## Performance Tips

- **First Load**: Largest time investment (download + caching)
- **Subsequent Loads**: ~1-2 seconds from cache
- **Inference**: Depends on model size and GPU
- **Multi-Model**: Can load multiple models, but uses more VRAM

## API Endpoints (Reference)

### Python Backend (localhost:5000)
```http
GET  /              - Server status and capabilities
GET  /info          - Device info, loaded models, supported tasks
POST /load          - Load model: {model_id, model_name, task}
POST /infer         - Run inference: {model_id, prompt, temperature, top_p, max_tokens}
POST /unload        - Unload model: {model_id}
GET  /models        - List currently loaded models
```

### Frontend API Integration
- **model-loader.ts**: Handles all Python backend communication
- **streaming.ts**: Unified streaming for all providers
- **useForgeEngine.ts**: Central state management
- **Cache persistence**: localStorage with 500MB default limit

## Code Structure

### Core Files
```
src/src/
├── hooks/
│   ├── useForgeEngine.ts      # Central state management
│   ├── useModelCache.ts       # Cache operations
│   └── useProviders.ts        # API key management
├── lib/
│   ├── model-loader.ts        # Python backend client
│   ├── streaming.ts           # Multi-provider streaming
│   ├── cache-db.ts            # Local storage system
│   └── telemetry-client.ts    # System monitoring
├── components/
│   ├── DesktopLayout.tsx      # 3-panel desktop UI
│   ├── MobileLayout.tsx       # Mobile controller UI
│   ├── ModelCard.tsx          # Model loading interface
│   └── TelemetryPanel.tsx     # Real-time metrics
└── types/
    └── models.ts              # TypeScript definitions
```

### State Management
- **React Query**: Server state, caching, background updates
- **Local State**: useState for UI, loading states
- **localStorage**: Model persistence, cache metadata
- **Real-time**: Telemetry updates every 500ms

## Development Workflow

### Adding New Providers
1. Update `types/models.ts` with provider type
2. Add streaming function in `lib/streaming.ts`
3. Update `useProviders.ts` for API key management
4. Modify `useForgeEngine.ts` inference logic

### Adding New Modalities
1. Update `Modality` type in `types/models.ts`
2. Add pipeline tags to `MODALITY_MAP`
3. Update model loading logic in `model-loader.ts`
4. Add UI components if needed

### Performance Optimization
- **Chunk splitting**: Large libraries split in vite.config.ts
- **Lazy loading**: Components loaded on demand
- **Cache limits**: 500MB localStorage with auto-pruning
- **Debouncing**: API calls and UI updates

## Troubleshooting

### Common Issues
**Error: "Python model server not running"**
```bash
# Solution: Start the server
cd server
python model-server.py
# Should see: Uvicorn running on http://0.0.0.0:5000
```

**Error: "Model not found on HuggingFace"**
- Verify model name format: `organization/model-name`
- Check model exists on huggingface.co
- Ensure model has .safetensor weights

**Error: "CUDA out of memory"**
```python
# In model-server.py, force CPU mode
device = -1  # Override auto-detection
```

**Error: "Failed to load model"**
- Check internet connection for first download
- Verify sufficient disk space (models can be 50MB-300GB)
- Check Python dependencies: `pip install -r requirements.txt`

### Performance Issues
**Slow first load**: Normal - downloading full model weights
**Slow inference**: Check GPU availability, model size
**High memory usage**: Unload unused models, enable CPU mode
**Cache full**: Use cache manager to clear old models

## Security & Privacy

### Data Protection
- **API Keys**: Stored only in browser localStorage
- **No Backend Proxy**: Direct API calls to providers
- **Local Processing**: Models run on your machine
- **No Telemetry**: No analytics or tracking

### Network Security
- **CORS Enabled**: Python backend allows frontend access
- **Local Only**: Backend binds to localhost only
- **API Validation**: Keys validated before use
- **Error Handling**: Sensitive data stripped from errors

## Next Steps

### Immediate (Implemented)
- ✅ Python FastAPI backend with model loading
- ✅ Real-time streaming inference
- ✅ Multi-provider support (Local, OpenAI, HF)
- ✅ Cache management with pruning
- ✅ Mobile and desktop layouts
- ✅ Telemetry monitoring

### Short Term
- 🔄 GGUF model support for smaller models
- 🔄 WebGPU inference for browser-only models
- 🔄 Benchmark export functionality
- 🔄 Model comparison interface

### Long Term
- 📋 Plugin architecture for custom providers
- 📋 Multi-model ensemble testing
- 📋 Distributed inference support
- 📋 Advanced benchmarking suite
