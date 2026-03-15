# Model Loading Guide

Complete guide to loading and managing AI models in FORGE.

## Table of Contents

- [Overview](#overview)
- [Supported Model Types](#supported-model-types)
- [Local Python Backend](#local-python-backend)
- [Provider Models](#provider-models)
- [Model Management](#model-management)
- [Troubleshooting](#troubleshooting)

## Overview

FORGE supports multiple ways to load models:

1. **Local Python Backend**: Load `.safetensor` models directly on your hardware
2. **OpenAI API**: Use OpenAI's hosted models
3. **HuggingFace API**: Use HuggingFace's inference API

Each method has different requirements and capabilities.

## Supported Model Types

### Text Generation Models
- **Transformers**: BERT, GPT-2, T5, BART, Llama, Mistral, Qwen
- **Formats**: `.safetensor`, `.bin`, `.pth`
- **Tasks**: Text generation, text-to-text, question answering

### Image Generation Models
- **Diffusion**: Stable Diffusion, DALL-E variants
- **Formats**: PyTorch checkpoints, SafeTensors
- **Tasks**: Text-to-image, image-to-image

### Audio Models
- **Speech**: TTS (text-to-speech), ASR (automatic speech recognition)
- **Formats**: WAV, MP3 output
- **Models**: Whisper, TTS models

### Video Models
- **Generation**: Text-to-video models
- **Formats**: MP4, GIF output
- **Models**: Experimental video generation models

## Local Python Backend

### Prerequisites

1. **Python 3.8+** installed
2. **PyTorch** with CUDA support (optional but recommended)
3. **Sufficient disk space** for model downloads
4. **GPU with adequate VRAM** for larger models

### Backend Setup

```bash
# Install dependencies
cd server
pip install -r requirements.txt

# Start the server
python model-server.py
```

The server will start on `http://localhost:5000`

### Loading Models

#### Automatic Loading
1. **Search for a model** in the model library
2. **Click "Load"** on the model card
3. **Monitor progress** through notifications

#### Manual Loading (Advanced)
```python
# Direct API call
import requests

response = requests.post('http://localhost:5000/load', json={
    'model_id': 'distilbert-base-uncased',
    'model_name': 'DistilBERT Base Uncased',
    'task': 'text-generation'
})

print(response.json())
```

### Model Formats

#### SafeTensors (Recommended)
- **Extension**: `.safetensors`
- **Advantages**: Secure, faster loading, cross-platform
- **Example**: `distilbert-base-uncased.safetensors`

#### PyTorch Checkpoints
- **Extension**: `.bin`, `.pth`
- **Advantages**: Widely supported
- **Example**: `pytorch_model.bin`

#### Sharded Models
- **Format**: Multiple files (model-00001-of-00002.bin)
- **Advantages**: Handles very large models
- **Example**: Llama-2-7B models

### Memory Requirements

| Model Size | VRAM Needed | RAM Needed | Disk Space |
|------------|-------------|------------|-----------|
| Small (100MB) | 2-4GB | 4-8GB | 500MB |
| Medium (1-3GB) | 6-12GB | 8-16GB | 5GB |
| Large (7-13GB) | 12-24GB | 16-32GB | 25GB |
| XL (30GB+) | 24-48GB | 32-64GB | 100GB+ |

### GPU Acceleration

#### CUDA Setup
```bash
# Check CUDA availability
nvidia-smi

# Verify PyTorch CUDA support
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"

# Install CUDA-enabled PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

#### CPU-Only Mode
If no GPU is available, models will automatically run on CPU:
```python
# Force CPU mode in model-server.py
device = "cpu"
```

## Provider Models

### OpenAI Models

#### Supported Models
```typescript
const OPENAI_MODELS = {
  'gpt-4o': { name: 'GPT-4o', context: 128000, cost: '$5.00/1M tokens' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', context: 128000, cost: '$0.15/1M tokens' },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', context: 128000, cost: '$10.00/1M tokens' },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', context: 16384, cost: '$0.50/1M tokens' },
  'dall-e-3': { name: 'DALL-E 3', modality: 'image', cost: '$0.04/image' },
  'tts-1': { name: 'TTS-1', modality: 'audio', cost: '$15.00/1M chars' },
  'whisper-1': { name: 'Whisper', modality: 'audio', cost: '$0.006/minute' }
};
```

#### API Key Setup
1. **Get API key** from [OpenAI Platform](https://platform.openai.com)
2. **Add key in FORGE**: Settings → Providers → OpenAI
3. **Validate key**: Click "Validate" to test connection

#### Usage
```typescript
// OpenAI models are available immediately after API key setup
// No local loading required
// Usage is billed per token/character
```

### HuggingFace Models

#### Access Requirements
- **Free tier**: Limited rate, some models restricted
- **Pro account**: Higher limits, access to gated models
- **Private models**: Requires organization membership

#### API Key Setup
1. **Get access token** from [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. **Add token in FORGE**: Settings → Providers → HuggingFace
3. **Validate token**: Click "Validate" to test connection

#### Model Access
```typescript
// Public models - available immediately
'microsoft/DialoGPT-medium'
'distilbert-base-uncased'
'gpt2'

// Gated models - require approval
'meta-llama/Llama-2-7b-hf'
'tiiuae/falcon-7b'

// Private models - require organization access
'your-organization/your-private-model'
```

## Model Management

### Loading States

#### States
- **Idle**: Model not loaded
- **Downloading**: Model being downloaded from HuggingFace
- **Loading**: Model being loaded into memory
- **Loaded**: Model ready for inference
- **Error**: Loading failed

#### Progress Tracking
```typescript
interface ModelLoadState {
  modelId: string;
  status: 'idle' | 'downloading' | 'loading' | 'loaded' | 'error';
  progress?: number;
  error?: string;
  lastError?: string;
  activatedAt: number;
}
```

### Model Persistence

#### Automatic Persistence
- **Loaded models**: Persist across browser sessions
- **Model metadata**: Stored in localStorage
- **Cache settings**: Remember user preferences

#### Manual Persistence
```typescript
// Save model to persistent cache
await cache.addModel({
  modelId: 'distilbert-base-uncased',
  name: 'DistilBERT Base Uncased',
  provider: 'huggingface',
  modality: 'text',
  estimatedSizeMB: 268,
  loadedAt: Date.now(),
  lastUsed: Date.now(),
  accessCount: 1
});
```

### Model Unloading

#### Automatic Unloading
- **Memory pressure**: Auto-unload when VRAM/RAM is low
- **Cache limits**: Unload oldest models when over limit
- **Session end**: Models unloaded when server restarts

#### Manual Unloading
1. **Click "Unload"** on model card
2. **Confirm action** in dialog
3. **Model removed** from memory and cache

### Cache Management

#### Storage Limits
- **Default limit**: 500MB
- **Adjustable**: Settings → Cache → Storage Limit
- **Auto-pruning**: Remove models older than 7 days

#### Cache Operations
```typescript
// Get cache statistics
const stats = await cache.getCacheStats();
console.log(`Cache: ${stats.totalModels} models, ${stats.totalSizeMB}MB`);

// Prune old models
const freedSpace = await cache.pruneOldModels(7);

// Clear all cache
const totalSize = await cache.clearAll();
```

## Recommended Models

### For Testing
- **distilbert-base-uncased**: Small (268MB), fast, good for testing
- **gpt2**: Very small (124MB), quick to load
- **bert-base-uncased**: Medium (420MB), widely used

### For Production
- **Llama-2-7b-hf**: Good balance of size and capability
- **mistralai/Mistral-7B-v0.1**: Excellent performance, open source
- **Qwen/Qwen-7B-Chat**: Strong chat capabilities

### For Specific Tasks
- **Code Generation**: `codeparrot/codeparrot-small`
- **Summarization**: `facebook/bart-large-cnn`
- **Translation**: `t5-base`
- **Question Answering**: `distilbert-base-cased-distilled-squad`

## Advanced Features

### Model Quantization

#### What is Quantization?
- Reduces model size by using lower precision numbers
- Trade-off: Slightly reduced accuracy for much smaller size
- Supported formats: INT8, INT4, FP16

#### Using Quantized Models
```bash
# Look for models with quantization in name
- 'TheBloke/Llama-2-7B-Chat-GGUF'
- 'TheBloke/Mistral-7B-Instruct-v0.1-GGUF'

# These models are much smaller but require specific loaders
```

### Model Sharding

#### What is Sharding?
- Splits large models into multiple files
- Enables loading very large models on limited hardware
- Requires more complex loading logic

#### Sharded Model Examples
```bash
# Llama-2-70B is split across multiple files
- meta-llama/Llama-2-70b-hf/
  - pytorch_model-00001-of-00015.bin
  - pytorch_model-00002-of-00015.bin
  - ...
```

### Custom Model Loading

#### Loading Custom Models
```python
# Add custom model to model-server.py
CUSTOM_MODELS = {
    'my-custom-model': {
        'task': 'text-generation',
        'model_class': AutoModelForCausalLM,
        'tokenizer_class': AutoTokenizer
    }
}

@app.post("/load/custom/{model_name}")
async def load_custom_model(model_name: str):
    # Custom loading logic
    pass
```

#### Model Configuration
```python
# Model-specific configuration
MODEL_CONFIGS = {
    'llama-2-7b': {
        'torch_dtype': torch.float16,
        'device_map': 'auto',
        'trust_remote_code': True
    }
}
```

## Troubleshooting

### Common Issues

#### Model Download Fails
```bash
# Check internet connection
curl -I https://huggingface.co

# Check HuggingFace access
python -c "from huggingface_hub import hf_hub_download; print('OK')"

# Try different model
# Some models may be temporarily unavailable
```

#### CUDA Out of Memory
```bash
# Check GPU memory
nvidia-smi

# Use smaller model
# Try distilbert instead of large BERT

# Force CPU mode
device = "cpu"  # In model-server.py
```

#### Model Loading Slow
```bash
# Check disk space
df -h

# Use SSD for model cache
# Models load much faster from SSD

# Check network speed
# Large models require fast internet
```

#### Model Not Found
```bash
# Verify model name
# Use organization/model format
'microsoft/DialoGPT-medium'  # Correct
'DialoGPT-medium'           # Incorrect

# Check model exists
# Visit huggingface.co/organization/model-name
```

### Debug Information

#### Backend Logs
```bash
# Check model-server.py output
# Look for error messages and warnings

# Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### Frontend Debugging
```bash
# Check browser console
# Look for network errors and JavaScript errors

# Monitor network requests
# Check API calls to localhost:5000
```

#### Model Information
```python
# Get detailed model info
from transformers import AutoConfig

config = AutoConfig.from_pretrained('model-name')
print(config)  # Shows model architecture and requirements
```

## Best Practices

### Model Selection

1. **Start Small**: Begin with smaller models to test setup
2. **Consider Hardware**: Choose models that fit your VRAM/RAM
3. **Task Appropriateness**: Select models designed for your use case
4. **License Compliance**: Ensure model license permits your use case

### Performance Optimization

1. **Use GPU**: GPU acceleration is 10-100x faster than CPU
2. **Batch Inference**: Process multiple prompts together
3. **Model Caching**: Keep frequently used models loaded
4. **Quantization**: Use quantized models for size-constrained environments

### Resource Management

1. **Monitor Memory**: Watch VRAM/RAM usage during loading
2. **Unload Unused Models**: Free memory when not needed
3. **Cache Management**: Regularly clean up old models
4. **Backup Configuration**: Save important model configurations

---

This guide covers all aspects of model loading in FORGE. For specific issues or advanced use cases, refer to the [API Reference](../api-reference.md) or [Troubleshooting Guide](../troubleshooting.md).
