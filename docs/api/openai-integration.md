# OpenAI API Integration

Complete guide to integrating OpenAI's API with FORGE for GPT-4o, DALL-E 3, TTS, and Whisper models.

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

FORGE integrates with OpenAI's API to provide access to GPT-4o, GPT-4o Mini, DALL-E 3, TTS-1, and Whisper models. This integration allows users to leverage OpenAI's powerful models alongside local models in a unified interface.

### Integration Features

- **Unified Interface**: Same parameter controls as local models
- **Streaming Support**: Real-time text generation
- **Cost Tracking**: Token usage and cost estimation
- **Fallback Logic**: Automatic fallback to other providers
- **Error Handling**: Comprehensive error management

### API Base URL
```
https://api.openai.com/v1
```

## Authentication

### API Key Setup

1. **Get API Key** from [OpenAI Platform](https://platform.openai.com)
2. **Add to FORGE**: Settings → Providers → OpenAI
3. **Validate Key**: Test connection with validation endpoint

### API Key Format
OpenAI API keys start with `sk-`:
```
sk-1234567890abcdef1234567890abcdef12345678
```

### Authentication Header
```http
Authorization: Bearer sk-your-api-key-here
```

### Environment Variable
```bash
OPENAI_API_KEY=sk-your-api-key-here
```

## Supported Models

### Text Models

| Model | Context Window | Input Cost | Output Cost | Features |
|-------|----------------|------------|-------------|----------|
| gpt-4o | 128,000 | $5.00/1M | $15.00/1M | Text, Vision, Code |
| gpt-4o-mini | 128,000 | $0.15/1M | $0.60/1M | Text, Vision, Code |
| gpt-4-turbo | 128,000 | $10.00/1M | $30.00/1M | Text, Vision |
| gpt-3.5-turbo | 16,384 | $0.50/1M | $1.50/1M | Text, Code |

### Image Models

| Model | Resolution | Cost | Features |
|-------|-------------|------|----------|
| dall-e-3 | 1024x1024, 1792x1024, 1024x1792 | $0.04/image | High quality, prompt adherence |

### Audio Models

| Model | Cost | Features |
|-------|------|----------|
| tts-1 | $15.00/1M chars | Text-to-speech, 6 voices |
| whisper-1 | $0.006/minute | Speech-to-text, 99 languages |

### Model Configuration
```typescript
const OPENAI_MODELS = {
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'openai',
    modality: 'text',
    pipeline: 'text-generation',
    contextWindow: 128000,
    maxTokens: 4096,
    costs: { input: 0.005, output: 0.015 }
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    provider: 'openai',
    modality: 'text',
    pipeline: 'text-generation',
    contextWindow: 128000,
    maxTokens: 4096,
    costs: { input: 0.00015, output: 0.0006 }
  },
  'dall-e-3': {
    name: 'DALL-E 3',
    provider: 'openai',
    modality: 'image',
    pipeline: 'text-to-image',
    contextWindow: 4000,
    costs: { image: 0.04 }
  },
  'tts-1': {
    name: 'TTS-1',
    provider: 'openai',
    modality: 'audio',
    pipeline: 'text-to-speech',
    costs: { character: 0.000015 }
  },
  'whisper-1': {
    name: 'Whisper',
    provider: 'openai',
    modality: 'audio',
    pipeline: 'speech-to-text',
    costs: { minute: 0.000006 }
  }
};
```

## API Endpoints

### Chat Completions

#### Endpoint
```http
POST https://api.openai.com/v1/chat/completions
```

#### Request
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "What is artificial intelligence?"
    }
  ],
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 256,
  "stream": false,
  "stop": ["\n", "Human:", "Assistant:"]
}
```

#### Response
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4o",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Artificial intelligence is..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 56,
    "completion_tokens": 31,
    "total_tokens": 87
  }
}
```

### Streaming Chat Completions

#### Request
```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "Tell me a story"
    }
  ],
  "stream": true,
  "temperature": 0.7
}
```

#### Response (Server-Sent Events)
```
data: {"id": "chatcmpl-123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4o", "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": null}]}

data: {"id": "chatcmpl-123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4o", "choices": [{"index": 0, "delta": {"content": "Once"}, "finish_reason": null}]}

data: {"id": "chatcmpl-123", "object": "chat.completion.chunk", "created": 1677652288, "model": "gpt-4o", "choices": [{"index": 0, "delta": {"content": " upon"}, "finish_reason": null}]}

data: [DONE]
```

### Image Generation

#### Endpoint
```http
POST https://api.openai.com/v1/images/generations
```

#### Request
```json
{
  "model": "dall-e-3",
  "prompt": "A cat wearing a spacesuit, digital art",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid"
}
```

#### Response
```json
{
  "created": 1677652288,
  "data": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/private/...",
      "revised_prompt": "A cat wearing a futuristic spacesuit..."
    }
  ]
}
```

### Text-to-Speech

#### Endpoint
```http
POST https://api.openai.com/v1/audio/speech
```

#### Request
```json
{
  "model": "tts-1",
  "input": "Hello, world! This is a test of the text-to-speech API.",
  "voice": "alloy",
  "response_format": "mp3"
}
```

#### Response
Binary audio data (MP3 file)

### Speech-to-Text

#### Endpoint
```http
POST https://api.openai.com/v1/audio/transcriptions
```

#### Request (multipart/form-data)
```
file: [audio file]
model: whisper-1
language: en
response_format: json
```

#### Response
```json
{
  "text": "Hello, world! This is a test of the speech-to-text API."
}
```

## Integration Examples

### JavaScript Integration

#### Streaming Text Generation
```javascript
class OpenAIIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.openai.com/v1';
  }
  
  async streamChatCompletion(model, messages, params, onChunk, onError) {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: params.temperature,
          top_p: params.topP,
          max_tokens: params.maxTokens,
          stop: params.stopSequences
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let tokenCount = 0;
      const startTime = Date.now();
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              const duration = Date.now() - startTime;
              return {
                fullText,
                tokenCount,
                duration,
                tokensPerSecond: tokenCount / (duration / 1000)
              };
            }
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices[0]?.delta?.content || '';
              
              if (delta) {
                fullText += delta;
                tokenCount += delta.split(/\s+/).length;
                
                const tps = tokenCount / ((Date.now() - startTime) / 1000);
                onChunk(delta, tps);
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
      
    } catch (error) {
      onError(error.message);
      throw error;
    }
  }
  
  async generateImage(model, prompt, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: options.size || '1024x1024',
          quality: options.quality || 'standard',
          style: options.style || 'vivid'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt
      };
      
    } catch (error) {
      throw error;
    }
  }
  
  async textToSpeech(model, text, voice = 'alloy') {
    try {
      const response = await fetch(`${this.baseUrl}/audio/speech`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: text,
          voice,
          response_format: 'mp3'
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.blob();
      
    } catch (error) {
      throw error;
    }
  }
  
  async speechToText(model, audioFile) {
    try {
      const formData = new FormData();
      formData.append('file', audioFile);
      formData.append('model', model);
      formData.append('response_format', 'json');
      
      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.text;
      
    } catch (error) {
      throw error;
    }
  }
}

// Usage in FORGE
const openai = new OpenAIIntegration(apiKey);

// Stream text generation
const result = await openai.streamChatCompletion(
  'gpt-4o',
  [{ role: 'user', content: 'What is AI?' }],
  { temperature: 0.7, topP: 0.9, maxTokens: 256 },
  (chunk, tps) => {
    console.log(chunk);
    console.log(`TPS: ${tps}`);
  },
  (error) => {
    console.error('Error:', error);
  }
);

// Generate image
const imageResult = await openai.generateImage(
  'dall-e-3',
  'A cat wearing a spacesuit',
  { size: '1024x1024', quality: 'standard' }
);
console.log('Image URL:', imageResult.url);

// Text-to-speech
const audioBlob = await openai.textToSpeech(
  'tts-1',
  'Hello, world!',
  'alloy'
);
const audioUrl = URL.createObjectURL(audioBlob);

// Speech-to-text
const transcription = await openai.speechToText(
  'whisper-1',
  audioFile
);
console.log('Transcription:', transcription);
```

### Python Integration

#### OpenAI Client Wrapper
```python
import openai
import asyncio
from typing import Dict, List, Optional, AsyncGenerator

class OpenAIIntegration:
    def __init__(self, api_key: str):
        self.client = openai.AsyncOpenAI(api_key=api_key)
    
    async def stream_chat_completion(
        self,
        model: str,
        messages: List[Dict[str, str]],
        params: Dict,
        on_chunk: callable,
        on_error: callable
    ) -> Dict[str, any]:
        try:
            stream = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=params.get('temperature', 0.7),
                top_p=params.get('top_p', 0.9),
                max_tokens=params.get('max_tokens', 256),
                stop=params.get('stop_sequences'),
                stream=True
            )
            
            full_text = ""
            token_count = 0
            start_time = asyncio.get_event_loop().time()
            
            async for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    content = chunk.choices[0].delta.content
                    full_text += content
                    token_count += len(content.split())
                    
                    elapsed = asyncio.get_event_loop().time() - start_time
                    tps = token_count / max(elapsed, 0.001)
                    
                    on_chunk(content, tps)
            
            duration = (asyncio.get_event_loop().time() - start_time) * 1000
            
            return {
                'full_text': full_text,
                'token_count': token_count,
                'duration': duration,
                'tokens_per_second': token_count / (duration / 1000)
            }
            
        except Exception as error:
            on_error(str(error))
            raise
    
    async def generate_image(
        self,
        model: str,
        prompt: str,
        **kwargs
    ) -> Dict[str, any]:
        try:
            response = await self.client.images.generate(
                model=model,
                prompt=prompt,
                n=1,
                size=kwargs.get('size', '1024x1024'),
                quality=kwargs.get('quality', 'standard'),
                style=kwargs.get('style', 'vivid')
            )
            
            return {
                'url': response.data[0].url,
                'revised_prompt': response.data[0].revised_prompt
            }
            
        except Exception as error:
            raise
    
    async def text_to_speech(
        self,
        model: str,
        text: str,
        voice: str = 'alloy'
    ) -> bytes:
        try:
            response = await self.client.audio.speech.create(
                model=model,
                input=text,
                voice=voice,
                response_format='mp3'
            )
            
            return response.content
            
        except Exception as error:
            raise
    
    async def speech_to_text(
        self,
        model: str,
        audio_file: bytes,
        filename: str = 'audio.mp3'
    ) -> str:
        try:
            from io import BytesIO
            import tempfile
            
            # Create a temporary file
            with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp_file:
                tmp_file.write(audio_file)
                tmp_file_path = tmp_file.name
            
            # Transcribe
            with open(tmp_file_path, 'rb') as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model=model,
                    file=audio_file,
                    response_format='json'
                )
            
            # Clean up
            import os
            os.unlink(tmp_file_path)
            
            return transcript.text
            
        except Exception as error:
            raise

# Usage
async def main():
    openai_integration = OpenAIIntegration(api_key)
    
    # Stream chat completion
    result = await openai_integration.stream_chat_completion(
        'gpt-4o',
        [{'role': 'user', 'content': 'What is AI?'}],
        {'temperature': 0.7, 'max_tokens': 256},
        lambda chunk, tps: print(f"Chunk: {chunk}, TPS: {tps}"),
        lambda error: print(f"Error: {error}")
    )
    
    print(f"Full text: {result['full_text']}")
    print(f"Duration: {result['duration']}ms")
    print(f"TPS: {result['tokens_per_second']}")
    
    # Generate image
    image_result = await openai_integration.generate_image(
        'dall-e-3',
        'A cat wearing a spacesuit',
        size='1024x1024'
    )
    print(f"Image URL: {image_result['url']}")
    
    # Text-to-speech
    audio_data = await openai_integration.text_to_speech(
        'tts-1',
        'Hello, world!',
        voice='alloy'
    )
    
    # Save audio to file
    with open('output.mp3', 'wb') as f:
        f.write(audio_data)
    
    # Speech-to-text
    with open('input.mp3', 'rb') as f:
        audio_data = f.read()
    
    transcript = await openai_integration.speech_to_text(
        'whisper-1',
        audio_data
    )
    print(f"Transcript: {transcript}")

if __name__ == '__main__':
    asyncio.run(main())
```

### FORGE Integration

#### Provider Implementation
```typescript
// src/src/lib/providers/openai.ts
export class OpenAIProvider {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
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
      const modelConfig = OPENAI_MODELS[modelId];
      
      if (!modelConfig) {
        throw new Error(`Unknown OpenAI model: ${modelId}`);
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
        if (modelConfig.pipeline === 'text-to-speech') {
          return await this.runTTSInference(modelId, prompt, params);
        } else {
          throw new Error('Audio input not supported in this context');
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
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        temperature: params.temperature,
        top_p: params.topP,
        max_tokens: params.maxTokens,
        stop: params.stopSequences,
        stream: !!onChunk
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }
    
    if (onChunk) {
      // Handle streaming response
      return await this.handleStreamingResponse(response, startTime, onChunk);
    } else {
      // Handle non-streaming response
      const data = await response.json();
      const duration = Date.now() - startTime;
      const output = data.choices[0].message.content;
      const tokenCount = data.usage.total_tokens;
      
      return {
        content: output,
        tokenCount,
        duration,
        tokensPerSecond: tokenCount / (duration / 1000),
        model: modelId,
        provider: 'openai',
        type: 'text'
      };
    }
  }
  
  private async handleStreamingResponse(
    response: Response,
    startTime: number,
    onChunk: (text: string) => void
  ): Promise<InferenceResult> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error('No response body');
    }
    
    let fullText = '';
    let tokenCount = 0;
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            const duration = Date.now() - startTime;
            return {
              content: fullText,
              tokenCount,
              duration,
              tokensPerSecond: tokenCount / (duration / 1000),
              model: 'gpt-4o',
              provider: 'openai',
              type: 'text'
            };
          }
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta?.content || '';
            
            if (delta) {
              fullText += delta;
              tokenCount += delta.split(/\s+/).length;
              onChunk(delta);
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
      }
    }
    
    // Fallback if stream ended without [DONE]
    const duration = Date.now() - startTime;
    return {
      content: fullText,
      tokenCount,
      duration,
      tokensPerSecond: tokenCount / (duration / 1000),
      model: 'gpt-4o',
      provider: 'openai',
      type: 'text'
    };
  }
  
  private async runImageInference(
    modelId: string,
    prompt: string,
    params: InferenceParams
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'vivid'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }
    
    const data = await response.json();
    const duration = Date.now() - startTime;
    const imageUrl = data.data[0].url;
    
    return {
      content: imageUrl,
      tokenCount: 1, // Count as 1 "token" for images
      duration,
      tokensPerSecond: 1 / (duration / 1000),
      model: modelId,
      provider: 'openai',
      type: 'image'
    };
  }
  
  private async runTTSInference(
    modelId: string,
    text: string,
    params: InferenceParams
  ): Promise<InferenceResult> {
    const startTime = Date.now();
    
    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        input: text,
        voice: 'alloy',
        response_format: 'mp3'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API error');
    }
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const duration = Date.now() - startTime;
    const characterCount = text.length;
    
    return {
      content: audioUrl,
      tokenCount: characterCount, // Count characters as tokens
      duration,
      tokensPerSecond: characterCount / (duration / 1000),
      model: modelId,
      provider: 'openai',
      type: 'audio'
    };
  }
}
```

## Error Handling

### Common Error Types

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| Invalid API Key | 401 | API key is invalid or missing |
| Insufficient Credits | 402 | Account has insufficient credits |
| Rate Limited | 429 | Too many requests |
| Model Not Found | 404 | Model doesn't exist |
| Invalid Parameters | 400 | Invalid request parameters |
| Server Error | 500 | OpenAI server error |

### Error Response Format
```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}
```

### Error Handling Implementation
```typescript
const handleOpenAIError = (error: any): string => {
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        return 'Invalid OpenAI API key. Please check your API key configuration.';
      case 402:
        return 'Insufficient credits. Please add credits to your OpenAI account.';
      case 429:
        return 'Rate limit exceeded. Please try again later.';
      case 404:
        return 'Model not found. Please check the model ID.';
      case 400:
        return data.error?.message || 'Invalid request parameters.';
      default:
        return 'OpenAI API error. Please try again.';
    }
  } else if (error.request) {
    return 'Network error. Please check your internet connection.';
  } else {
    return 'Unexpected error occurred.';
  }
};
```

## Rate Limits

### Default Rate Limits

| Tier | Requests/Minute | Tokens/Minute |
|------|----------------|---------------|
| Free | 3 | 40,000 |
| Pay-as-you-go | 3,500 | 2,000,000 |
| Tier 1 | 5,000 | 5,000,000 |
| Tier 2 | 10,000 | 20,000,000 |
| Tier 3 | 20,000 | 80,000,000 |
| Tier 4 | 30,000 | 160,000,000 |
| Tier 5 | 50,000 | 300,000,000 |

### Rate Limit Headers
```http
x-ratelimit-limit-requests: 3500
x-ratelimit-limit-tokens: 2000000
x-ratelimit-remaining-requests: 3499
x-ratelimit-remaining-tokens: 1999999
x-ratelimit-reset-requests: 17ms
x-ratelimit-reset-tokens: 17ms
```

### Rate Limit Handling
```typescript
const handleRateLimit = (response: Response) => {
  const remainingRequests = response.headers.get('x-ratelimit-remaining-requests');
  const resetTime = response.headers.get('x-ratelimit-reset-requests');
  
  if (remainingRequests === '0') {
    const resetMs = parseInt(resetTime || '60000');
    console.log(`Rate limit reached. Reset in ${resetMs}ms`);
  }
};
```

## Best Practices

### Cost Optimization

1. **Use GPT-4o Mini** for most tasks (95% cheaper)
2. **Optimize prompts** to reduce token usage
3. **Set reasonable limits** for max tokens
4. **Monitor usage** regularly
5. **Use streaming** for real-time applications

### Performance Optimization

1. **Enable streaming** for better user experience
2. **Cache responses** when appropriate
3. **Use appropriate model sizes** for tasks
4. **Implement retry logic** for failed requests
5. **Batch requests** when possible

### Security Best Practices

1. **Never expose API keys** in client-side code
2. **Use environment variables** for API keys
3. **Implement rate limiting** on your side
4. **Validate inputs** before sending to API
5. **Monitor usage** for unusual activity

### Usage Monitoring

```typescript
const trackUsage = (model: string, tokens: number, cost: number) => {
  const usage = {
    model,
    tokens,
    cost,
    timestamp: Date.now()
  };
  
  // Store in local storage
  const existing = JSON.parse(localStorage.getItem('openai-usage') || '[]');
  existing.push(usage);
  localStorage.setItem('openai-usage', JSON.stringify(existing));
  
  // Update UI
  updateUsageDisplay(existing);
};
```

---

This integration guide provides comprehensive documentation for using OpenAI's API with FORGE, enabling seamless access to GPT-4o, DALL-E 3, TTS, and Whisper models.
