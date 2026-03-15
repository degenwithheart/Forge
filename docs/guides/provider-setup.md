# Provider Setup Guide

Complete guide to configuring and managing API providers in FORGE.

## Table of Contents

- [Overview](#overview)
- [Supported Providers](#supported-providers)
- [OpenAI Setup](#openai-setup)
- [HuggingFace Setup](#huggingface-setup)
- [Provider Configuration](#provider-configuration)
- [API Key Management](#api-key-management)
- [Provider Validation](#provider-validation)
- [Troubleshooting](#troubleshooting)

## Overview

FORGE supports multiple AI providers:

1. **Local Python Backend**: Run models locally on your hardware
2. **OpenAI API**: Access OpenAI's hosted models
3. **HuggingFace API**: Access HuggingFace's inference endpoints

Each provider requires different setup and offers different capabilities.

## Supported Providers

| Provider | Models | Cost | Latency | Setup Complexity |
|-----------|--------|------|---------|-----------------|
| Local Python | Any `.safetensor` model | Free (hardware) | Low | High |
| OpenAI | GPT-4o, DALL-E, TTS, Whisper | Pay-per-use | Low | Low |
| HuggingFace | 200K+ models | Pay-per-use | Medium | Medium |

### Provider Comparison

#### Local Python Backend
- **Pros**: No API costs, full control, privacy
- **Cons**: Requires hardware setup, manual model management
- **Best for**: Development, testing, privacy-sensitive work

#### OpenAI API
- **Pros**: Easy setup, high quality, reliable
- **Cons**: API costs, limited model selection
- **Best for**: Production, quick prototyping, high-quality results

#### HuggingFace API
- **Pros**: Huge model selection, flexible pricing
- **Cons**: Variable quality, rate limits
- **Best for**: Experimentation, specific model requirements

## OpenAI Setup

### Prerequisites

1. **OpenAI Account**: Create account at [platform.openai.com](https://platform.openai.com)
2. **Payment Method**: Add credit card or payment method
3. **API Key**: Generate API key from dashboard

### Getting API Key

1. **Sign in** to [OpenAI Platform](https://platform.openai.com)
2. **Navigate** to API Keys section
3. **Click** "Create new secret key"
4. **Name** your key (e.g., "FORGE")
5. **Copy** the key immediately (it won't be shown again)

### API Key Configuration

#### In FORGE UI
1. **Open Settings**: Click gear icon or go to mobile "Api" tab
2. **Select OpenAI**: Choose OpenAI provider
3. **Enter API Key**: Paste your API key
4. **Click Validate**: Test the connection
5. **Save Settings**: Key is stored locally

#### Configuration File
```typescript
// Settings are stored in localStorage
const openaiConfig = {
  id: 'openai',
  name: 'OpenAI',
  apiKey: 'sk-...', // Encrypted in storage
  enabled: true
};
```

### Available Models

#### Text Models
```typescript
const OPENAI_TEXT_MODELS = {
  'gpt-4o': {
    name: 'GPT-4o',
    contextWindow: 128000,
    costPer1Mtokens: 5.00,
    capabilities: ['text', 'code', 'reasoning']
  },
  'gpt-4o-mini': {
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    costPer1Mtokens: 0.15,
    capabilities: ['text', 'code', 'reasoning']
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    costPer1Mtokens: 10.00,
    capabilities: ['text', 'code', 'vision']
  },
  'gpt-3.5-turbo': {
    name: 'GPT-3.5 Turbo',
    contextWindow: 16384,
    costPer1Mtokens: 0.50,
    capabilities: ['text', 'code']
  }
};
```

#### Multimodal Models
```typescript
const OPENAI_MULTIMODAL_MODELS = {
  'gpt-4-vision-preview': {
    name: 'GPT-4 Vision',
    contextWindow: 128000,
    costPer1Mtokens: 10.00,
    capabilities: ['text', 'vision']
  }
};
```

#### Audio Models
```typescript
const OPENAI_AUDIO_MODELS = {
  'tts-1': {
    name: 'Text-to-Speech v1',
    costPer1Mchars: 15.00,
    capabilities: ['speech-synthesis'],
    voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']
  },
  'whisper-1': {
    name: 'Whisper v1',
    costPerMinute: 0.006,
    capabilities: ['speech-recognition'],
    languages: 99
  }
};
```

#### Image Models
```typescript
const OPENAI_IMAGE_MODELS = {
  'dall-e-3': {
    name: 'DALL-E 3',
    costPerImage: 0.04,
    capabilities: ['image-generation'],
    sizes: ['1024x1024', '1792x1024', '1024x1792'],
    quality: ['standard', 'hd']
  }
};
```

### Usage Examples

#### Text Generation
```typescript
// OpenAI models are available immediately after API key setup
const response = await streamOpenAI(
  apiKey,
  'gpt-4o',
  [{ role: 'user', content: 'Explain quantum computing' }],
  { temperature: 0.7, topP: 0.9, maxTokens: 500 },
  (chunk) => console.log(chunk),
  (error) => console.error(error)
);
```

#### Image Generation
```typescript
const response = await streamOpenAI(
  apiKey,
  'dall-e-3',
  [{ role: 'user', content: 'A cat wearing a spacesuit' }],
  { /* image-specific params */ },
  (chunk) => console.log(chunk),
  (error) => console.error(error)
);
```

### Cost Management

#### Pricing Overview
- **GPT-4o**: $5.00 per 1M input tokens, $15.00 per 1M output tokens
- **GPT-4o Mini**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **DALL-E 3**: $0.04 per image
- **TTS-1**: $15.00 per 1M characters
- **Whisper**: $0.006 per minute

#### Usage Tracking
```typescript
// FORGE tracks token usage and estimated costs
interface UsageStats {
  tokensUsed: number;
  estimatedCost: number;
  model: string;
  provider: 'openai';
  timestamp: number;
}
```

#### Cost Optimization
- **Use GPT-4o Mini** for most tasks (95% cheaper)
- **Optimize prompts** to reduce token usage
- **Set reasonable limits** for max tokens
- **Monitor usage** regularly

## HuggingFace Setup

### Prerequisites

1. **HuggingFace Account**: Create account at [huggingface.co](https://huggingface.co)
2. **Email Verification**: Verify your email address
3. **API Token**: Generate access token

### Getting API Token

1. **Sign in** to [HuggingFace](https://huggingface.co)
2. **Navigate** to Settings → Access Tokens
3. **Click** "New token"
4. **Name** your token (e.g., "FORGE")
5. **Select** token type: "read" for basic access, "write" for uploads
6. **Copy** the token immediately

### API Token Configuration

#### In FORGE UI
1. **Open Settings**: Click gear icon or go to mobile "Api" tab
2. **Select HuggingFace**: Choose HuggingFace provider
3. **Enter API Token**: Paste your access token
4. **Click Validate**: Test the connection
5. **Save Settings**: Token is stored locally

#### Token Types
```typescript
const HF_TOKEN_TYPES = {
  'read': {
    description: 'Read access to public models',
    capabilities: ['model-download', 'inference']
  },
  'write': {
    description: 'Read + write access',
    capabilities: ['model-download', 'inference', 'model-upload']
  },
  'fine-grained': {
    description: 'Custom permissions for specific models',
    capabilities: ['custom']
  }
};
```

### Model Access

#### Public Models
```typescript
// Available immediately with read token
const PUBLIC_MODELS = [
  'distilbert-base-uncased',
  'gpt2',
  'microsoft/DialoGPT-medium',
  'facebook/bart-large-cnn'
];
```

#### Gated Models
```typescript
// Require approval from model authors
const GATED_MODELS = [
  'meta-llama/Llama-2-7b-hf',
  'tiiuae/falcon-7b',
  'mistralai/Mistral-7B-v0.1'
];

// Request access by visiting model page
// https://huggingface.co/meta-llama/Llama-2-7b-hf
```

#### Private Models
```typescript
// Require organization membership
const PRIVATE_MODELS = [
  'your-organization/your-private-model'
];

// Must be member of organization
// Access granted by organization admin
```

### API Usage

#### Inference API
```typescript
const response = await streamHuggingFace(
  'distilbert-base-uncased',
  'What is machine learning?',
  hfToken,
  { temperature: 0.7, topP: 0.9, maxTokens: 256 },
  (chunk) => console.log(chunk),
  (error) => console.error(error),
  'text'
);
```

#### Model Parameters
```typescript
const hfParams = {
  temperature: 0.7,
  top_p: 0.9,
  max_new_tokens: 256,
  do_sample: true,
  return_full_text: false,
  wait_for_model: true
};
```

### Rate Limits

#### Free Tier
- **Requests**: 30 requests per minute
- **Tokens**: 20,000 tokens per minute
- **Models**: Limited to public models

#### Pro Tier ($9/month)
- **Requests**: 300 requests per minute
- **Tokens**: 200,000 tokens per minute
- **Models**: Access to gated models
- **Inference Endpoints**: Private deployments

#### Enterprise
- **Custom limits**: Negotiated pricing
- **Dedicated endpoints**: Private infrastructure
- **SLA**: Service level agreements

## Provider Configuration

### Configuration Interface

#### Desktop Settings
```typescript
// Settings panel in right sidebar
<ProviderSettings
  providers={providers}
  onUpdate={updateProvider}
  validationStatus={validationStatus}
  isValidating={isValidating}
/>
```

#### Mobile Settings
```typescript
// Settings accessible via "Api" tab
<ProviderSettings
  providers={providers}
  onUpdate={updateProvider}
  validationStatus={validationStatus}
  isValidating={isValidating}
  compact={true}
/>
```

### Provider Interface

```typescript
interface ProviderConfig {
  id: Provider;
  name: string;
  apiKey: string;
  enabled: boolean;
  baseUrl?: string;
  customHeaders?: Record<string, string>;
}

interface ApiValidationStatus {
  provider: Provider;
  isValid: boolean;
  error?: string;
  checkedAt: number;
}
```

### Advanced Configuration

#### Custom Endpoints
```typescript
// For enterprise or custom deployments
const customConfig: ProviderConfig = {
  id: 'openai',
  name: 'OpenAI (Custom)',
  apiKey: 'custom-key',
  enabled: true,
  baseUrl: 'https://api.custom-openai.com/v1',
  customHeaders: {
    'X-Custom-Header': 'value'
  }
};
```

#### Proxy Configuration
```typescript
// For environments requiring proxy
const proxyConfig = {
  id: 'openai',
  name: 'OpenAI (Proxy)',
  apiKey: 'key',
  enabled: true,
  baseUrl: 'https://proxy.example.com/openai'
};
```

## API Key Management

### Security Practices

#### Local Storage
```typescript
// API keys are encrypted in localStorage
class SecureStorage {
  private encrypt(key: string): string {
    // Simple XOR encryption (consider Web Crypto API)
    return btoa(key.split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ 42)
    ).join(''));
  }
  
  private decrypt(encrypted: string): string {
    return atob(encrypted).split('').map(char => 
      String.fromCharCode(char.charCodeAt(0) ^ 42)
    ).join('');
  }
}
```

#### Key Rotation
```typescript
// Support for key rotation without service interruption
const rotateKey = async (provider: Provider, newKey: string) => {
  // Validate new key first
  const validation = await validateApiKey(provider, newKey);
  
  if (validation.isValid) {
    // Update configuration
    await updateProvider(provider, { apiKey: newKey });
    
    // Clear any cached connections
    clearProviderCache(provider);
  }
};
```

#### Key Validation
```typescript
const validateApiKey = async (provider: Provider, apiKey: string): Promise<ApiValidationStatus> => {
  try {
    switch (provider) {
      case 'openai':
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return {
          provider,
          isValid: response.ok,
          error: response.ok ? undefined : 'Invalid API key',
          checkedAt: Date.now()
        };
        
      case 'huggingface':
        const hfResponse = await fetch('https://api-inference.huggingface.co/models/distilbert-base-uncased', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return {
          provider,
          isValid: hfResponse.ok,
          error: hfResponse.ok ? undefined : 'Invalid token',
          checkedAt: Date.now()
        };
    }
  } catch (error) {
    return {
      provider,
      isValid: false,
      error: error.message,
      checkedAt: Date.now()
    };
  }
};
```

### Key Best Practices

1. **Use Environment Variables**: For development
2. **Regular Rotation**: Change keys periodically
3. **Limited Scope**: Use tokens with minimal required permissions
4. **Secure Storage**: Never commit keys to version control
5. **Monitor Usage**: Track API usage and costs

## Provider Validation

### Automatic Validation

#### On Startup
```typescript
// Validate all enabled providers on app start
useEffect(() => {
  providers.forEach(provider => {
    if (provider.enabled && provider.apiKey) {
      validateApiKey(provider.id, provider.apiKey);
    }
  });
}, []);
```

#### On Configuration Change
```typescript
// Validate immediately when settings are updated
const handleProviderUpdate = async (provider: Provider, config: Partial<ProviderConfig>) => {
  await updateProvider(provider, config);
  
  if (config.apiKey) {
    const validation = await validateApiKey(provider, config.apiKey);
    setValidationStatus(prev => [...prev.filter(v => v.provider !== provider), validation]);
  }
};
```

### Validation Results

#### Success Indicators
- **Green checkmark**: Provider is valid and ready
- **Model list**: Available models populate the library
- **Usage tracking**: Token/cost tracking enabled

#### Error Indicators
- **Red X**: Invalid API key or connection issue
- **Error message**: Specific error description
- **Retry button**: Option to re-validate

#### Validation States
```typescript
type ValidationState = 'valid' | 'invalid' | 'checking' | 'unknown';

interface ValidationStatus {
  state: ValidationState;
  message?: string;
  lastChecked: number;
  modelsAvailable?: number;
}
```

## Troubleshooting

### Common Issues

#### Invalid API Key
```bash
# OpenAI: Check key format
# Should start with "sk-"
sk-1234567890abcdef1234567890abcdef12345678

# HuggingFace: Check token format
# Should be alphanumeric string
hf_1234567890abcdef1234567890abcdef12345678
```

#### Rate Limiting
```typescript
// Implement exponential backoff
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

#### Network Issues
```bash
# Check connectivity
curl -I https://api.openai.com/v1/models
curl -I https://api-inference.huggingface.co/models

# Check DNS
nslookup api.openai.com
nslookup api-inference.huggingface.co
```

#### Model Access Issues
```typescript
// Check model access programmatically
const checkModelAccess = async (provider: Provider, modelId: string) => {
  try {
    const response = await fetch(getModelUrl(provider, modelId), {
      headers: getAuthHeaders(provider)
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
```

### Debug Information

#### Provider Diagnostics
```typescript
const getProviderDiagnostics = async (provider: Provider) => {
  const diagnostics = {
    provider,
    apiKey: apiKey ? '***' + apiKey.slice(-4) : 'not set',
    enabled: providers.find(p => p.id === provider)?.enabled,
    validation: validationStatus.find(v => v.provider === provider),
    lastError: getLastProviderError(provider),
    availableModels: await getAvailableModels(provider),
    rateLimits: await getRateLimits(provider)
  };
  
  return diagnostics;
};
```

#### Network Diagnostics
```typescript
const checkNetworkConnectivity = async () => {
  const checks = {
    openai: await checkEndpoint('https://api.openai.com/v1/models'),
    huggingface: await checkEndpoint('https://api-inference.huggingface.co/models'),
    local: await checkEndpoint('http://localhost:5000/info')
  };
  
  return checks;
};

const checkEndpoint = async (url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      reachable: response.ok,
      status: response.status,
      latency: Date.now() - startTime
    };
  } catch (error) {
    return {
      reachable: false,
      error: error.message
    };
  }
};
```

## Best Practices

### Provider Selection

1. **Start with Local**: Test with local models first
2. **Use OpenAI for Quality**: When results matter most
3. **Use HuggingFace for Variety**: When you need specific models
4. **Combine Providers**: Use each for its strengths

### Cost Management

1. **Monitor Usage**: Track tokens and costs
2. **Optimize Prompts**: Reduce unnecessary tokens
3. **Use Efficient Models**: Choose appropriate model size
4. **Set Limits**: Configure usage limits

### Security

1. **Protect API Keys**: Never share or commit keys
2. **Use Environment Variables**: For development
3. **Regular Rotation**: Change keys periodically
4. **Audit Access**: Review who has access to keys

### Performance

1. **Validate Early**: Check provider status on startup
2. **Cache Results**: Cache validation results
3. **Retry Logic**: Implement proper retry mechanisms
4. **Fallback**: Use multiple providers when possible

---

This guide covers all aspects of provider setup in FORGE. For specific API details, refer to the [API Reference](../api-reference.md).
