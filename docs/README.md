# FORGE - Local Intelligence

A mobile-first, multi-provider AI orchestration studio for testing, benchmarking, and running models from Hugging Face, OpenAI, and local Python backends.

**Built for model developers, fine-tuners, and AI researchers who need real testing capabilities.**

## 🚀 Quick Start

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

## 📖 Documentation Navigation

### For Users
- [**Installation Guide**](installation.md) - Complete setup instructions
- [**Quick Start**](quick-start.md) - 5-minute first run experience
- [**User Guides**](guides/) - Detailed usage instructions
- [**Troubleshooting**](troubleshooting.md) - Common issues and solutions

### For Developers
- [**Architecture Overview**](architecture.md) - System design and components
- [**API Reference**](api-reference.md) - Complete API documentation
- [**Development Guides**](development/) - Development and contribution
- [**Code Examples**](examples/) - Practical code examples

## 🎯 Key Features

### Multi-Provider Engine
- **Local Python Backend**: `.safetensor` models via FastAPI
- **OpenAI API**: GPT-4o, GPT-4o Mini, DALL-E 3, TTS-1, Whisper
- **HuggingFace API**: Fallback inference for any model
- **Smart Fallback**: Local → HF → OpenAI based on availability

### Real-time Telemetry & Control
- **Live Metrics**: VRAM, CPU, GPU usage, TPS (tokens/second)
- **Parameter Tuning**: Temperature, Top-P, Max Tokens, Context Window
- **Performance Tracking**: Token generation rates and timing
- **Memory Impact**: Estimated usage for parameter changes

### Advanced Cache Management
- **Smart Storage**: 500MB default limit with auto-pruning
- **Usage Tracking**: Last-used timestamps, access counts
- **Size Estimates**: Per-model storage tracking
- **Cleanup Tools**: 7-day prune, per-model removal, clear-all

### Dual-Interface Architecture
- **Mobile**: Controller mode with swipe-up telemetry
- **Desktop**: Three-panel studio layout
- **Responsive**: Optimized for each form factor
- **Unified State**: Same data, different presentation

## 🏗️ Technical Stack

### Frontend
- **React 18 + TypeScript** with Vite build system
- **TanStack Query** for server state management and caching
- **TailwindCSS + shadcn/ui** for component design system
- **Framer Motion** for animations and transitions

### Backend
- **Python FastAPI** server on localhost:5000
- **transformers library** for HuggingFace model loading
- **torch + accelerate** for GPU optimization
- **uvicorn** ASGI server with CORS support

## 🎭 Use Cases

### Model Development
- Validate fine-tuned models against base performance
- Test model behavior under different sampling strategies
- Benchmark inference costs vs output quality
- Prepare models before public deployment

### Research & Analysis
- Compare model architectures side-by-side
- Stress test with edge case prompts
- Analyze parameter sensitivity
- Document performance characteristics

### Production Preparation
- Simulate user inference patterns
- Test model switching scenarios
- Validate API key configurations
- Prepare for production workloads

## 🔒 Privacy & Security

- **Local Storage**: API keys stored only in browser
- **No Proxy**: Direct API calls to providers
- **Local Processing**: Models run on your machine when possible
- **No Tracking**: No analytics or telemetry collection
- **Private**: Nothing leaves device without explicit action

## 🤝 Contributing

We welcome contributions! See the [Contributing Guide](contributing.md) for details on:
- Development setup
- Code standards
- Testing requirements
- Pull request process

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **HuggingFace** for the amazing model ecosystem
- **OpenAI** for powerful API capabilities
- **React team** for the excellent framework
- **Vercel** for the Vite build tool

---

**Built for model developers, researchers, and AI builders.**

[GitHub Repository](https://github.com/degenwithheart/Forge) | [Report Issues](https://github.com/degenwithheart/Forge/issues) | [Discussions](https://github.com/degenwithheart/Forge/discussions)
