# FORGE - Local Intelligence

A mobile-first, multi-provider AI orchestration studio for testing, benchmarking, and running models from Hugging Face, OpenAI, and local Python backends.

**Built for model developers, fine-tuners, and AI researchers who need real testing capabilities.**

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Python backend (for local models)
cd ../server
pip install -r requirements.txt
python model-server.py

# 3. Start frontend
npm run dev

# 4. Open http://localhost:8080
```

---

## Architecture Overview

### Multi-Provider Engine
- **Local Python Backend**: `.safetensor` models via FastAPI
- **OpenAI API**: GPT-4o, GPT-4o Mini, DALL-E 3, TTS-1, Whisper
- **HuggingFace API**: Fallback inference for any model
- **Automatic Fallback**: Local → HF → OpenAI based on availability

### Frontend Stack
```
React 18 + TypeScript
├── Vite (build tool + dev server)
├── TanStack Query (state management)
├── TailwindCSS + shadcn/ui (design system)
├── Framer Motion (animations)
└── Lucide React (icons)
```

### Backend Stack
```
Python FastAPI
├── transformers (model loading)
├── torch (deep learning)
├── accelerate (GPU optimization)
└── uvicorn (ASGI server)
```

---

## Core Features

### 1. Multi-Provider Model Support
- **HuggingFace**: Full model library with live fetching
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, DALL-E 3, TTS-1, Whisper
- **Local Python**: Any `.safetensor` model via transformers library
- **Smart Fallback**: Automatic provider selection based on availability
- **Local Storage**: API keys stored securely, no data leaves device

### 2. Model Library by Modality
- **Text Generation**: Qwen, Llama, Mistral, GPT variants
- **Image Generation**: Stable Diffusion, DALL-E variants  
- **Audio**: Text-to-speech, speech recognition
- **Video**: Text-to-video models
- **Intelligent Caching**: 5-minute query cache for model metadata
- **Live Discovery**: Real-time model fetching from HuggingFace

### 3. Real-time Telemetry & Parameter Control
- **Live Metrics**: VRAM, CPU, GPU usage, TPS (tokens/second)
- **Parameter Tuning**: Temperature, Top-P, Max Tokens, Context Window
- **Memory Impact**: Estimated memory usage for parameter changes
- **Real-time Updates**: Changes apply to next inference
- **Performance Tracking**: Token generation rates and timing

### 4. Advanced Cache Management
- **Smart Storage**: 500MB default limit with auto-pruning
- **Usage Tracking**: Last-used timestamps, access counts
- **Size Estimates**: Per-model storage tracking
- **Cleanup Tools**: 7-day prune, per-model removal, clear-all
- **Persistence**: Survives browser sessions

### 5. Dual-Interface Architecture
- **Mobile**: Controller mode with swipe-up telemetry
- **Desktop**: Three-panel studio layout
- **Responsive**: Optimized for each form factor
- **Unified State**: Same data, different presentation

---

## Development Structure

### Key Components
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
- **TanStack Query**: Server state, caching, background updates
- **React State**: UI state, loading states, user interactions
- **localStorage**: Model persistence, cache metadata, API keys
- **Real-time**: Telemetry updates every 500ms

### Data Flow
1. **Model Discovery**: Live fetching from HuggingFace API
2. **Metadata Caching**: 5-minute cache for model information
3. **Model Loading**: Python backend handles `.safetensor` models
4. **Inference**: Streaming with real-time TPS calculation
5. **Persistence**: State survives page refreshes

---

## Available Scripts

```bash
npm run dev          # Start development server
npm run dev:full     # Start both frontend and Python backend
npm run build        # Build for production
npm run build:dev    # Build in development mode
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
```

---

## Python Backend Setup

For local model loading, the Python backend must be running:

```bash
cd server
pip install -r requirements.txt
python model-server.py
```

The backend runs on `http://localhost:5000` and supports:
- Model loading/unloading
- Real-time inference with streaming
- GPU/CPU automatic detection
- Multiple model support

---

## Privacy & Security

- **Local Storage**: API keys stored only in browser
- **No Proxy**: Direct API calls to providers
- **Local Processing**: Models run on your machine when possible
- **No Tracking**: No analytics or telemetry collection
- **Private**: Nothing leaves device without explicit action

---

## Intended Users

- **Model Developers**: Test and validate fine-tuned models
- **AI Researchers**: Benchmark and compare model performance
- **Prompt Engineers**: Optimize parameters and workflows
- **Indie Builders**: Experiment with different providers
- **ML Engineers**: Prepare models for production deployment

---

## Repository

**GitHub**: https://github.com/degenwithheart/Forge

**Maintained by**: @degenwithheart

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.