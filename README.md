# FORGE - Local Intelligence

![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://img.shields.io/badge/build-stable-brightgreen)
![Providers](https://img.shields.io/badge/providers-Local%20%7C%20OpenAI%20%7C%20HuggingFace-blue)
![UI](https://img.shields.io/badge/ui-mobile%20%2B%20desktop-purple)
![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.8-blue)
![React](https://img.shields.io/badge/react-18.3-blue)
![Python](https://img.shields.io/badge/python-3.8%2B-blue)

Local-first AI orchestration studio for model development and testing.

## Quick Stats
- **3 Providers**: Local Python, OpenAI, HuggingFace
- **4 Modalities**: Text, Image, Audio, Video
- **2 Interfaces**: Mobile controller + Desktop studio
- **500MB Cache**: Intelligent storage with auto-pruning
- **Real-time**: 500ms telemetry updates

## Core Features
- **Multi-provider inference** with smart fallback
- **Real-time telemetry** (VRAM, CPU, TPS monitoring)
- **Parameter tuning** (Temperature, Top-P, Max Tokens, Context)
- **Advanced caching** with usage tracking and pruning
- **Dual interface design** optimized for each form factor
- **Streaming inference** with true real-time token generation

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for state management
- **TailwindCSS + shadcn/ui** for design
- **Framer Motion** for animations

### Backend
- **Python FastAPI** on localhost:5000
- **transformers** library for model loading
- **torch + accelerate** for GPU support
- **uvicorn** ASGI server

### Development
- **ESLint** for code quality
- **TypeScript** for type safety

## Supported Models
- **Text Generation**: Qwen, Llama, Mistral, GPT variants
- **Image Generation**: Stable Diffusion, DALL-E 3
- **Audio**: TTS-1, Whisper
- **Video**: Text-to-video models

## Privacy & Security
- **Zero tracking**: No analytics or data collection
- **Local storage**: API keys never leave browser
- **Direct connections**: No backend proxy
- **Manual triggers**: Inference only on user action

---

**Built for model developers, researchers, and AI builders.**

GitHub: https://github.com/degenwithheart/Forge
