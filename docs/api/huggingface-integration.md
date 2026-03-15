# HuggingFace Integration

Complete guide to integrating HuggingFace's Inference API with FORGE for access to 200,000+ models.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Supported Models](#supported-models)
- [API Endpoints](#api-endpoints)
- [Integration Examples](#integration-examples)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Best Practices](#best-practices)

## Overview

FORGE integrates with HuggingFace's Inference API to provide access to over 200,000 models across text, image, audio, and video modalities. This integration serves as a powerful fallback when local models aren't available and provides access to specialized models.

### Integration Features

- **Massive Model Library**: 200,000+ models available
- **Multiple Modalities**: Text, image, audio, video models
- **Unified Interface**: Same parameter controls as local models
- **Smart Fallback**: Automatic fallback from local to API
- **Cost Tracking**: Usage monitoring and cost estimation

### API Base URL
```
https://api-inference.huggingface.co
```

## Authentication

### Access Token Setup

1. **Get Access Token** from [HuggingFace Settings](https://huggingface.co/settings/tokens)
2. **Add to FORGE**: Settings → Providers → HuggingFace
3. **Validate Token**: Test connection with validation endpoint

### Token Types

| Token Type | Permissions | Use Case |
|------------|-------------|----------|
| Read | Read-only access to public models | Basic inference |
| Write | Read + write access | Upload models, create spaces |
| Fine-grained | Custom permissions | Enterprise use |

### Token Format
HuggingFace tokens start with `hf_`:
```
hf_1234567890abcdef1234567890abcdef12345678
```

### Authentication Header
```http
Authorization: Bearer hf-your-token-here
```

### Environment Variable
```bash
HF_TOKEN=hf-your-token-here
```

## Supported Models

### Text Models

#### Text Generation
- **LLaMA 2**: `meta-llama/Llama-2-7b-hf`
- **Mistral**: `mistralai/Mistral-7B-v0.1`
- **Falcon**: `tiiuae/falcon-7b`
- **GPT-2**: `gpt2`
- **BLOOM**: `bigscience/bloom`

#### Text-to-Text
- **T5**: `t5-base`, `t5-large`
- **BART**: `facebook/bart-large-cnn`
- **Flan-T5**: `google/flan-t5-base`

#### Question Answering
- **BERT**: `bert-base-uncased`
- **RoBERTa**: `roberta-base`
- **DistilBERT**: `distilbert-base-uncased`

### Image Models

#### Text-to-Image
- **Stable Diffusion**: `runwayml/stable-diffusion-v1-5`
- **DALL-E Mini**: `dalle-mini/dalle-mini`
- **Kandinsky**: `kandinsky-community/kandinsky-2-2-decoder`

#### Image Classification
- **ViT**: `google/vit-base-patch16-224`
- **ResNet**: `microsoft/resnet-50`
- **EfficientNet**: `google/efficientnet-b0`

### Audio Models

#### Text-to-Speech
- **SpeechT5**: `microsoft/speecht5_tts`
- **VITS**: `microsoft/vits-ljs`

#### Speech-to-Text
- **Whisper**: `openai/whisper-base`
- **Wav2Vec2**: `facebook/wav2vec2-base`

### Model Configuration
```typescript
const HF_MODELS = {
  'meta-llama/Llama-2-7b-hf': {
    name: 'LLaMA 2 7B',
    provider: 'huggingface',
    modality: 'text',
    pipeline: 'text-generation',
    contextWindow: 4096,
    maxTokens: 2048,
    gated: true,
    costs: { token: 0.0001 } // Approximate
  },
  'mistralai/Mistral-7B-v0.1': {
    name: 'Mistral 7B',
    provider: 'huggingface',
    modality: 'text',
    pipeline: 'text-generation',
    contextWindow: 8192,
    maxTokens: 4096,
    gated: false,
    costs: { token: 0.0001 }
  },
  'runwayml/stable-diffusion-v1-5': {
    name: 'Stable Diffusion v1.5',
    provider: 'huggingface',
    modality: 'image',
    pipeline: 'text-to-image',
    contextWindow: 77,
    maxTokens: 77,
    gated: false,
    costs: { image: 0.01 }
  },
  'openai/whisper-base': {
    name: 'Whisper Base',
    provider: 'huggingface',
    modality: 'audio',
    pipeline: 'automatic-speech-recognition',
    gated: false,
    costs: { minute: 0.0006 }
  }
};
```

## API Endpoints

### Model Inference

#### Endpoint
```http
POST https://api-inference.huggingface.co/models/{model_id}
```

#### Request (Text Generation)
```json
{
  "inputs": "What is artificial intelligence?",
  "parameters": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_new_tokens": 256,
    "do_sample": true,
    "return_full_text": false,
    "stop": ["\n", "Human:", "Assistant:"]
  }
}
```

#### Response (Text Generation)
```json
[
  {
    "generated_text": "Artificial intelligence is a branch of computer science..."
  }
]
```

#### Request (Text-to-Image)
```json
{
  "inputs": "A cat wearing a spacesuit, digital art",
  "parameters": {
    "num_inference_steps": 50,
    "guidance_scale": 7.5,
    "width": 512,
    "height": 512
  }
}
```

#### Response (Image)
Binary image data (JPEG/PNG)

#### Request (Speech-to-Text)
```json
{
  "inputs": "audio_data_base64_encoded",
  "parameters": {
    "task": "automatic-speech-recognition",
    "language": "english"
  }
}
```

#### Response (Speech-to-Text)
```json
{
  "text": "Hello, world! This is a test of the speech recognition API."
}
```

### Model Information

#### Endpoint
```http
GET https://huggingface.co/api/models/{model_id}
```

#### Response
```json
{
  "modelId": "meta-llama/Llama-2-7b-hf",
  "author": "meta-llama",
  "sha": "1234567890abcdef",
  "lastModified": "2023-07-18T00:00:00.000Z",
  "tags": [
    "text-generation",
    "llama",
    "pytorch",
    "transformers",
    "arxiv:2307.09288"
  ],
  "pipeline_tag": "text-generation",
  "siblings": [
    {
      "rfilename": "pytorch_model.bin"
    },
    {
      "rfilename": "config.json"
    }
  ],
  "model-index": {
    "name": "meta-llama/Llama-2-7b-hf",
    "revision": "main",
    "tags": ["text-generation"]
  }
}
```

## Integration Examples

### JavaScript Integration

#### HuggingFace Client
```javascript
class HuggingFaceIntegration {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseUrl = 'https://api-inference.huggingface.co';
  }
  
  async runInference(modelId, inputs, parameters = {}, onProgress = null) {
    try {
      const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          parameters,
          ...(onProgress && { wait_for_model: true })
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'HuggingFace API error');
      }
      
      // Handle different response types
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('image/')) {
        // Image response
        const blob = await response.blob();
        return {
          type: 'image',
          content: URL.createObjectURL(blob),
          size: blob.size
        };
      } else if (contentType?.includes('audio/')) {
        // Audio response
        const blob = await response.blob();
        return {
          type: 'audio',
          content: URL.createObjectURL(blob),
          size: blob.size
        };
      } else {
        // JSON response
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Text generation response
          const generatedText = data[0]?.generated_text || '';
          
          return {
            type: 'text',
            content: generatedText,
            tokenCount: this.estimateTokens(generatedText)
          };
        } else if (data.text) {
          // Speech-to-text response
          return {
            type: 'text',
            content: data.text,
            tokenCount: this.estimateTokens(data.text)
          };
        } else {
          return {
            type: 'json',
            content: data
          };
        }
      }
    } catch (error) {
      throw error;
    }
  }
  
  async streamInference(modelId, inputs, parameters = {}, onChunk) {
    try {
      const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs,
          parameters: {
            ...parameters,
            stream: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start streaming');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              const token = parsed.token || parsed.text || '';
              
              if (token) {
                fullText += token;
                onChunk(token, fullText);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
      
      return {
        type: 'text',
        content: fullText,
        tokenCount: this.estimateTokens(fullText)
      };
    } catch (error) {
      throw error;
    }
  }
  
  async getModelInfo(modelId) {
    try {
      const response = await fetch(`https://huggingface.co/api/models/${modelId}`);
      
      if (!response.ok) {
        throw new Error('Model not found');
      }
      
      return response.json();
    } catch (error) {
      throw error;
    }
  }
  
  estimateTokens(text) {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
  
  async isModelAvailable(modelId) {
    try {
      const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: "test",
          parameters: { max_new_tokens: 1 }
        })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Usage in FORGE
const hf = new HuggingFaceIntegration(apiToken);

// Text generation
const result = await hf.runInference(
  'mistralai/Mistral-7B-v0.1',
  'What is artificial intelligence?',
  {
    temperature: 0.7,
    top_p: 0.9,
    max_new_tokens: 256,
    do_sample: true,
    return_full_text: false
  }
);

console.log('Generated text:', result.content);

// Image generation
const imageResult = await hf.runInference(
  'runwayml/stable-diffusion-v1-5',
  'A cat wearing a spacesuit, digital art',
  {
    num_inference_steps: 50,
    guidance_scale: 7.5,
    width: 512,
    height: 512
  }
);

console.log('Image URL:', imageResult.content);

// Speech-to-text
const audioFile = document.getElementById('audio-input').files[0];
const audioBase64 = await fileToBase64(audioFile);

const transcription = await hf.runInference(
  'openai/whisper-base',
  audioBase64,
  {
    task: 'automatic-speech-recognition',
    language: 'english'
  }
);

console.log('Transcription:', transcription.content);
```

### Python Integration

#### HuggingFace Client Wrapper
```python
import requests
import base64
import json
from typing import Dict, List, Optional, Union, AsyncGenerator

class HuggingFaceIntegration:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api-inference.huggingface.co"
        self.headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }
    
    async def run_inference(
        self,
        model_id: str,
        inputs: Union[str, bytes],
        parameters: Optional[Dict] = None,
        on_progress: Optional[callable] = None
    ) -> Dict[str, any]:
        """Run inference on a HuggingFace model"""
        
        payload = {"inputs": inputs}
        if parameters:
            payload["parameters"] = parameters
        
        if on_progress:
            payload["wait_for_model"] = True
        
        try:
            response = requests.post(
                f"{self.base_url}/models/{model_id}",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 401:
                raise Exception("Invalid HuggingFace token")
            elif response.status_code == 404:
                raise Exception(f"Model {model_id} not found")
            elif response.status_code == 429:
                raise Exception("Rate limit exceeded")
            elif response.status_code == 503:
                raise Exception("Model is loading, please try again")
            elif response.status_code != 200:
                raise Exception(f"API error: {response.text}")
            
            content_type = response.headers.get('content-type', '')
            
            if 'image/' in content_type:
                # Image response
                import tempfile
                import os
                
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp_file:
                    tmp_file.write(response.content)
                    return {
                        'type': 'image',
                        'content': tmp_file.name,
                        'size': len(response.content)
                    }
            
            elif 'audio/' in content_type:
                # Audio response
                with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as tmp_file:
                    tmp_file.write(response.content)
                    return {
                        'type': 'audio',
                        'content': tmp_file.name,
                        'size': len(response.content)
                    }
            
            else:
                # JSON response
                data = response.json()
                
                if isinstance(data, list) and len(data) > 0:
                    # Text generation response
                    generated_text = data[0].get('generated_text', '')
                    return {
                        'type': 'text',
                        'content': generated_text,
                        'token_count': self.estimate_tokens(generated_text)
                    }
                elif isinstance(data, dict) and 'text' in data:
                    # Speech-to-text response
                    return {
                        'type': 'text',
                        'content': data['text'],
                        'token_count': self.estimate_tokens(data['text'])
                    }
                else:
                    return {
                        'type': 'json',
                        'content': data
                    }
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")
    
    async def stream_inference(
        self,
        model_id: str,
        inputs: str,
        parameters: Optional[Dict] = None,
        on_chunk: Optional[callable] = None
    ) -> Dict[str, any]:
        """Stream inference for text generation"""
        
        payload = {
            "inputs": inputs,
            "parameters": {
                **(parameters or {}),
                "stream": True
            }
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/models/{model_id}",
                headers=self.headers,
                json=payload,
                stream=True,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"API error: {response.text}")
            
            full_text = ""
            
            for line in response.iter_lines():
                if line:
                    try:
                        if line.startswith(b'data: '):
                            data = json.loads(line[6:])
                            token = data.get('token', '')
                            
                            if token:
                                full_text += token
                                if on_chunk:
                                    on_chunk(token, full_text)
                    except json.JSONDecodeError:
                        continue
            
            return {
                'type': 'text',
                'content': full_text,
                'token_count': self.estimate_tokens(full_text)
            }
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")
    
    async def get_model_info(self, model_id: str) -> Dict:
        """Get model information"""
        
        try:
            response = requests.get(
                f"https://huggingface.co/api/models/{model_id}",
                timeout=10
            )
            
            if response.status_code == 404:
                raise Exception(f"Model {model_id} not found")
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            raise Exception(f"Network error: {str(e)}")
    
    async def is_model_available(self, model_id: str) -> bool:
        """Check if model is available for inference"""
        
        try:
            response = requests.post(
                f"{self.base_url}/models/{model_id}",
                headers=self.headers,
                json={
                    "inputs": "test",
                    "parameters": {"max_new_tokens": 1}
                },
                timeout=10
            )
            
            return response.status_code == 200
        
        except:
            return False
    
    def estimate_tokens(self, text: str) -> int:
        """Rough token estimation"""
        return max(1, len(text.split()))
    
    def audio_to_base64(self, audio_path: str) -> str:
        """Convert audio file to base64"""
        
        with open(audio_path, 'rb') as f:
            audio_data = f.read()
        
        return base64.b64encode(audio_data).decode('utf-8')

# Usage
async def main():
    hf = HuggingFaceIntegration(api_token)
    
    # Text generation
    result = await hf.run_inference(
        'mistralai/Mistral-7B-v0.1',
        'What is artificial intelligence?',
        {
            'temperature': 0.7,
            'top_p': 0.9,
            'max_new_tokens': 256,
            'do_sample': True,
            'return_full_text': False
        }
    )
    
    print(f"Generated text: {result['content']}")
    
    # Image generation
    image_result = await hf.run_inference(
        'runwayml/stable-diffusion-v1-5',
        'A cat wearing a spacesuit, digital art',
        {
            'num_inference_steps': 50,
            'guidance_scale': 7.5,
            'width': 512,
            'height': 512
        }
    )
    
    print(f"Image saved to: {image_result['content']}")
    
    # Speech-to-text
    audio_base64 = hf.audio_to_base64('input.wav')
    
    transcription = await hf.run_inference(
        'openai/whisper-base',
        audio_base64,
        {
            'task': 'automatic-speech-recognition',
            'language': 'english'
        }
    )
    
    print(f"Transcription: {transcription['content']}")

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
```

### FORGE Integration

#### Provider Implementation
```typescript
// src/src/lib/providers/huggingface.ts
export class HuggingFaceProvider {
  private apiToken: string;
  private baseUrl = 'https://api-inference.huggingface.co';
  
  constructor(apiToken: string) {
    this.apiToken = apiToken;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models/gpt2`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'test',
          parameters: { max_new_tokens: 1 }
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  
  async runInference(
    modelId: string,
    prompt: string,
    params: InferenceParams,
    onChunk?: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<InferenceResult> {
    try {
      const modelConfig = HF_MODELS[modelId];
      
      if (!modelConfig) {
        throw new Error(`Unknown HuggingFace model: ${modelId}`);
      }
      
      if (modelConfig.modality === 'text') {
        return await this.runTextInference(
          modelId,
          prompt,
          params,
          onChunk,
          onError
        );
      } else if (modelConfig.modality === 'image') {
        return await this.runImageInference(
          modelId,
          prompt,
          params
        );
      } else if (modelConfig.modality === 'audio') {
        if (modelConfig.pipeline === 'automatic-speech-recognition') {
          throw new Error('Audio input not supported in this context');
        } else {
          throw new Error('Audio generation not supported');
        }
      } else {
        throw new Error(`Unsupported modality: ${modelConfig.modality}`);
      }
    } catch (error) {
      if (onError) {
        onError(error.message);
      }
      throw error;
    }
  }
  
  private async runTextInference(
    modelId: string,
    prompt: string,
    params: InferenceParams,
    onChunk?: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    const hfParams = {
      temperature: params.temperature,
      top_p: params.topP,
      max_new_tokens: params.maxTokens,
      do_sample: params.temperature > 0,
      return_full_text: false,
      stop: params.stopSequences
    };
    
    try {
      if (onChunk) {
        // Try streaming (if supported)
        return await this.handleStreamingResponse(
          modelId,
          prompt,
          hfParams,
          startTime,
          onChunk
        );
      } else {
        // Non-streaming
        const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: hfParams
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'HuggingFace API error');
        }
        
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        if (Array.isArray(data) && data.length > 0) {
          const generatedText = data[0].generated_text || '';
          const tokenCount = this.estimateTokens(generatedText);
          
          return {
            content: generatedText,
            tokenCount,
            duration,
            tokensPerSecond: tokenCount / (duration / 1000),
            model: modelId,
            provider: 'huggingface',
            type: 'text'
          };
        } else {
          throw new Error('Unexpected response format');
        }
      }
    } catch (error) {
      if (onError) {
        onError(error.message);
      }
      throw error;
    }
  }
  
  private async handleStreamingResponse(
    modelId: string,
    prompt: string,
    params: any,
    startTime: number,
    onChunk: (text: string) => void
  ): Promise<InferenceResult> {
    // Note: HuggingFace streaming is experimental and not fully supported
    // This is a fallback to non-streaming with chunked updates
    
    const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          ...params,
          max_new_tokens: Math.min(params.max_new_tokens, 100) // Limit for streaming
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'HuggingFace API error');
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    
    if (Array.isArray(data) && data.length > 0) {
      const generatedText = data[0].generated_text || '';
      
      // Simulate streaming by chunking the response
      const words = generatedText.split(' ');
      let currentText = '';
      
      for (const word of words) {
        currentText += word + ' ';
        onChunk(word + ' ');
        await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
      }
      
      const tokenCount = this.estimateTokens(generatedText);
      
      return {
        content: generatedText,
        tokenCount,
        duration,
        tokensPerSecond: tokenCount / (duration / 1000),
        model: modelId,
        provider: 'huggingface',
        type: 'text'
      };
    } else {
      throw new Error('Unexpected response format');
    }
  }
  
  private async runImageInference(
    modelId: string,
    prompt: string,
    params: InferenceParams
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    const hfParams = {
      num_inference_steps: 50,
      guidance_scale: 7.5,
      width: 512,
      height: 512
    };
    
    const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: hfParams
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'HuggingFace API error');
    }
    
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    const duration = Date.now() - startTime;
    
    return {
      content: imageUrl,
      tokenCount: 1, // Count as 1 "token" for images
      duration,
      tokensPerSecond: 1 / (duration / 1000),
      model: modelId,
      provider: 'huggingface',
      type: 'image'
    };
  }
  
  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.max(1, Math.ceil(text.length / 4));
  }
}
```

## Error Handling

### Common Error Types

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| Invalid Token | 401 | Access token is invalid or missing |
| Model Not Found | 404 | Model doesn't exist or is private |
| Rate Limited | 429 | Too many requests |
| Model Loading | 503 | Model is currently loading |
| Inference Error | 500 | Inference execution failed |
| Content Policy | 400 | Input violates content policy |

### Error Response Format
```json
{
  "error": "Model is currently loading",
  "estimated_time": 20
}
```

### Error Handling Implementation
```typescript
const handleHuggingFaceError = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        return 'Invalid HuggingFace token. Please check your token configuration.';
      case 404:
        return 'Model not found. Please check the model ID and access permissions.';
      case 429:
        return 'Rate limit exceeded. Please try again later.';
      case 503:
        const estimatedTime = data?.estimated_time || 30;
        return `Model is loading. Please wait ${estimatedTime} seconds and try again.`;
      case 400:
        return data?.error || 'Invalid request parameters or content policy violation.';
      default:
        return 'HuggingFace API error. Please try again.';
    }
  } else if (error.request) {
    return 'Network error. Please check your internet connection.';
  } else {
    return 'Unexpected error occurred.';
  }
};
```

### Model Loading Handling
```typescript
const handleModelLoading = async (modelId: string, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await runInference(modelId, 'test', { max_new_tokens: 1 });
      return result;
    } catch (error) {
      if (error.status === 503 && attempt < maxRetries) {
        const waitTime = error.data?.estimated_time * 1000 || 10000;
        console.log(`Model loading, retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
};
```

## Rate Limits

### Free Tier Limits

| Metric | Limit | Period |
|--------|-------|--------|
| Requests | 30 requests/minute | 1 minute |
| Tokens | 20,000 tokens/minute | 1 minute |
| Concurrent | 2 concurrent requests | - |

### Pro Tier Limits

| Metric | Limit | Period |
|--------|-------|--------|
| Requests | 300 requests/minute | 1 minute |
| Tokens | 200,000 tokens/minute | 1 minute |
| Concurrent | 20 concurrent requests | - |

### Rate Limit Headers
```http
x-ratelimit-limit: 30
x-ratelimit-remaining: 29
x-ratelimit-reset: 60
```

### Rate Limit Handling
```typescript
const handleRateLimit = (response: Response) => {
  const remaining = response.headers.get('x-ratelimit-remaining');
  const reset = response.headers.get('x-ratelimit-reset');
  
  if (remaining === '0') {
    const resetMs = parseInt(reset || '60000');
    console.log(`Rate limit reached. Reset in ${resetMs}ms`);
    
    // Wait for reset
    return new Promise(resolve => setTimeout(resolve, resetMs));
  }
};
```

## Best Practices

### Model Selection

1. **Check Model Availability** before use
2. **Use Appropriate Models** for specific tasks
3. **Consider Model Size** for performance
4. **Check Access Requirements** for gated models
5. **Monitor Usage** to stay within limits

### Performance Optimization

1. **Batch Requests** when possible
2. **Use Streaming** for long generations
3. **Cache Responses** for repeated queries
4. **Optimize Parameters** for efficiency
5. **Handle Loading States** gracefully

### Cost Management

1. **Monitor Token Usage** carefully
2. **Use Smaller Models** when appropriate
3. **Optimize Prompts** to reduce tokens
4. **Set Reasonable Limits** for max tokens
5. **Track Usage** regularly

### Security Best Practices

1. **Never Expose Tokens** in client code
2. **Use Environment Variables** for tokens
3. **Validate Inputs** before sending
4. **Implement Rate Limiting** on your side
5. **Monitor for Abuse**

### Usage Monitoring

```typescript
const trackHFUsage = (model: string, tokens: number) => {
  const usage = {
    model,
    tokens,
    timestamp: Date.now(),
    provider: 'huggingface'
  };
  
  // Store in local storage
  const existing = JSON.parse(localStorage.getItem('hf-usage') || '[]');
  existing.push(usage);
  localStorage.setItem('hf-usage', JSON.stringify(existing));
  
  // Update UI
  updateUsageDisplay(existing);
  
  // Check limits
  const todayUsage = existing.filter(u => 
    new Date(u.timestamp).toDateString() === new Date().toDateString()
  );
  
  const todayTokens = todayUsage.reduce((sum, u) => sum + u.tokens, 0);
  
  if (todayTokens > 20000) {
    console.warn('Approaching daily token limit');
  }
};
```

### Model Availability Check

```typescript
const checkModelAvailability = async (modelId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${HF_BASE_URL}/models/${modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: 'test',
        parameters: { max_new_tokens: 1 }
      })
    });
    
    return response.ok;
  } catch {
    return false;
  }
};
```

---

This integration guide provides comprehensive documentation for using HuggingFace's Inference API with FORGE, enabling access to thousands of AI models across multiple modalities.
