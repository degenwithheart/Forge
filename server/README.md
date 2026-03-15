# FORGE Python Model Server

FastAPI server for loading and inferring on HuggingFace models with `.safetensor` weights.

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure (Optional - for gated models)
Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Then add your HuggingFace token:
```
HF_TOKEN=hf_xxxxxxxxxxxxx
```

To get a token:
1. Go to https://huggingface.co/settings/tokens
2. Create a new token with read access
3. Accept the license for gated models (Llama, Gemma, etc.) at their model pages

Alternative: Use `huggingface-cli login`

### 3. Start Server
```bash
python model-server.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:5000
INFO:     Application startup complete.
```

## API Endpoints

### GET `/info`
Returns server capabilities and device info
```json
{
  "device": "cuda",
  "cuda_available": true,
  "hf_token_available": true,
  "supported_tasks": ["text-generation", "text2text-generation", ...]
}
```

### POST `/load`
Load a model into memory
```json
{
  "model_id": "meta-llama/Llama-2-7b-hf",
  "model_name": "Llama 2 7B",
  "task": "text-generation"
}
```

Response:
```json
{
  "status": "loaded",
  "model_id": "meta-llama/Llama-2-7b-hf",
  "task": "text-generation",
  "device": "GPU",
  "message": "Model loaded successfully"
}
```

### POST `/infer`
Run inference on a loaded model
```json
{
  "model_id": "meta-llama/Llama-2-7b-hf",
  "prompt": "What is artificial intelligence?",
  "temperature": 0.7,
  "top_p": 0.95,
  "max_tokens": 256
}
```

Response:
```json
{
  "model_id": "meta-llama/Llama-2-7b-hf",
  "task": "text-generation",
  "prompt": "What is artificial intelligence?",
  "output": "Artificial intelligence refers to...",
  "status": "success"
}
```

### POST `/unload`
Remove a model from memory
```json
{
  "model_id": "meta-llama/Llama-2-7b-hf"
}
```

### GET `/models`
List all loaded models
```json
{
  "count": 2,
  "models": [
    {
      "model_id": "meta-llama/Llama-2-7b-hf",
      "name": "Llama 2 7B",
      "task": "text-generation"
    }
  ]
}
```

## Troubleshooting

### "Failed to load model: 'xxx'"
The model architecture is not recognized. Try:
- Use a more popular model (gpt2, bert-base, t5-small)
- Set the `task` parameter explicitly
- Check model exists on huggingface.co

### "You are trying to access a gated repo"
The model requires acceptance of license terms:
1. Visit the model page on huggingface.co
2. Click "Agree and access repository"
3. Set `HF_TOKEN` environment variable
4. Restart the server

### "CUDA out of memory"
Try:
- Using a smaller model
- Set device to CPU (edit model-server.py)
- Offload model to CPU (add `device_map="auto"`)

### Model downloads very slowly
First load downloads the entire model (50MB-300GB). Subsequent loads are instant from cache.

## Supported Models

Any model on HuggingFace with `.safetensor` weights:
- **Text Generation**: Llama, Qwen, Mistral, GPT2, GPT-Neo, etc.
- **Text-to-Text**: T5, BART, Pegasus, etc.
- **Feature Extraction**: BERT, RoBERTa, DistilBERT, etc.
- **Classification**: DistilBERT-base configs, etc.

## Performance Notes

- **First load**: Large download + compilation (10s - 5min depending on model)
- **Subsequent loads**: Instant
- **Inference**: Depends on model size (2-30 seconds per prompt typically)
- **Memory**: Models are cached in VRAM/RAM until unloaded

## Integration with FORGE Frontend

Frontend at `http://localhost:8080` automatically detects the server at `http://localhost:5000` and routes all model loading/inference through it.
