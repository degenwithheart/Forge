# Python Backend API Reference

Complete API documentation for FORGE's Python FastAPI backend server.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Models API](#models-api)
- [Inference API](#inference-api)
- [Telemetry API](#telemetry-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The FORGE Python backend provides RESTful APIs for model management, inference, and system monitoring. The server runs on `http://localhost:5000` by default and supports both synchronous and streaming inference.

### Base URL
```
http://localhost:5000
```

### API Versioning
All endpoints are versioned under `/api/v1/`:
```
http://localhost:5000/api/v1/models
http://localhost:5000/api/v1/inference
http://localhost:5000/api/v1/telemetry
```

### Response Format
All responses follow a consistent JSON format:
```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Authentication

### API Key Authentication (Optional)

If API key authentication is enabled, include the API key in the header:
```http
X-API-Key: your-api-key-here
```

#### Enable Authentication
Set environment variables:
```bash
API_KEY_REQUIRED=true
API_KEY=your-secret-api-key
```

### Request Headers
```http
Content-Type: application/json
X-API-Key: your-api-key-here (if required)
```

## Models API

### List Loaded Models

Get a list of all currently loaded models.

#### Endpoint
```http
GET /api/v1/models
```

#### Response
```json
{
  "data": [
    "distilbert-base-uncased",
    "gpt2",
    "microsoft/DialoGPT-medium"
  ],
  "message": "Models retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X GET "http://localhost:5000/api/v1/models" \
  -H "Content-Type: application/json"
```

### Load Model

Load a model into memory for inference.

#### Endpoint
```http
POST /api/v1/models/load
```

#### Request Body
```json
{
  "model_id": "distilbert-base-uncased",
  "model_name": "DistilBERT Base Uncased",
  "task": "text-generation",
  "device": "auto"
}
```

#### Parameters
- `model_id` (required): HuggingFace model identifier
- `model_name` (optional): Display name for the model
- `task` (optional): Model task type (auto-detected if not provided)
- `device` (optional): Target device (`auto`, `cuda`, `cpu`, or specific GPU ID)

#### Response
```json
{
  "data": {
    "status": "loaded",
    "model_id": "distilbert-base-uncased",
    "task": "text-generation",
    "device": "cuda:0",
    "memory_footprint": 268435456,
    "load_time": 12.5
  },
  "message": "Model loaded successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X POST "http://localhost:5000/api/v1/models/load" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "model_name": "DistilBERT Base Uncased",
    "task": "text-generation"
  }'
```

### Unload Model

Unload a model from memory to free resources.

#### Endpoint
```http
POST /api/v1/models/unload/{model_id}
```

#### Parameters
- `model_id` (path): Model identifier to unload

#### Response
```json
{
  "data": {
    "message": "Model distilbert-base-uncased unloaded successfully",
    "memory_freed": 268435456
  },
  "message": "Model unloaded successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X POST "http://localhost:5000/api/v1/models/unload/distilbert-base-uncased" \
  -H "Content-Type: application/json"
```

### Get Model Information

Get detailed information about a loaded model.

#### Endpoint
```http
GET /api/v1/models/{model_id}
```

#### Parameters
- `model_id` (path): Model identifier

#### Response
```json
{
  "data": {
    "model_id": "distilbert-base-uncased",
    "task": "text-generation",
    "device": "cuda:0",
    "memory_footprint": 268435456,
    "loaded_at": 1642248600.0,
    "usage_count": 5,
    "last_used": 1642248800.0
  },
  "message": "Model information retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X GET "http://localhost:5000/api/v1/models/distilbert-base-uncased" \
  -H "Content-Type: application/json"
```

## Inference API

### Run Inference

Generate text using a loaded model.

#### Endpoint
```http
POST /api/v1/inference/run
```

#### Request Body
```json
{
  "model_id": "distilbert-base-uncased",
  "prompt": "What is artificial intelligence?",
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 256,
  "stream": false,
  "stop_sequences": ["\n", "Human:"]
}
```

#### Parameters
- `model_id` (required): Model identifier
- `prompt` (required): Input prompt for inference
- `temperature` (optional): Sampling temperature (0.0-2.0, default: 0.7)
- `top_p` (optional): Nucleus sampling parameter (0.0-1.0, default: 0.9)
- `max_tokens` (optional): Maximum tokens to generate (1-4096, default: 256)
- `stream` (optional): Enable streaming response (default: false)
- `stop_sequences` (optional): List of stop sequences

#### Response
```json
{
  "data": {
    "output": "Artificial intelligence is a branch of computer science...",
    "tokens_generated": 45,
    "inference_time": 2.3,
    "tokens_per_second": 19.6,
    "model_id": "distilbert-base-uncased"
  },
  "message": "Inference completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X POST "http://localhost:5000/api/v1/inference/run" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "prompt": "What is artificial intelligence?",
    "temperature": 0.7,
    "max_tokens": 256
  }'
```

### Stream Inference

Generate text with real-time streaming.

#### Endpoint
```http
POST /api/v1/inference/stream
```

#### Request Body
Same as regular inference, with `"stream": true`.

#### Response
Server-Sent Events (SSE) stream:
```
data: {"token": "Artificial", "index": 1, "finished": false, "tokens_per_second": 15.2}

data: {"token": " intelligence", "index": 2, "finished": false, "tokens_per_second": 18.7}

data: {"token": " is", "index": 3, "finished": false, "tokens_per_second": 20.1}

data: {"token": "", "index": 45, "finished": true, "tokens_per_second": 19.6}
```

#### Example
```bash
curl -X POST "http://localhost:5000/api/v1/inference/stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "prompt": "What is artificial intelligence?",
    "stream": true
  }'
```

### Batch Inference

Run inference on multiple prompts simultaneously.

#### Endpoint
```http
POST /api/v1/inference/batch
```

#### Request Body
```json
{
  "model_id": "distilbert-base-uncased",
  "prompts": [
    "What is AI?",
    "Explain machine learning",
    "How does deep learning work?"
  ],
  "temperature": 0.7,
  "max_tokens": 128
}
```

#### Response
```json
{
  "data": {
    "results": [
      {
        "prompt": "What is AI?",
        "output": "Artificial intelligence is...",
        "tokens_generated": 25,
        "inference_time": 1.2
      },
      {
        "prompt": "Explain machine learning",
        "output": "Machine learning is...",
        "tokens_generated": 30,
        "inference_time": 1.5
      }
    ],
    "total_time": 2.8,
    "total_tokens": 55
  },
  "message": "Batch inference completed successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X POST "http://localhost:5000/api/v1/inference/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "prompts": ["What is AI?", "Explain ML"],
    "max_tokens": 128
  }'
```

## Telemetry API

### Get System Telemetry

Get current system performance metrics.

#### Endpoint
```http
GET /api/v1/telemetry/system
```

#### Response
```json
{
  "data": {
    "timestamp": 1642248600.0,
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
  },
  "message": "Telemetry data retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X GET "http://localhost:5000/api/v1/telemetry/system" \
  -H "Content-Type: application/json"
```

### Get Model Performance

Get performance metrics for a specific model.

#### Endpoint
```http
GET /api/v1/telemetry/models/{model_id}
```

#### Parameters
- `model_id` (path): Model identifier

#### Response
```json
{
  "data": {
    "model_id": "distilbert-base-uncased",
    "device": "cuda:0",
    "memory_footprint": 268435456,
    "inference_stats": {
      "total_inferences": 10,
      "average_latency": 2.1,
      "average_tps": 18.5,
      "total_tokens": 1250,
      "total_time": 67.5
    },
    "last_inference": {
      "timestamp": 1642248600.0,
      "latency": 2.3,
      "tokens": 125,
      "tps": 54.3
    }
  },
  "message": "Model telemetry retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X GET "http://localhost:5000/api/v1/telemetry/models/distilbert-base-uncased" \
  -H "Content-Type: application/json"
```

### Get Performance History

Get historical performance data.

#### Endpoint
```http
GET /api/v1/telemetry/history
```

#### Query Parameters
- `start_time` (optional): Start timestamp (Unix timestamp)
- `end_time` (optional): End timestamp (Unix timestamp)
- `limit` (optional): Maximum number of records (default: 100)

#### Response
```json
{
  "data": {
    "records": [
      {
        "timestamp": 1642248600.0,
        "gpu_utilization": 0.75,
        "cpu_utilization": 0.45,
        "memory_usage": 8589934592,
        "active_inferences": 1,
        "loaded_models": 2
      },
      {
        "timestamp": 1642248660.0,
        "gpu_utilization": 0.80,
        "cpu_utilization": 0.50,
        "memory_usage": 8704012288,
        "active_inferences": 0,
        "loaded_models": 2
      }
    ],
    "total_records": 2
  },
  "message": "History retrieved successfully",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Example
```bash
curl -X GET "http://localhost:5000/api/v1/telemetry/history?limit=10" \
  -H "Content-Type: application/json"
```

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "Model 'nonexistent-model' not found",
    "details": {
      "model_id": "nonexistent-model",
      "available_models": ["distilbert-base-uncased", "gpt2"]
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `MODEL_NOT_FOUND` | 404 | Model not loaded or doesn't exist |
| `MODEL_ALREADY_LOADED` | 409 | Model is already loaded |
| `INVALID_PARAMETERS` | 400 | Invalid request parameters |
| `INFERENCE_FAILED` | 500 | Inference execution failed |
| `INSUFFICIENT_RESOURCES` | 503 | Not enough memory or GPU resources |
| `UNAUTHORIZED` | 401 | Invalid or missing API key |
| `RATE_LIMITED` | 429 | Too many requests |

### Error Examples

#### Model Not Found
```bash
curl -X GET "http://localhost:5000/api/v1/models/nonexistent-model"
```

Response:
```json
{
  "error": {
    "code": "MODEL_NOT_FOUND",
    "message": "Model 'nonexistent-model' not found",
    "details": {
      "model_id": "nonexistent-model",
      "available_models": ["distilbert-base-uncased", "gpt2"]
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### Invalid Parameters
```bash
curl -X POST "http://localhost:5000/api/v1/inference/run" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "temperature": 5.0,
    "max_tokens": -1
  }'
```

Response:
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid request parameters",
    "details": {
      "temperature": "Temperature must be between 0 and 2",
      "max_tokens": "Max tokens must be between 1 and 4096"
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

## Rate Limiting

### Default Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| Model Load/Unload | 10 requests/minute | 1 minute |
| Inference | 60 requests/minute | 1 minute |
| Telemetry | 120 requests/minute | 1 minute |
| System Info | 30 requests/minute | 1 minute |

### Rate Limit Response

When rate limits are exceeded:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {
      "limit": 60,
      "window": 60,
      "retry_after": 30
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Retry-After Header

Rate limited responses include a `Retry-After` header:
```http
Retry-After: 30
```

## Examples

### Complete Workflow

#### 1. Load a Model
```bash
curl -X POST "http://localhost:5000/api/v1/models/load" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "task": "text-generation"
  }'
```

#### 2. Check Model Status
```bash
curl -X GET "http://localhost:5000/api/v1/models/distilbert-base-uncased" \
  -H "Content-Type: application/json"
```

#### 3. Run Inference
```bash
curl -X POST "http://localhost:5000/api/v1/inference/run" \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "prompt": "What is artificial intelligence?",
    "temperature": 0.7,
    "max_tokens": 256
  }'
```

#### 4. Stream Inference
```bash
curl -X POST "http://localhost:5000/api/v1/inference/stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "model_id": "distilbert-base-uncased",
    "prompt": "Tell me a story",
    "stream": true
  }'
```

#### 5. Get Telemetry
```bash
curl -X GET "http://localhost:5000/api/v1/telemetry/system" \
  -H "Content-Type: application/json"
```

#### 6. Unload Model
```bash
curl -X POST "http://localhost:5000/api/v1/models/unload/distilbert-base-uncased" \
  -H "Content-Type: application/json"
```

### Python Client Example

```python
import requests
import json

class ForgeClient:
    def __init__(self, base_url="http://localhost:5000", api_key=None):
        self.base_url = base_url
        self.session = requests.Session()
        if api_key:
            self.session.headers.update({"X-API-Key": api_key})
    
    def load_model(self, model_id, task="text-generation"):
        response = self.session.post(
            f"{self.base_url}/api/v1/models/load",
            json={"model_id": model_id, "task": task}
        )
        response.raise_for_status()
        return response.json()
    
    def run_inference(self, model_id, prompt, **kwargs):
        response = self.session.post(
            f"{self.base_url}/api/v1/inference/run",
            json={
                "model_id": model_id,
                "prompt": prompt,
                **kwargs
            }
        )
        response.raise_for_status()
        return response.json()
    
    def stream_inference(self, model_id, prompt, **kwargs):
        response = self.session.post(
            f"{self.base_url}/api/v1/inference/stream",
            json={
                "model_id": model_id,
                "prompt": prompt,
                "stream": True,
                **kwargs
            },
            headers={"Accept": "text/event-stream"},
            stream=True
        )
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line.startswith("data: "):
                data = json.loads(line[6:])
                yield data
    
    def get_telemetry(self):
        response = self.session.get(
            f"{self.base_url}/api/v1/telemetry/system"
        )
        response.raise_for_status()
        return response.json()

# Usage
client = ForgeClient()

# Load model
result = client.load_model("distilbert-base-uncased")
print(f"Model loaded: {result['data']['status']}")

# Run inference
result = client.run_inference(
    "distilbert-base-uncased",
    "What is AI?",
    temperature=0.7,
    max_tokens=256
)
print(f"Generated: {result['data']['output']}")

# Stream inference
for chunk in client.stream_inference(
    "distilbert-base-uncased",
    "Tell me a story"
):
    print(chunk["token"], end="")
```

### JavaScript Client Example

```javascript
class ForgeClient {
  constructor(baseUrl = 'http://localhost:5000', apiKey = null) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      this.headers['X-API-Key'] = apiKey;
    }
  }
  
  async loadModel(modelId, task = 'text-generation') {
    const response = await fetch(`${this.baseUrl}/api/v1/models/load`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ model_id: modelId, task })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  async runInference(modelId, prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/v1/inference/run`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model_id: modelId,
        prompt,
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }
  
  async streamInference(modelId, prompt, options = {}) {
    const response = await fetch(`${this.baseUrl}/api/v1/inference/stream`, {
      method: 'POST',
      headers: {
        ...this.headers,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        model_id: modelId,
        prompt,
        stream: true,
        ...options
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield data;
        }
      }
    }
  }
}

// Usage
const client = new ForgeClient();

// Load model
client.loadModel('distilbert-base-uncased')
  .then(result => console.log('Model loaded:', result.data.status))
  .catch(error => console.error('Error:', error));

// Run inference
client.runInference('distilbert-base-uncased', 'What is AI?', {
  temperature: 0.7,
  max_tokens: 256
})
  .then(result => console.log('Generated:', result.data.output))
  .catch(error => console.error('Error:', error));

// Stream inference
(async () => {
  for await (const chunk of client.streamInference('distilbert-base-uncased', 'Tell me a story')) {
    process.stdout.write(chunk.token);
  }
})();
```

---

This API reference provides comprehensive documentation for all FORGE backend endpoints, enabling seamless integration with the Python model server.
