# Parameter Tuning Guide

Complete guide to optimizing inference parameters for different use cases and models.

## Table of Contents

- [Overview](#overview)
- [Core Parameters](#core-parameters)
- [Parameter Effects](#parameter-effects)
- [Use Case Tuning](#use-case-tuning)
- [Model-Specific Tuning](#model-specific-tuning)
- [Advanced Techniques](#advanced-techniques)
- [Parameter Presets](#parameter-presets)
- [Troubleshooting](#troubleshooting)

## Overview

Inference parameters control how models generate text and significantly impact output quality, creativity, and performance. Understanding these parameters is crucial for getting the best results from AI models.

### Key Concepts

- **Temperature**: Controls randomness vs determinism
- **Top-P (Nucleus Sampling)**: Controls vocabulary diversity
- **Max Tokens**: Limits response length
- **Context Window**: Controls how much context is considered

### Parameter Interface

#### Desktop Interface
```typescript
// Right panel - Telemetry & Parameters
<ParameterControls
  params={engine.params}
  onChange={engine.setParams}
  disabled={!engine.activeModel}
/>
```

#### Mobile Interface
```typescript
// Mobile - Settings tab
<ParameterControls
  params={engine.params}
  onChange={handleParamsChange}
  compact={true}
/>
```

## Core Parameters

### Temperature

#### Description
Controls the randomness of token selection. Higher values increase randomness and creativity, while lower values make output more focused and deterministic.

#### Range: 0.0 - 2.0
- **0.0**: Completely deterministic, always chooses highest probability token
- **0.7**: Balanced creativity and coherence (default)
- **1.0**: High creativity, more diverse outputs
- **1.5+**: Very creative, potentially less coherent

#### Usage Examples
```typescript
// Factual, technical content
const factualParams = {
  temperature: 0.1,
  topP: 0.8,
  maxTokens: 512
};

// Creative writing
const creativeParams = {
  temperature: 1.2,
  topP: 0.95,
  maxTokens: 1024
};

// Code generation
const codeParams = {
  temperature: 0.2,
  topP: 0.8,
  maxTokens: 2048
};
```

#### Effects by Temperature Value

| Temperature | Characteristics | Best For |
|-------------|----------------|----------|
| 0.0 - 0.2 | Deterministic, repetitive, factual | Technical docs, code, Q&A |
| 0.3 - 0.5 | Mostly deterministic, some variation | Reports, summaries, analysis |
| 0.6 - 0.8 | Balanced, creative but coherent | General conversation, content |
| 0.9 - 1.2 | Creative, diverse, unpredictable | Storytelling, brainstorming |
| 1.3 - 2.0 | Very creative, potentially chaotic | Experimental, artistic |

### Top-P (Nucleus Sampling)

#### Description
Controls the cumulative probability threshold for token selection. Only tokens with cumulative probability below this threshold are considered.

#### Range: 0.0 - 1.0
- **0.1**: Very restrictive, only most likely tokens
- **0.9**: Balanced diversity (default)
- **1.0**: No restriction, considers all tokens

#### How It Works
```typescript
// Example token probabilities
const tokens = [
  { token: 'the', prob: 0.4 },
  { token: 'a', prob: 0.3 },
  { token: 'an', prob: 0.2 },
  { token: 'some', prob: 0.1 }
];

// With top_p = 0.8
// Cumulative: 0.4 (the) + 0.3 (a) + 0.2 (an) = 0.9
// 'some' (0.1) is excluded because 0.4 + 0.3 + 0.2 = 0.9 > 0.8
// Considered tokens: ['the', 'a', 'an']
```

#### Usage Examples
```typescript
// Conservative - predictable responses
const conservativeParams = {
  temperature: 0.3,
  topP: 0.7,
  maxTokens: 256
};

// Standard - balanced responses
const standardParams = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 512
};

// Exploratory - diverse responses
const exploratoryParams = {
  temperature: 1.0,
  topP: 0.95,
  maxTokens: 1024
};
```

### Max Tokens

#### Description
Maximum number of tokens to generate in a single response. Includes both input and output tokens for some providers.

#### Range: 1 - 4096 (model-dependent)
- **Short**: 64-256 tokens for brief responses
- **Medium**: 512-1024 tokens for detailed responses
- **Long**: 2048-4096 tokens for extensive content

#### Token Estimation
```typescript
// Rough token estimates
const tokenEstimates = {
  words: 0.75,        // ~0.75 tokens per word
  characters: 4,      // ~4 characters per token
  lines: 10,          // ~10 tokens per line
  paragraphs: 50      // ~50 tokens per paragraph
};

// Estimate tokens for text
const estimateTokens = (text: string) => {
  return Math.ceil(text.length / 4);
};
```

#### Usage Examples
```typescript
// Tweet-length response
const tweetParams = {
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 50
};

// Email-length response
const emailParams = {
  temperature: 0.5,
  topP: 0.8,
  maxTokens: 512
};

// Essay-length response
const essayParams = {
  temperature: 0.8,
  topP: 0.9,
  maxTokens: 2048
};
```

### Context Window

#### Description
Maximum number of tokens that can be used as context for generation. Larger context windows allow for more detailed prompts and longer conversations.

#### Range: 512 - 32768 (model-dependent)
- **Small**: 512-2048 tokens (older models)
- **Medium**: 4096-8192 tokens (modern models)
- **Large**: 16384-32768 tokens (latest models)

#### Context Management
```typescript
// Context window optimization
const optimizeContext = (prompt: string, contextLimit: number) => {
  const promptTokens = estimateTokens(prompt);
  
  if (promptTokens > contextLimit) {
    // Truncate from beginning to keep recent context
    const words = prompt.split(' ');
    let truncated = '';
    let currentTokens = 0;
    
    // Build from end backwards
    for (let i = words.length - 1; i >= 0; i--) {
      const word = words[i] + ' ';
      const wordTokens = estimateTokens(word);
      
      if (currentTokens + wordTokens > contextLimit) break;
      
      truncated = word + truncated;
      currentTokens += wordTokens;
    }
    
    return truncated;
  }
  
  return prompt;
};
```

## Parameter Effects

### Temperature vs Top-P Interaction

#### High Temperature + Low Top-P
```typescript
const creativeFocusedParams = {
  temperature: 1.2,  // High creativity
  topP: 0.7         // But focused vocabulary
};
// Result: Creative but predictable vocabulary
```

#### Low Temperature + High Top-P
```typescript
const deterministicDiverseParams = {
  temperature: 0.2,  // Low randomness
  topP: 0.95         // But diverse vocabulary
};
// Result: Predictable but varied word choice
```

#### High Temperature + High Top-P
```typescript
const creativeDiverseParams = {
  temperature: 1.2,  // High creativity
  topP: 0.95         // And diverse vocabulary
};
// Result: Maximum creativity and diversity
```

### Parameter Impact on Performance

#### Generation Speed
```typescript
// Lower max tokens = faster generation
const fastParams = {
  maxTokens: 128,
  temperature: 0.7,
  topP: 0.9
};

// Higher max tokens = slower generation
const slowParams = {
  maxTokens: 2048,
  temperature: 0.7,
  topP: 0.9
};
```

#### Resource Usage
```typescript
// Larger context window = more memory
const memoryIntensiveParams = {
  contextWindow: 8192,
  maxTokens: 1024
};

// Smaller context window = less memory
const memoryLightParams = {
  contextWindow: 2048,
  maxTokens: 512
};
```

## Use Case Tuning

### Content Creation

#### Blog Posts
```typescript
const blogPostParams = {
  temperature: 0.8,      // Creative but coherent
  topP: 0.9,            // Diverse vocabulary
  maxTokens: 1024,       // Detailed content
  contextWindow: 4096    // Include full prompt
};

// Prompt example
const blogPrompt = `
Write a blog post about the benefits of renewable energy.
Include:
- Introduction
- 3 main benefits
- Conclusion
Tone: Informative but engaging
Length: ~500 words
`;
```

#### Technical Documentation
```typescript
const techDocParams = {
  temperature: 0.1,      // Very deterministic
  topP: 0.7,            // Focused vocabulary
  maxTokens: 2048,       // Comprehensive
  contextWindow: 8192    // Include full context
};

// Prompt example
const techDocPrompt = `
Document the API endpoint for user authentication.
Include:
- Endpoint URL
- Request parameters
- Response format
- Error codes
- Example usage
Format: Markdown
`;
```

#### Creative Writing
```typescript
const creativeParams = {
  temperature: 1.2,      // Very creative
  topP: 0.95,           // Maximum diversity
  maxTokens: 1536,       // Longer content
  contextWindow: 4096    // Include story context
};

// Prompt example
const storyPrompt = `
Write a short story about a robot discovering music.
Setting: Future city
Characters: Robot named Unit 734
Theme: Finding humanity in art
Style: Poetic, introspective
Length: ~750 words
`;
```

### Business Applications

#### Email Responses
```typescript
const emailParams = {
  temperature: 0.3,      // Professional tone
  topP: 0.8,            // Business vocabulary
  maxTokens: 512,        // Concise emails
  contextWindow: 2048    // Include email thread
};

// Prompt example
const emailPrompt = `
Draft a professional email response to a client inquiry.

Client message: "We're interested in your premium package but have questions about pricing."

Requirements:
- Professional tone
- Address pricing questions
- Include call to action
- Keep under 200 words
`;
```

#### Marketing Copy
```typescript
const marketingParams = {
  temperature: 0.9,      // Creative marketing language
  topP: 0.9,            // Diverse vocabulary
  maxTokens: 256,        // Concise copy
  contextWindow: 2048    // Include brand guidelines
};

// Prompt example
const marketingPrompt = `
Write compelling ad copy for a new productivity app.

Key features:
- AI-powered task management
- Cross-platform sync
- Team collaboration
- 30-day free trial

Target audience: Busy professionals
Tone: Energetic, benefit-focused
Length: 100 words
`;
```

#### Reports and Analysis
```typescript
const reportParams = {
  temperature: 0.2,      // Factual and analytical
  topP: 0.7,            // Technical vocabulary
  maxTokens: 1024,       // Detailed analysis
  contextWindow: 4096    // Include data context
};

// Prompt example
const reportPrompt = `
Analyze the following sales data and provide insights:

Q1 Sales: $125,000 (15% increase YoY)
Q2 Sales: $142,000 (18% increase YoY)
Q3 Sales: $138,000 (12% increase YoY)
Q4 Sales: $155,000 (20% increase YoY)

Include:
- Trend analysis
- Key growth drivers
- Recommendations
Format: Executive summary
`;
```

### Development Applications

#### Code Generation
```typescript
const codeParams = {
  temperature: 0.1,      // Deterministic code
  topP: 0.6,            // Focused on syntax
  maxTokens: 1024,       // Reasonable code length
  contextWindow: 4096    // Include full context
};

// Prompt example
const codePrompt = `
Write a Python function to validate email addresses.

Requirements:
- Use regex pattern
- Return boolean
- Handle edge cases
- Include docstring
- Include unit tests
Language: Python 3.9+
`;
```

#### Debugging
```typescript
const debugParams = {
  temperature: 0.0,      // Very deterministic
  topP: 0.5,            // Technical focus
  maxTokens: 512,        // Concise solutions
  contextWindow: 2048    // Include error context
};

// Prompt example
const debugPrompt = `
Debug this Python code:

```python
def calculate_average(numbers):
    total = 0
    for num in numbers:
        total += num
    return total / len(numbers)

# Error: division by zero when list is empty
```

Provide:
- Root cause analysis
- Fixed code
- Explanation
`;
```

#### Documentation
```typescript
const docsParams = {
  temperature: 0.3,      // Professional tone
  topP: 0.8,            // Technical vocabulary
  maxTokens: 768,        // Comprehensive docs
  contextWindow: 4096    // Include full context
};

// Prompt example
const docsPrompt = `
Write API documentation for a user authentication endpoint.

Endpoint: POST /api/auth/login
Request body:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string",
  "user": {
    "id": "string",
    "email": "string"
  }
}
```

Include:
- Description
- Parameters
- Examples
- Error codes
Format: Markdown
`;
```

## Model-Specific Tuning

### OpenAI Models

#### GPT-4o
```typescript
const gpt4oParams = {
  temperature: 0.7,      // Balanced for general use
  topP: 0.9,            // Good vocabulary diversity
  maxTokens: 4096,       // Large context window
  contextWindow: 128000  // Maximum context
};

// Best for:
// - Complex reasoning
// - Multi-step tasks
// - Long conversations
```

#### GPT-4o Mini
```typescript
const gpt4oMiniParams = {
  temperature: 0.6,      // Slightly more conservative
  topP: 0.85,           // Slightly less diversity
  maxTokens: 2048,       // Smaller max tokens
  contextWindow: 128000  // Same context window
};

// Best for:
// - Cost-effective applications
// - High-volume usage
// - Simple tasks
```

#### GPT-3.5 Turbo
```typescript
const gpt35Params = {
  temperature: 0.7,      // Standard tuning
  topP: 0.9,            // Good diversity
  maxTokens: 1024,       // Limited max tokens
  contextWindow: 16384   // Smaller context window
};

// Best for:
// - Simple tasks
// - Quick responses
// - Cost-sensitive applications
```

### HuggingFace Models

#### Llama-2 Models
```typescript
const llama2Params = {
  temperature: 0.6,      // Conservative for safety
  topP: 0.8,            // Limited diversity
  maxTokens: 1024,       // Moderate length
  contextWindow: 4096    // Standard context
};

// Best for:
// - General conversation
// - Content generation
// - Safe applications
```

#### Mistral Models
```typescript
const mistralParams = {
  temperature: 0.7,      // Standard tuning
  topP: 0.9,            // Good diversity
  maxTokens: 2048,       // Longer responses
  contextWindow: 8192    // Larger context
};

// Best for:
// - Complex tasks
// - Code generation
// - Analysis
```

#### BERT-Based Models
```typescript
const bertParams = {
  temperature: 0.1,      // Very deterministic
  topP: 0.5,            // Limited vocabulary
  maxTokens: 256,        // Short responses
  contextWindow: 512     // Small context
};

// Best for:
// - Classification
// - Q&A
// - Text analysis
```

## Advanced Techniques

### Dynamic Parameter Adjustment

#### Context-Aware Tuning
```typescript
const adjustParamsForContext = (prompt: string, baseParams: InferenceParams) => {
  const promptLower = prompt.toLowerCase();
  
  // Detect content type
  if (promptLower.includes('code') || promptLower.includes('programming')) {
    return { ...baseParams, temperature: 0.1, topP: 0.6 };
  }
  
  if (promptLower.includes('story') || promptLower.includes('creative')) {
    return { ...baseParams, temperature: 1.1, topP: 0.95 };
  }
  
  if (promptLower.includes('analyze') || promptLower.includes('report')) {
    return { ...baseParams, temperature: 0.2, topP: 0.7 };
  }
  
  return baseParams;
};
```

#### Performance-Based Tuning
```typescript
const optimizeForPerformance = (baseParams: InferenceParams, targetLatency: number) => {
  const optimized = { ...baseParams };
  
  // Reduce max tokens for faster generation
  if (targetLatency < 1000) { // < 1 second
    optimized.maxTokens = Math.min(optimized.maxTokens, 128);
  } else if (targetLatency < 3000) { // < 3 seconds
    optimized.maxTokens = Math.min(optimized.maxTokens, 256);
  }
  
  // Lower temperature for faster, more predictable output
  optimized.temperature = Math.min(optimized.temperature, 0.5);
  
  return optimized;
};
```

### Parameter Optimization

#### Grid Search
```typescript
const parameterGridSearch = async (prompt: string, model: string) => {
  const temperatures = [0.1, 0.3, 0.5, 0.7, 0.9, 1.1];
  const topPs = [0.7, 0.8, 0.9, 0.95];
  const maxTokens = [128, 256, 512];
  
  const results = [];
  
  for (const temp of temperatures) {
    for (const topP of topPs) {
      for (const maxTok of maxTokens) {
        const params = {
          temperature: temp,
          topP: topP,
          maxTokens: maxTok
        };
        
        const result = await runInference(model, prompt, params);
        const score = evaluateOutput(result.output, prompt);
        
        results.push({
          params,
          score,
          output: result.output,
          metrics: result.metrics
        });
      }
    }
  }
  
  return results.sort((a, b) => b.score - a.score);
};
```

#### Bayesian Optimization
```typescript
const bayesianOptimization = async (prompt: string, model: string, iterations: number = 20) => {
  // Implement Bayesian optimization for parameter tuning
  // This would require a more sophisticated implementation
  // with Gaussian processes or similar methods
  
  const optimizer = new BayesianOptimizer({
    parameters: ['temperature', 'topP', 'maxTokens'],
    bounds: {
      temperature: [0.1, 1.5],
      topP: [0.7, 0.95],
      maxTokens: [64, 1024]
    }
  });
  
  let bestParams = optimizer.suggest();
  let bestScore = -Infinity;
  
  for (let i = 0; i < iterations; i++) {
    const result = await runInference(model, prompt, bestParams);
    const score = evaluateOutput(result.output, prompt);
    
    optimizer.observe(bestParams, score);
    
    if (score > bestScore) {
      bestScore = score;
      bestParams = optimizer.suggest();
    }
  }
  
  return { bestParams, bestScore };
};
```

## Parameter Presets

### Built-in Presets

#### Creative Writing
```typescript
const creativeWritingPreset = {
  name: 'Creative Writing',
  description: 'Optimized for storytelling and creative content',
  params: {
    temperature: 1.1,
    topP: 0.95,
    maxTokens: 1024,
    contextWindow: 4096
  }
};
```

#### Technical Documentation
```typescript
const technicalDocsPreset = {
  name: 'Technical Documentation',
  description: 'Optimized for accurate, detailed technical content',
  params: {
    temperature: 0.1,
    topP: 0.7,
    maxTokens: 2048,
    contextWindow: 8192
  }
};
```

#### Business Communication
```typescript
const businessPreset = {
  name: 'Business Communication',
  description: 'Optimized for professional emails and reports',
  params: {
    temperature: 0.3,
    topP: 0.8,
    maxTokens: 512,
    contextWindow: 2048
  }
};
```

#### Code Generation
```typescript
const codePreset = {
  name: 'Code Generation',
  description: 'Optimized for accurate, functional code',
  params: {
    temperature: 0.1,
    topP: 0.6,
    maxTokens: 1024,
    contextWindow: 4096
  }
};
```

### Custom Presets

#### Creating Custom Presets
```typescript
const createCustomPreset = (name: string, description: string, params: InferenceParams) => {
  const preset = {
    id: generateId(),
    name,
    description,
    params,
    createdAt: Date.now(),
    isCustom: true
  };
  
  // Save to localStorage
  const presets = getCustomPresets();
  presets.push(preset);
  localStorage.setItem('forge_custom_presets', JSON.stringify(presets));
  
  return preset;
};

// Usage
const myPreset = createCustomPreset(
  'My Blog Posts',
  'Optimized for my blog writing style',
  {
    temperature: 0.8,
    topP: 0.9,
    maxTokens: 768,
    contextWindow: 4096
  }
);
```

#### Preset Management
```typescript
const managePresets = {
  save: (preset: CustomPreset) => { /* Save preset */ },
  load: (presetId: string) => { /* Load preset */ },
  delete: (presetId: string) => { /* Delete preset */ },
  list: () => { /* List all presets */ },
  apply: (preset: CustomPreset) => { /* Apply to current session */ }
};
```

## Troubleshooting

### Common Issues

#### Output Too Repetitive
```typescript
// Problem: Low temperature, low topP
const solution = {
  temperature: 0.8,      // Increase creativity
  topP: 0.9,            // Increase diversity
  maxTokens: 512        // Reasonable length
};
```

#### Output Too Random
```typescript
// Problem: High temperature, high topP
const solution = {
  temperature: 0.4,      // Reduce randomness
  topP: 0.8,            // Focus vocabulary
  maxTokens: 256        // Shorter responses
};
```

#### Output Too Short
```typescript
// Problem: Low max tokens
const solution = {
  temperature: 0.7,      // Keep same
  topP: 0.9,            // Keep same
  maxTokens: 1024       // Increase length
};
```

#### Output Too Long
```typescript
// Problem: High max tokens
const solution = {
  temperature: 0.7,      // Keep same
  topP: 0.9,            // Keep same
  maxTokens: 256        // Reduce length
};
```

#### Context Not Considered
```typescript
// Problem: Small context window
const solution = {
  temperature: 0.7,      // Keep same
  topP: 0.9,            // Keep same
  maxTokens: 512,       // Keep same
  contextWindow: 4096   // Increase context
};
```

### Parameter Validation

#### Range Checking
```typescript
const validateParams = (params: InferenceParams): ValidationResult => {
  const errors = [];
  
  if (params.temperature < 0 || params.temperature > 2) {
    errors.push('Temperature must be between 0 and 2');
  }
  
  if (params.topP < 0 || params.topP > 1) {
    errors.push('Top-P must be between 0 and 1');
  }
  
  if (params.maxTokens < 1 || params.maxTokens > 4096) {
    errors.push('Max tokens must be between 1 and 4096');
  }
  
  if (params.contextWindow < 512 || params.contextWindow > 32768) {
    errors.push('Context window must be between 512 and 32768');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

#### Model Compatibility
```typescript
const checkModelCompatibility = (model: string, params: InferenceParams): CompatibilityCheck => {
  const modelSpecs = getModelSpecs(model);
  
  const warnings = [];
  
  if (params.maxTokens > modelSpecs.maxTokens) {
    warnings.push(`Max tokens exceeds model limit of ${modelSpecs.maxTokens}`);
  }
  
  if (params.contextWindow > modelSpecs.contextWindow) {
    warnings.push(`Context window exceeds model limit of ${modelSpecs.contextWindow}`);
  }
  
  return {
    isCompatible: warnings.length === 0,
    warnings
  };
};
```

---

This guide covers all aspects of parameter tuning in FORGE. Experiment with different settings to find the optimal configuration for your specific use case.
