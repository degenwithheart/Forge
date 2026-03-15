# Benchmarking Guide

Complete guide to performance testing and benchmarking AI models in FORGE.

## Table of Contents

- [Overview](#overview)
- [Benchmarking Types](#benchmarking-types)
- [Testing Methodology](#testing-methodology)
- [Performance Metrics](#performance-metrics)
- [Automated Testing](#automated-testing)
- [Result Analysis](#result-analysis)
- [Comparative Analysis](#comparative-analysis)
- [Best Practices](#best-practices)

## Overview

Benchmarking in FORGE allows you to systematically evaluate and compare AI models across multiple dimensions including speed, quality, cost, and resource usage. This guide provides comprehensive methodologies for conducting thorough performance assessments.

### Why Benchmark?

- **Model Selection**: Choose the best model for your use case
- **Performance Optimization**: Identify bottlenecks and optimization opportunities
- **Cost Analysis**: Compare operational costs across providers
- **Quality Assessment**: Evaluate output quality and consistency
- **Resource Planning**: Understand hardware requirements

### Benchmarking Workflow

```
1. Define Test Scenarios
2. Configure Test Parameters
3. Execute Benchmark Tests
4. Collect Performance Data
5. Analyze Results
6. Generate Reports
7. Make Informed Decisions
```

## Benchmarking Types

### Performance Benchmarks

#### Speed Benchmarks
```typescript
interface SpeedBenchmark {
  modelId: string;
  provider: Provider;
  metrics: {
    tokensPerSecond: number;
    latency: number; // ms
    throughput: number; // requests/minute
    averageResponseTime: number; // ms
  };
  testConditions: {
    promptLength: number;
    maxTokens: number;
    temperature: number;
    concurrency: number;
  };
}
```

#### Resource Usage Benchmarks
```typescript
interface ResourceBenchmark {
  modelId: string;
  metrics: {
    vramUsage: number; // MB
    cpuUsage: number; // %
    ramUsage: number; // MB
    diskUsage: number; // MB
    powerConsumption: number; // watts
  };
  testConditions: {
    modelSize: number; // parameters
    batchSize: number;
    sequenceLength: number;
  };
}
```

### Quality Benchmarks

#### Accuracy Benchmarks
```typescript
interface AccuracyBenchmark {
  modelId: string;
  task: string;
  metrics: {
    accuracy: number; // 0-1
    f1Score: number;
    bleuScore?: number;
    rougeScore?: number;
    perplexity?: number;
  };
  testDataset: string;
  evaluationMethod: string;
}
```

#### Consistency Benchmarks
```typescript
interface ConsistencyBenchmark {
  modelId: string;
  metrics: {
    variance: number;
    reproducibility: number;
    stability: number;
  };
  testConditions: {
    numberOfRuns: number;
    promptVariations: number[];
    parameters: InferenceParams[];
  };
}
```

### Cost Benchmarks

#### Operational Cost Analysis
```typescript
interface CostBenchmark {
  modelId: string;
  provider: Provider;
  metrics: {
    costPerToken: number;
    costPerRequest: number;
    costPerHour: number;
    monthlyCost: number;
  };
  pricing: {
    inputTokenCost: number;
    outputTokenCost: number;
    modelCost: number;
    infrastructureCost: number;
  };
}
```

## Testing Methodology

### Test Design Principles

#### Scientific Method
1. **Hypothesis**: Define what you're testing
2. **Variables**: Control independent variables
3. **Constants**: Keep test conditions consistent
4. **Reproducibility**: Ensure tests can be repeated
5. **Statistical Significance**: Use sufficient sample sizes

#### Test Isolation
```typescript
const createTestEnvironment = async () => {
  // Isolate test environment
  const testConfig = {
    clearCache: true,
    resetParameters: true,
    isolateNetwork: true,
    monitorResources: true
  };
  
  // Clear all caches
  await cache.clearAll();
  
  // Reset parameters to defaults
  resetParametersToDefaults();
  
  // Start resource monitoring
  startResourceMonitoring();
  
  return testConfig;
};
```

### Test Scenarios

#### Standard Test Prompts
```typescript
const standardTestPrompts = {
  short: "What is artificial intelligence?",
  medium: "Explain the concept of machine learning and its applications in modern technology.",
  long: "Provide a comprehensive overview of artificial intelligence, including its history, key concepts, current applications, ethical considerations, and future prospects. Discuss various AI approaches such as machine learning, deep learning, natural language processing, and computer vision.",
  code: "Write a Python function that implements a binary search algorithm.",
  creative: "Write a short story about a robot discovering emotions for the first time.",
  analytical: "Analyze the economic impact of artificial intelligence on the job market over the next decade."
};
```

#### Parameter Variations
```typescript
const parameterTestMatrix = {
  temperature: [0.1, 0.3, 0.5, 0.7, 0.9, 1.1],
  topP: [0.7, 0.8, 0.9, 0.95],
  maxTokens: [128, 256, 512, 1024, 2048],
  contextWindow: [1024, 2048, 4096, 8192]
};
```

### Test Execution

#### Sequential Testing
```typescript
const runSequentialBenchmark = async (models: string[], prompts: string[]) => {
  const results = [];
  
  for (const modelId of models) {
    for (const prompt of prompts) {
      const result = await runSingleBenchmark(modelId, prompt);
      results.push(result);
      
      // Cool down period between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};
```

#### Concurrent Testing
```typescript
const runConcurrentBenchmark = async (models: string[], prompts: string[], concurrency: number) => {
  const results = [];
  const semaphore = new Semaphore(concurrency);
  
  const promises = models.flatMap(modelId =>
    prompts.map(prompt =>
      semaphore.acquire().then(async (release) => {
        try {
          const result = await runSingleBenchmark(modelId, prompt);
          results.push(result);
        } finally {
          release();
        }
      })
    )
  );
  
  await Promise.all(promises);
  return results;
};
```

## Performance Metrics

### Speed Metrics

#### Tokens Per Second (TPS)
```typescript
const calculateTPS = (tokens: number, startTime: number, endTime: number): number => {
  const duration = (endTime - startTime) / 1000; // Convert to seconds
  return tokens / Math.max(duration, 0.1); // Avoid division by zero
};
```

#### Latency Measurement
```typescript
const measureLatency = async (modelId: string, prompt: string): Promise<LatencyMetrics> => {
  const startTime = performance.now();
  
  // Start inference
  const inferencePromise = runInference(modelId, prompt);
  
  // Measure time to first token
  const firstTokenPromise = inferencePromise.then(result => {
    const firstTokenTime = performance.now();
    return {
      timeToFirstToken: firstTokenTime - startTime,
      totalTime: firstTokenTime - startTime
    };
  });
  
  return firstTokenPromise;
};
```

#### Throughput Testing
```typescript
const measureThroughput = async (modelId: string, concurrency: number, duration: number): Promise<ThroughputMetrics> => {
  const startTime = Date.now();
  const endTime = startTime + duration * 1000;
  let completedRequests = 0;
  let totalTokens = 0;
  
  const promises = [];
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(
      (async () => {
        while (Date.now() < endTime) {
          const result = await runInference(modelId, "Test prompt");
          completedRequests++;
          totalTokens += result.tokens;
          
          // Small delay to prevent overwhelming
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      })()
    );
  }
  
  await Promise.all(promises);
  
  const actualDuration = (Date.now() - startTime) / 1000;
  
  return {
    requestsPerMinute: (completedRequests / actualDuration) * 60,
    tokensPerMinute: (totalTokens / actualDuration) * 60,
    averageLatency: (actualDuration / completedRequests) * 1000
  };
};
```

### Resource Metrics

#### Memory Usage
```typescript
const measureMemoryUsage = async (modelId: string): Promise<MemoryMetrics> => {
  const baseline = await getCurrentMemoryUsage();
  
  // Load model
  await loadModel(modelId);
  const afterLoad = await getCurrentMemoryUsage();
  
  // Run inference
  await runInference(modelId, "Test prompt");
  const afterInference = await getCurrentMemoryUsage();
  
  // Unload model
  await unloadModel(modelId);
  const afterUnload = await getCurrentMemoryUsage();
  
  return {
    baseline,
    modelLoadMemory: afterLoad.ram - baseline.ram,
    inferenceMemory: afterInference.ram - afterLoad.ram,
    peakMemory: Math.max(afterLoad.ram, afterInference.ram) - baseline.ram,
    memoryFreed: afterLoad.ram - afterUnload.ram
  };
};

const getCurrentMemoryUsage = async (): Promise<{ ram: number; vram: number }> => {
  // Browser memory
  const ram = performance.memory ? performance.memory.usedJSHeapSize / 1024 / 1024 : 0;
  
  // GPU memory (if available)
  let vram = 0;
  try {
    const telemetry = await fetchServerTelemetry();
    vram = telemetry.vramUsed;
  } catch (error) {
    vram = 0;
  }
  
  return { ram, vram };
};
```

#### CPU/GPU Utilization
```typescript
const measureResourceUtilization = async (modelId: string, duration: number): Promise<ResourceMetrics> => {
  const samples = [];
  const startTime = Date.now();
  
  while (Date.now() - startTime < duration * 1000) {
    const telemetry = await fetchServerTelemetry();
    samples.push({
      timestamp: Date.now(),
      cpuUsage: telemetry.cpuUsage,
      gpuUsage: telemetry.gpuUsage,
      vramUsage: telemetry.vramUsed
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    averageCPU: samples.reduce((sum, s) => sum + s.cpuUsage, 0) / samples.length,
    peakCPU: Math.max(...samples.map(s => s.cpuUsage)),
    averageGPU: samples.reduce((sum, s) => sum + s.gpuUsage, 0) / samples.length,
    peakGPU: Math.max(...samples.map(s => s.gpuUsage)),
    averageVRAM: samples.reduce((sum, s) => sum + s.vramUsage, 0) / samples.length,
    peakVRAM: Math.max(...samples.map(s => s.vramUsage))
  };
};
```

## Automated Testing

### Test Suite Configuration

#### Benchmark Configuration
```typescript
interface BenchmarkConfig {
  models: string[];
  prompts: string[];
  parameters: InferenceParams[];
  metrics: string[];
  iterations: number;
  concurrency: number;
  duration: number;
  outputFormat: 'json' | 'csv' | 'html';
}

const defaultBenchmarkConfig: BenchmarkConfig = {
  models: ['gpt-4o', 'gpt-4o-mini', 'llama-2-7b', 'mistral-7b'],
  prompts: Object.values(standardTestPrompts),
  parameters: [
    { temperature: 0.7, topP: 0.9, maxTokens: 256 },
    { temperature: 0.1, topP: 0.8, maxTokens: 512 },
    { temperature: 1.1, topP: 0.95, maxTokens: 1024 }
  ],
  metrics: ['tps', 'latency', 'memory', 'quality'],
  iterations: 3,
  concurrency: 1,
  duration: 60,
  outputFormat: 'json'
};
```

### Test Execution Framework

#### Benchmark Runner
```typescript
class BenchmarkRunner {
  private config: BenchmarkConfig;
  private results: BenchmarkResult[] = [];
  private progress: BenchmarkProgress;
  
  constructor(config: BenchmarkConfig) {
    this.config = config;
    this.progress = {
      total: this.calculateTotalTests(),
      completed: 0,
      current: '',
      startTime: Date.now()
    };
  }
  
  async runBenchmark(): Promise<BenchmarkReport> {
    console.log('Starting benchmark...');
    
    for (const modelId of this.config.models) {
      for (const prompt of this.config.prompts) {
        for (const params of this.config.parameters) {
          await this.runSingleTest(modelId, prompt, params);
          this.updateProgress();
        }
      }
    }
    
    return this.generateReport();
  }
  
  private async runSingleTest(modelId: string, prompt: string, params: InferenceParams): Promise<void> {
    const testResults = [];
    
    for (let i = 0; i < this.config.iterations; i++) {
      const result = await this.executeTest(modelId, prompt, params);
      testResults.push(result);
    }
    
    const aggregatedResult = this.aggregateResults(testResults);
    this.results.push(aggregatedResult);
  }
  
  private async executeTest(modelId: string, prompt: string, params: InferenceParams): Promise<TestResult> {
    const startTime = performance.now();
    const startMemory = await getCurrentMemoryUsage();
    
    // Run inference
    const inferenceResult = await runInference(modelId, prompt, params);
    const endTime = performance.now();
    const endMemory = await getCurrentMemoryUsage();
    
    return {
      modelId,
      prompt,
      params,
      metrics: {
        tps: calculateTPS(inferenceResult.tokens, startTime, endTime),
        latency: endTime - startTime,
        memoryDelta: endMemory.ram - startMemory.ram,
        tokens: inferenceResult.tokens,
        quality: await assessQuality(inferenceResult.content, prompt)
      },
      timestamp: Date.now()
    };
  }
}
```

### Quality Assessment

#### Automated Quality Metrics
```typescript
const assessQuality = async (response: string, prompt: string): Promise<QualityMetrics> => {
  const metrics = {
    coherence: await calculateCoherence(response),
    relevance: await calculateRelevance(response, prompt),
    fluency: await calculateFluency(response),
    completeness: await calculateCompleteness(response, prompt),
    accuracy: await calculateAccuracy(response, prompt)
  };
  
  return {
    overall: Object.values(metrics).reduce((sum, val) => sum + val, 0) / Object.keys(metrics).length,
    ...metrics
  };
};

const calculateCoherence = async (text: string): Promise<number> => {
  // Implement coherence scoring algorithm
  const sentences = text.split('.').filter(s => s.trim());
  let coherenceScore = 0;
  
  for (let i = 1; i < sentences.length; i++) {
    const similarity = await calculateSemanticSimilarity(sentences[i-1], sentences[i]);
    coherenceScore += similarity;
  }
  
  return sentences.length > 1 ? coherenceScore / (sentences.length - 1) : 1;
};

const calculateRelevance = async (response: string, prompt: string): Promise<number> => {
  // Calculate semantic similarity between prompt and response
  const similarity = await calculateSemanticSimilarity(prompt, response);
  return similarity;
};
```

## Result Analysis

### Statistical Analysis

#### Descriptive Statistics
```typescript
const calculateDescriptiveStats = (values: number[]): DescriptiveStats => {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  
  return {
    mean: values.reduce((sum, val) => sum + val, 0) / n,
    median: n % 2 === 0 
      ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
      : sorted[Math.floor(n/2)],
    mode: calculateMode(values),
    min: sorted[0],
    max: sorted[n - 1],
    standardDeviation: calculateStandardDeviation(values),
    variance: calculateVariance(values),
    percentiles: {
      p25: sorted[Math.floor(n * 0.25)],
      p50: sorted[Math.floor(n * 0.5)],
      p75: sorted[Math.floor(n * 0.75)],
      p90: sorted[Math.floor(n * 0.9)],
      p95: sorted[Math.floor(n * 0.95)],
      p99: sorted[Math.floor(n * 0.99)]
    }
  };
};
```

#### Comparative Analysis
```typescript
const compareModels = (results: BenchmarkResult[]): ModelComparison => {
  const modelGroups = groupBy(results, 'modelId');
  const comparisons = {};
  
  for (const [modelId, modelResults] of Object.entries(modelGroups)) {
    comparisons[modelId] = {
      speed: calculateDescriptiveStats(modelResults.map(r => r.metrics.tps)),
      latency: calculateDescriptiveStats(modelResults.map(r => r.metrics.latency)),
      memory: calculateDescriptiveStats(modelResults.map(r => r.metrics.memoryDelta)),
      quality: calculateDescriptiveStats(modelResults.map(r => r.metrics.quality.overall))
    };
  }
  
  return comparisons;
};
```

### Visualization

#### Performance Charts
```typescript
const generatePerformanceChart = (results: BenchmarkResult[]): ChartData => {
  const modelNames = [...new Set(results.map(r => r.modelId))];
  const metrics = ['tps', 'latency', 'memory', 'quality'];
  
  return {
    type: 'bar',
    data: {
      labels: modelNames,
      datasets: metrics.map(metric => ({
        label: metric.toUpperCase(),
        data: modelNames.map(modelId => {
          const modelResults = results.filter(r => r.modelId === modelId);
          return calculateDescriptiveStats(modelResults.map(r => r.metrics[metric])).mean;
        }),
        backgroundColor: getColorForMetric(metric)
      }))
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Model Performance Comparison'
        }
      }
    }
  };
};
```

#### Scatter Plots
```typescript
const generateScatterPlot = (results: BenchmarkResult[]): ChartData => {
  return {
    type: 'scatter',
    data: {
      datasets: [...new Set(results.map(r => r.modelId))].map(modelId => ({
        label: modelId,
        data: results
          .filter(r => r.modelId === modelId)
          .map(r => ({
            x: r.metrics.tps,
            y: r.metrics.quality.overall
          }))
      }))
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Speed vs Quality Trade-off'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Tokens per Second'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Quality Score'
          }
        }
      }
    }
  };
};
```

## Comparative Analysis

### Model Ranking

#### Multi-Criteria Decision Analysis
```typescript
const rankModels = (results: BenchmarkResult[], weights: Weights): ModelRanking => {
  const modelScores = {};
  
  // Normalize scores for each model
  for (const modelId of [...new Set(results.map(r => r.modelId))]) {
    const modelResults = results.filter(r => r.modelId === modelId);
    
    const normalizedScores = {
      speed: normalizeScore(calculateAverage(modelResults.map(r => r.metrics.tps)), 'speed'),
      latency: normalizeScore(calculateAverage(modelResults.map(r => r.metrics.latency)), 'latency'),
      memory: normalizeScore(calculateAverage(modelResults.map(r => r.metrics.memoryDelta)), 'memory'),
      quality: normalizeScore(calculateAverage(modelResults.map(r => r.metrics.quality.overall)), 'quality')
    };
    
    // Calculate weighted score
    const weightedScore = 
      normalizedScores.speed * weights.speed +
      normalizedScores.latency * weights.latency +
      normalizedScores.memory * weights.memory +
      normalizedScores.quality * weights.quality;
    
    modelScores[modelId] = {
      weightedScore,
      normalizedScores,
      rank: 0 // Will be set after sorting
    };
  }
  
  // Sort and assign ranks
  const sortedModels = Object.entries(modelScores)
    .sort(([,a], [,b]) => b.weightedScore - a.weightedScore);
  
  sortedModels.forEach(([modelId, score], index) => {
    score.rank = index + 1;
  });
  
  return Object.fromEntries(sortedModels);
};
```

#### Cost-Benefit Analysis
```typescript
const analyzeCostBenefit = (results: BenchmarkResult[], costs: ModelCosts): CostBenefitAnalysis => {
  const analysis = {};
  
  for (const modelId of [...new Set(results.map(r => r.modelId))]) {
    const modelResults = results.filter(r => r.modelId === modelId);
    const cost = costs[modelId];
    
    const performance = {
      avgTPS: calculateAverage(modelResults.map(r => r.metrics.tps)),
      avgQuality: calculateAverage(modelResults.map(r => r.metrics.quality.overall)),
      avgLatency: calculateAverage(modelResults.map(r => r.metrics.latency))
    };
    
    const costPerPerformance = {
      costPerTPS: cost.perHour / performance.avgTPS,
      costPerQualityPoint: cost.perHour / performance.avgQuality,
      costPerRequest: cost.perRequest
    };
    
    const benefitScore = (performance.avgTPS * performance.avgQuality) / cost.perHour;
    
    analysis[modelId] = {
      performance,
      cost,
      costPerPerformance,
      benefitScore,
      roi: benefitScore / cost.perHour // Return on investment
    };
  }
  
  return analysis;
};
```

## Best Practices

### Test Design

#### Representative Workloads
```typescript
const designRepresentativeWorkload = (useCase: UseCase): TestWorkload => {
  const workloads = {
    chatbot: {
      prompts: [
        "Hello, how can I help you today?",
        "What's the weather like?",
        "Tell me a joke",
        "Explain quantum computing simply"
      ],
      parameters: { temperature: 0.7, topP: 0.9, maxTokens: 256 },
      concurrency: 5,
      duration: 300 // 5 minutes
    },
    codeGeneration: {
      prompts: [
        "Write a function to sort an array",
        "Create a REST API endpoint",
        "Implement binary search",
        "Parse JSON data"
      ],
      parameters: { temperature: 0.1, topP: 0.8, maxTokens: 512 },
      concurrency: 1,
      duration: 600 // 10 minutes
    },
    contentCreation: {
      prompts: [
        "Write a blog post about AI",
        "Create a product description",
        "Draft an email to customers",
        "Generate social media content"
      ],
      parameters: { temperature: 0.8, topP: 0.95, maxTokens: 1024 },
      concurrency: 2,
      duration: 900 // 15 minutes
    }
  };
  
  return workloads[useCase];
};
```

#### Statistical Significance
```typescript
const ensureStatisticalSignificance = (results: number[], confidenceLevel: number = 0.95): boolean => {
  const n = results.length;
  const mean = calculateMean(results);
  const stdDev = calculateStandardDeviation(results);
  const marginOfError = (stdDev / Math.sqrt(n)) * getZScore(confidenceLevel);
  
  // Check if margin of error is acceptable (< 5% of mean)
  return (marginOfError / mean) < 0.05;
};

const getZScore = (confidenceLevel: number): number => {
  const zScores = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576
  };
  return zScores[confidenceLevel] || 1.96;
};
```

### Result Interpretation

#### Contextual Analysis
```typescript
const contextualizeResults = (results: BenchmarkResult[], context: BenchmarkContext): ContextualAnalysis => {
  return {
    performance: {
      excellent: results.filter(r => r.metrics.tps > context.excellentThreshold),
      good: results.filter(r => r.metrics.tps > context.goodThreshold && r.metrics.tps <= context.excellentThreshold),
      acceptable: results.filter(r => r.metrics.tps > context.minimumThreshold && r.metrics.tps <= context.goodThreshold),
      poor: results.filter(r => r.metrics.tps <= context.minimumThreshold)
    },
    recommendations: generateRecommendations(results, context),
    limitations: identifyLimitations(results, context),
    nextSteps: suggestNextSteps(results, context)
  };
};
```

#### Reporting Standards
```typescript
const generateBenchmarkReport = (results: BenchmarkResult[], config: BenchmarkConfig): BenchmarkReport => {
  return {
    summary: {
      totalTests: results.length,
      modelsTested: [...new Set(results.map(r => r.modelId))],
      testDuration: Date.now() - config.startTime,
      overallPerformance: calculateOverallPerformance(results)
    },
    detailedResults: results,
    analysis: {
      rankings: rankModels(results, config.weights),
      comparisons: compareModels(results),
      trends: identifyTrends(results),
      outliers: detectOutliers(results)
    },
    recommendations: generateRecommendations(results, config),
    methodology: {
      testDesign: config,
      dataCollection: "Automated collection via FORGE benchmark suite",
      analysisMethods: ["Statistical analysis", "Comparative analysis", "Cost-benefit analysis"]
    },
    appendix: {
      rawData: results,
      configuration: config,
      environmentalFactors: collectEnvironmentalFactors()
    }
  };
};
```

---

This guide provides a comprehensive framework for benchmarking AI models in FORGE. Use these methodologies to make informed decisions about model selection and optimization strategies.
