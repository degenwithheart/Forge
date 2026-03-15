# Basic Inference Examples

Complete examples of running inference with different models and providers in FORGE.

## Table of Contents

- [Overview](#overview)
- [Text Generation](#text-generation)
- [Image Generation](#image-generation)
- [Audio Processing](#audio-processing)
- [Parameter Comparison](#parameter-comparison)
- [Multi-Provider Fallback](#multi-provider-fallback)
- [Batch Processing](#batch-processing)

## Overview

These examples demonstrate how to use FORGE's inference capabilities with different models and providers. Each example includes setup, execution, and result handling.

### Prerequisites

1. **FORGE Setup**: Frontend and backend running
2. **API Keys**: OpenAI and/or HuggingFace tokens configured
3. **Models**: At least one model loaded locally or API access

### Basic Inference Flow

```typescript
// Standard inference pattern
const result = await engine.handleInference("Your prompt here");

console.log("Generated:", result.content);
console.log("Tokens:", result.tokens);
console.log("Duration:", result.duration);
console.log("TPS:", result.tokensPerSecond);
```

## Text Generation

### Local Model Inference

#### Load and Run Local Model
```typescript
// Step 1: Load a local model
await engine.handleModelLoad({
  modelId: 'distilbert-base-uncased',
  name: 'DistilBERT Base Uncased',
  author: 'HuggingFace',
  modality: 'text',
  pipeline: 'text-generation'
});

// Step 2: Run inference
const result = await engine.handleInference(
  "What is artificial intelligence in simple terms?"
);

console.log('Local Model Result:');
console.log('Content:', result.content);
console.log('Tokens:', result.tokens);
console.log('Duration:', result.duration, 'ms');
console.log('TPS:', result.tokensPerSecond);
console.log('Provider:', result.provider);
```

#### Advanced Local Inference
```typescript
// Set specific parameters
engine.setParams({
  temperature: 0.3,      // More focused output
  topP: 0.8,           // Limited vocabulary diversity
  maxTokens: 512,       // Longer response
  contextWindow: 2048   // Larger context
});

// Run with custom parameters
const result = await engine.handleInference(
  "Explain the concept of machine learning for beginners. Include examples and use cases."
);

console.log('Advanced Local Result:');
console.log('Content:', result.content);
console.log('Used Parameters:', engine.params);
```

### OpenAI Inference

#### GPT-4o Text Generation
```typescript
// Configure OpenAI provider
await providers.updateProvider('openai', {
  apiKey: 'sk-your-openai-key',
  enabled: true
});

// Load OpenAI model (virtual - no actual loading needed)
await engine.handleModelLoad({
  modelId: 'gpt-4o',
  name: 'GPT-4o',
  author: 'OpenAI',
  modality: 'text',
  pipeline: 'text-generation',
  provider: 'openai'
});

// Run inference with OpenAI
const result = await engine.handleInference(
  "Write a comprehensive explanation of quantum computing, including key concepts, applications, and current challenges."
);

console.log('OpenAI GPT-4o Result:');
console.log('Content:', result.content);
console.log('Tokens:', result.tokens);
console.log('Cost:', result.tokens * 0.015 / 1000, 'USD'); // Rough cost calculation
console.log('Provider:', result.provider);
```

#### GPT-4o Mini for Cost-Effective Generation
```typescript
// Switch to cost-effective model
await engine.handleModelLoad({
  modelId: 'gpt-4o-mini',
  name: 'GPT-4o Mini',
  author: 'OpenAI',
  modality: 'text',
  pipeline: 'text-generation',
  provider: 'openai'
});

// Generate with lower cost model
const result = await engine.handleInference(
  "Create a product description for a new AI-powered task management app."
);

console.log('GPT-4o Mini Result:');
console.log('Content:', result.content);
console.log('Tokens:', result.tokens);
console.log('Cost:', result.tokens * 0.0006 / 1000, 'USD'); // Much cheaper
```

### HuggingFace Inference

#### Mistral 7B via HuggingFace API
```typescript
// Configure HuggingFace provider
await providers.updateProvider('huggingface', {
  apiKey: 'hf-your-huggingface-token',
  enabled: true
});

// Load HuggingFace model
await engine.handleModelLoad({
  modelId: 'mistralai/Mistral-7B-v0.1',
  name: 'Mistral 7B',
  author: 'Mistral AI',
  modality: 'text',
  pipeline: 'text-generation',
  provider: 'huggingface'
});

// Run inference
const result = await engine.handleInference(
  "What are the key differences between supervised and unsupervised machine learning?"
);

console.log('HuggingFace Mistral Result:');
console.log('Content:', result.content);
console.log('Tokens:', result.tokens);
console.log('Provider:', result.provider);
```

#### Fallback to HuggingFace
```typescript
// Try local first, fallback to HuggingFace
const result = await engine.handleInference(
  "Explain the concept of neural networks in simple terms."
);

// FORGE automatically handles fallback logic
console.log('Fallback Result:');
console.log('Content:', result.content);
console.log('Provider:', result.provider); // Will show which provider was used
```

## Image Generation

### DALL-E 3 Image Generation
```typescript
// Load DALL-E 3 model
await engine.handleModelLoad({
  modelId: 'dall-e-3',
  name: 'DALL-E 3',
  author: 'OpenAI',
  modality: 'image',
  pipeline: 'text-to-image',
  provider: 'openai'
});

// Generate image
const result = await engine.handleInference(
  "A futuristic city with flying cars and green spaces, digital art style"
);

console.log('Image Generation Result:');
console.log('Image URL:', result.content);
console.log('Type:', result.type);
console.log('Provider:', result.provider);

// Display image in browser
const img = document.createElement('img');
img.src = result.content;
img.alt = 'Generated image';
document.body.appendChild(img);
```

### Stable Diffusion via HuggingFace
```typescript
// Load Stable Diffusion model
await engine.handleModelLoad({
  modelId: 'runwayml/stable-diffusion-v1-5',
  name: 'Stable Diffusion v1.5',
  author: 'RunwayML',
  modality: 'image',
  pipeline: 'text-to-image',
  provider: 'huggingface'
});

// Generate image with specific style
const result = await engine.handleInference(
  "A cat wearing a spacesuit, sitting on the moon, photorealistic"
);

console.log('Stable Diffusion Result:');
console.log('Image URL:', result.content);
console.log('Type:', result.type);
console.log('Provider:', result.provider);
```

## Audio Processing

### Text-to-Speech with OpenAI
```typescript
// Load TTS model
await engine.handleModelLoad({
  modelId: 'tts-1',
  name: 'TTS-1',
  author: 'OpenAI',
  modality: 'audio',
  pipeline: 'text-to-speech',
  provider: 'openai'
});

// Generate speech
const result = await engine.handleInference(
  "Welcome to FORGE, your local AI intelligence platform. This is a test of our text-to-speech capabilities."
);

console.log('TTS Result:');
console.log('Audio URL:', result.content);
console.log('Type:', result.type);
console.log('Tokens:', result.tokens);

// Play audio
const audio = new Audio(result.content);
audio.play();
```

### Speech-to-Text with Whisper
```typescript
// Load Whisper model
await engine.handleModelLoad({
  modelId: 'whisper-1',
  name: 'Whisper',
  author: 'OpenAI',
  modality: 'audio',
  pipeline: 'automatic-speech-recognition',
  provider: 'openai'
});

// Note: This would require audio input from user
// In a real application, you would capture audio from microphone or file

// Example with audio file (pseudo-code)
const audioFile = await getUserAudioFile();
const result = await engine.handleInference(audioFile);

console.log('Whisper Result:');
console.log('Transcription:', result.content);
console.log('Type:', result.type);
console.log('Provider:', result.provider);
```

## Parameter Comparison

### Temperature Comparison
```typescript
// Test different temperature values
const prompts = [
  "What is the meaning of life?",
  "Explain quantum computing",
  "Write a poem about nature"
];

const temperatures = [0.1, 0.5, 0.8, 1.2];

for (const prompt of prompts) {
  console.log(`\n=== Testing with prompt: "${prompt}" ===`);
  
  for (const temp of temperatures) {
    engine.setParams({ temperature: temp });
    
    const result = await engine.handleInference(prompt);
    
    console.log(`\nTemperature ${temp}:`);
    console.log(`Content: ${result.content.substring(0, 100)}...`);
    console.log(`TPS: ${result.tokensPerSecond.toFixed(2)}`);
  }
}
```

### Max Tokens Comparison
```typescript
// Test different max token limits
const prompt = "Write a detailed explanation of artificial intelligence, including its history, applications, and future prospects.";

const maxTokensValues = [64, 128, 256, 512];

for (const maxTokens of maxTokensValues) {
  engine.setParams({ maxTokens });
  
  const result = await engine.handleInference(prompt);
  
  console.log(`\nMax Tokens ${maxTokens}:`);
  console.log(`Generated: ${result.tokens} tokens`);
  console.log(`Content length: ${result.content.length} characters`);
  console.log(`Duration: ${result.duration}ms`);
}
```

### Provider Performance Comparison
```typescript
// Compare performance across providers
const prompt = "Explain the concept of machine learning in 100 words or less.";
const providers = ['local', 'openai', 'huggingface'];

for (const provider of providers) {
  console.log(`\n=== Testing ${provider} provider ===`);
  
  // Load appropriate model for provider
  if (provider === 'local') {
    await engine.handleModelLoad({
      modelId: 'distilbert-base-uncased',
      provider: 'local'
    });
  } else if (provider === 'openai') {
    await engine.handleModelLoad({
      modelId: 'gpt-4o-mini',
      provider: 'openai'
    });
  } else {
    await engine.handleModelLoad({
      modelId: 'mistralai/Mistral-7B-v0.1',
      provider: 'huggingface'
    });
  }
  
  const startTime = performance.now();
  const result = await engine.handleInference(prompt);
  const endTime = performance.now();
  
  console.log(`Provider: ${result.provider}`);
  console.log(`Content: ${result.content}`);
  console.log(`Tokens: ${result.tokens}`);
  console.log(`TPS: ${result.tokensPerSecond.toFixed(2)}`);
  console.log(`Total Time: ${(endTime - startTime).toFixed(2)}ms`);
}
```

## Multi-Provider Fallback

### Automatic Fallback Chain
```typescript
// Set up fallback chain: Local → HuggingFace → OpenAI
const prompt = "What are the latest developments in AI research?";

// Try local first
try {
  await engine.handleModelLoad({
    modelId: 'llama-2-7b',
    provider: 'local'
  });
  
  const result = await engine.handleInference(prompt);
  console.log('Local model result:', result.content);
  
} catch (error) {
  console.log('Local model failed, trying HuggingFace...');
  
  try {
    await engine.handleModelLoad({
      modelId: 'mistralai/Mistral-7B-v0.1',
      provider: 'huggingface'
    });
    
    const result = await engine.handleInference(prompt);
    console.log('HuggingFace result:', result.content);
    
  } catch (error) {
    console.log('HuggingFace failed, trying OpenAI...');
    
    try {
      await engine.handleModelLoad({
        modelId: 'gpt-4o-mini',
        provider: 'openai'
      });
      
      const result = await engine.handleInference(prompt);
      console.log('OpenAI result:', result.content);
      
    } catch (error) {
      console.error('All providers failed:', error);
    }
  }
}
```

### Provider Selection Logic
```typescript
// Smart provider selection based on task
const selectBestProvider = (task: string, priority: 'speed' | 'quality' | 'cost') => {
  const providerMap = {
    speed: {
      'text': 'local',      // Fastest if model is loaded
      'image': 'huggingface', // Generally faster than OpenAI
      'audio': 'openai'      // OpenAI TTS is fast
    },
    quality: {
      'text': 'openai',     // GPT-4o has highest quality
      'image': 'openai',    // DALL-E 3 has best quality
      'audio': 'openai'     // OpenAI has best quality
    },
    cost: {
      'text': 'local',      // Free if local
      'image': 'huggingface', // Generally cheaper
      'audio': 'huggingface'  // If available
    }
  };
  
  return providerMap[priority]?.[task] || 'huggingface';
};

// Usage
const bestProvider = selectBestProvider('text', 'quality');
console.log(`Best provider for text generation with quality priority: ${bestProvider}`);
```

## Batch Processing

### Multiple Prompts Processing
```typescript
// Process multiple prompts efficiently
const prompts = [
  "What is machine learning?",
  "Explain neural networks",
  "How does deep learning work?",
  "What are transformers?",
  "Explain reinforcement learning"
];

// Process in parallel (if supported)
const results = await Promise.all(
  prompts.map(prompt => engine.handleInference(prompt))
);

results.forEach((result, index) => {
  console.log(`\nPrompt ${index + 1}: ${prompts[index]}`);
  console.log(`Result: ${result.content.substring(0, 100)}...`);
  console.log(`Provider: ${result.provider}`);
  console.log(`Tokens: ${result.tokens}`);
});
```

### Parameter Sweep
```typescript
// Test multiple parameter combinations
const prompt = "Write a short story about AI.";
const temperatures = [0.1, 0.5, 0.9];
const maxTokens = [50, 100, 200];

for (const temp of temperatures) {
  for (const maxTok of maxTokens) {
    engine.setParams({
      temperature: temp,
      maxTokens: maxTok
    });
    
    const result = await engine.handleInference(prompt);
    
    console.log(`\nTemperature: ${temp}, Max Tokens: ${maxTok}`);
    console.log(`Length: ${result.content.length} chars`);
    console.log(`Tokens: ${result.tokens}`);
    console.log(`TPS: ${result.tokensPerSecond.toFixed(2)}`);
  }
}
```

### Model Comparison
```typescript
// Compare different models on the same prompt
const prompt = "Explain the concept of artificial intelligence in one paragraph.";
const models = [
  { id: 'distilbert-base-uncased', provider: 'local' },
  { id: 'gpt-4o-mini', provider: 'openai' },
  { id: 'mistralai/Mistral-7B-v0.1', provider: 'huggingface' }
];

const comparison = [];

for (const model of models) {
  try {
    await engine.handleModelLoad(model);
    const result = await engine.handleInference(prompt);
    
    comparison.push({
      model: model.id,
      provider: result.provider,
      content: result.content,
      tokens: result.tokens,
      duration: result.duration,
      tps: result.tokensPerSecond
    });
    
  } catch (error) {
    console.error(`Failed to load model ${model.id}:`, error);
  }
}

// Display comparison results
console.log('\n=== Model Comparison ===');
comparison.forEach(item => {
  console.log(`\nModel: ${item.model}`);
  console.log(`Provider: ${item.provider}`);
  console.log(`Content: ${item.content}`);
  console.log(`Tokens: ${item.tokens}`);
  console.log(`Duration: ${item.duration}ms`);
  console.log(`TPS: ${item.tps.toFixed(2)}`);
});
```

## Error Handling

### Comprehensive Error Handling
```typescript
const safeInference = async (prompt: string, modelId?: string) => {
  try {
    // Load model if specified
    if (modelId) {
      await engine.handleModelLoad({
        modelId,
        name: modelId,
        modality: 'text',
        pipeline: 'text-generation'
      });
    }
    
    // Run inference
    const result = await engine.handleInference(prompt);
    
    return {
      success: true,
      result
    };
    
  } catch (error) {
    console.error('Inference failed:', error);
    
    return {
      success: false,
      error: error.message,
      prompt,
      modelId
    };
  }
};

// Usage
const result = await safeInference(
  "What is AI?",
  'gpt-4o-mini'
);

if (result.success) {
  console.log('Generated:', result.result.content);
} else {
  console.error('Error:', result.error);
}
```

### Retry Logic
```typescript
const inferenceWithRetry = async (
  prompt: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await engine.handleInference(prompt);
      return result;
      
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      retryDelay *= 2; // Exponential backoff
    }
  }
};

// Usage
try {
  const result = await inferenceWithRetry("Explain quantum computing");
  console.log('Success:', result.content);
} catch (error) {
  console.error('All attempts failed:', error);
}
```

---

These examples provide a comprehensive foundation for using FORGE's inference capabilities across different models, providers, and use cases. Adapt them to your specific needs and requirements.
