# Cache Management Guide

Complete guide to managing model cache, storage, and performance optimization in FORGE.

## Table of Contents

- [Overview](#overview)
- [Cache Architecture](#cache-architecture)
- [Storage Management](#storage-management)
- [Cache Operations](#cache-operations)
- [Performance Optimization](#performance-optimization)
- [Cache Analytics](#cache-analytics)
- [Advanced Configuration](#advanced-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

FORGE uses a multi-layered caching system to optimize performance and reduce redundant model downloads and API calls. Understanding cache management is crucial for efficient operation.

### Cache Layers

1. **Browser Cache**: HTTP caching for static assets
2. **Query Cache**: TanStack Query for API responses (5 minutes)
3. **Model Cache**: localStorage for model metadata (7 days)
4. **Python Cache**: Local disk storage for downloaded models

### Key Benefits

- **Faster Loading**: Cached models load in seconds vs minutes
- **Reduced Bandwidth**: Avoid re-downloading models
- **Offline Capability**: Access cached models without internet
- **Cost Savings**: Fewer API calls to paid providers

## Cache Architecture

### Multi-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│                    Cache Architecture                      │
├─────────────────────────────────────────────────────────┤
│  Browser Cache (HTTP)                                    │
│  ├─ Static assets (JS, CSS, images)                     │
│  ├─ API responses (5-minute TTL)                         │
│  └─ Automatic browser management                         │
├─────────────────────────────────────────────────────────┤
│  Query Cache (TanStack Query)                             │
│  ├─ Model metadata (5 minutes)                          │
│  ├─ Provider status (1 minute)                          │
│  ├─ User preferences (persistent)                        │
│  └─ Automatic invalidation                               │
├─────────────────────────────────────────────────────────┤
│  Model Cache (localStorage)                               │
│  ├─ Model metadata (7 days)                             │
│  ├─ Usage statistics (persistent)                        │
│  ├─ API keys (encrypted)                                │
│  └─ Parameter presets (persistent)                       │
├─────────────────────────────────────────────────────────┤
│  Python Model Cache                                       │
│  ├─ Downloaded models (disk)                            │
│  ├─ Model artifacts (cache)                              │
│  ├─ Loaded models (RAM/VRAM)                           │
│  └─ Automatic cleanup                                    │
└─────────────────────────────────────────────────────────┘
```

### Cache Data Flow

```typescript
// Cache flow for model loading
const loadModelWithCache = async (modelId: string) => {
  // 1. Check localStorage cache
  const cached = await cache.getCachedModel(modelId);
  if (cached) {
    // 2. Update usage statistics
    await cache.touchModel(modelId);
    return cached;
  }
  
  // 3. Query cache check (TanStack Query)
  const queryCache = queryClient.getQueryData(['models', modelId]);
  if (queryCache) {
    // 4. Store in localStorage
    await cache.addModel(queryCache);
    return queryCache;
  }
  
  // 5. Fetch from API
  const modelData = await fetchModelFromAPI(modelId);
  
  // 6. Store in all cache layers
  await cache.addModel(modelData);
  queryClient.setQueryData(['models', modelId], modelData);
  
  return modelData;
};
```

## Storage Management

### Storage Limits

#### Default Configuration
```typescript
const defaultCacheConfig = {
  storageLimitMB: 500,        // Total storage limit
  pruneDays: 7,               // Auto-prune after 7 days
  maxModels: 50,              // Maximum number of models
  queryCacheMinutes: 5,       // Query cache duration
  telemetryInterval: 500       // Telemetry update frequency
};
```

#### Storage Estimation
```typescript
const estimateModelSize = (model: HFModel): number => {
  // Base size estimation logic
  const baseSize = {
    'text-generation': 500,    // MB
    'text2text-generation': 800,
    'image-generation': 2000,
    'audio': 1000,
    'video': 3000
  };
  
  // Adjust based on model characteristics
  let size = baseSize[model.modality] || 500;
  
  // Adjust for model size indicators
  if (model.modelId.includes('large')) size *= 2;
  if (model.modelId.includes('base')) size *= 0.5;
  if (model.modelId.includes('small')) size *= 0.25;
  
  // Adjust for quantization
  if (model.modelId.includes('quantized')) size *= 0.3;
  if (model.modelId.includes('int8')) size *= 0.3;
  if (model.modelId.includes('int4')) size *= 0.15;
  
  return Math.round(size);
};
```

### Storage Monitoring

#### Real-time Tracking
```typescript
const useStorageMonitoring = () => {
  const [storageStats, setStorageStats] = useState<StorageStats>({
    used: 0,
    limit: 500,
    available: 500,
    percentage: 0,
    models: 0
  });
  
  useEffect(() => {
    const updateStats = async () => {
      const stats = await cache.getCacheStats();
      const used = stats.totalSizeMB;
      const limit = cache.getStorageLimit();
      
      setStorageStats({
        used,
        limit,
        available: limit - used,
        percentage: (used / limit) * 100,
        models: stats.totalModels
      });
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return storageStats;
};
```

#### Storage Alerts
```typescript
const useStorageAlerts = () => {
  const storageStats = useStorageMonitoring();
  
  useEffect(() => {
    // Warning at 80%
    if (storageStats.percentage >= 80 && storageStats.percentage < 90) {
      toast.warning('Cache storage almost full', {
        description: 'Consider removing unused models or increasing storage limit',
        action: {
          label: 'Manage Cache',
          onClick: () => openCacheManager()
        }
      });
    }
    
    // Critical at 95%
    if (storageStats.percentage >= 95) {
      toast.error('Cache storage critically full', {
        description: 'Auto-pruning will be triggered soon',
        action: {
          label: 'Clear Cache',
          onClick: () => cache.clearAll()
        }
      });
    }
  }, [storageStats.percentage]);
};
```

## Cache Operations

### Model Cache Operations

#### Add Model to Cache
```typescript
const addModelToCache = async (model: HFModel): Promise<void> => {
  const cachedModel: CachedModel = {
    modelId: model.modelId,
    name: model.name,
    author: model.author,
    provider: model.provider || 'huggingface',
    modality: model.modality,
    estimatedSizeMB: estimateModelSize(model),
    loadedAt: Date.now(),
    lastUsed: Date.now(),
    accessCount: 1
  };
  
  await cache.addModel(cachedModel);
  
  // Trigger storage limit enforcement
  await cache.enforceStorageLimit();
};
```

#### Remove Model from Cache
```typescript
const removeModelFromCache = async (modelId: string): Promise<void> => {
  const result = await cache.removeModel(modelId);
  
  if (result.success) {
    toast.success(`Removed ${modelId} from cache`, {
      description: `Freed ${result.freedMB}MB of storage`
    });
  } else {
    toast.error(`Failed to remove ${modelId} from cache`);
  }
};
```

#### Update Model Usage
```typescript
const touchModel = async (modelId: string): Promise<void> => {
  await cache.touchModel(modelId);
  
  // Update UI to reflect recent usage
  const model = await cache.getCachedModel(modelId);
  if (model) {
    setRecentModels(prev => [
      model,
      ...prev.filter(m => m.modelId !== modelId).slice(0, 9)
    ]);
  }
};
```

### Cache Maintenance

#### Auto-Pruning
```typescript
const performAutoPruning = async (): Promise<PruningResult> => {
  const config = cache.getConfig();
  const cutoffTime = Date.now() - (config.pruneDays * 24 * 60 * 60 * 1000);
  
  // Find models to prune
  const modelsToPrune = await cache.getModelsOlderThan(cutoffTime);
  
  // Prune models
  let totalFreed = 0;
  const prunedModels = [];
  
  for (const model of modelsToPrune) {
    const result = await cache.removeModel(model.modelId);
    if (result.success) {
      totalFreed += result.freedMB;
      prunedModels.push(model);
    }
  }
  
  return {
    modelsPruned: prunedModels.length,
    spaceFreed: totalFreed,
    modelsPrunedList: prunedModels
  };
};
```

#### Storage Limit Enforcement
```typescript
const enforceStorageLimit = async (): Promise<void> => {
  const currentSize = await cache.getTotalCacheSize();
  const limit = cache.getStorageLimit();
  
  if (currentSize > limit) {
    // Sort models by last used time (oldest first)
    const models = await cache.getCachedModels();
    models.sort((a, b) => a.lastUsed - b.lastUsed);
    
    let freedSize = 0;
    const targetSize = limit * 0.9; // Free up to 90% of limit
    
    for (const model of models) {
      if (currentSize - freedSize <= targetSize) break;
      
      const result = await cache.removeModel(model.modelId);
      if (result.success) {
        freedSize += result.freedMB;
      }
    }
  }
};
```

#### Cache Validation
```typescript
const validateCache = async (): Promise<ValidationResult> => {
  const issues = [];
  const warnings = [];
  
  // Check for corrupted entries
  const models = await cache.getCachedModels();
  for (const model of models) {
    if (!model.modelId || !model.name) {
      issues.push(`Invalid model entry: ${model.modelId}`);
    }
    
    if (model.estimatedSizeMB <= 0) {
      warnings.push(`Invalid size estimate for ${model.modelId}`);
    }
  }
  
  // Check storage consistency
  const actualSize = await calculateActualCacheSize();
  const reportedSize = await cache.getTotalCacheSize();
  
  if (Math.abs(actualSize - reportedSize) > 50) { // 50MB tolerance
    warnings.push(`Cache size mismatch: reported ${reportedSize}MB, actual ${actualSize}MB`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    totalModels: models.length,
    actualSize,
    reportedSize
  };
};
```

## Performance Optimization

### Cache Performance Tuning

#### Optimize Cache Size
```typescript
const optimizeCacheSize = async (): Promise<OptimizationResult> => {
  const stats = await cache.getCacheStats();
  const config = cache.getConfig();
  
  // Analyze usage patterns
  const usagePatterns = analyzeUsagePatterns(stats);
  
  // Recommendations
  const recommendations = [];
  
  // Increase limit if frequently hitting limits
  if (usagePatterns.frequentlyEvicted > 0.1) {
    recommendations.push({
      type: 'increase_limit',
      message: 'Consider increasing storage limit to reduce evictions',
      suggestedLimit: config.storageLimitMB * 1.5
    });
  }
  
  // Decrease limit if underutilized
  if (usagePatterns.utilization < 0.3) {
    recommendations.push({
      type: 'decrease_limit',
      message: 'Consider decreasing storage limit to save space',
      suggestedLimit: config.storageLimitMB * 0.7
    });
  }
  
  // Adjust prune days based on usage
  if (usagePatterns.averageAge < config.pruneDays * 0.5) {
    recommendations.push({
      type: 'reduce_prune_days',
      message: 'Models are not kept long enough, consider increasing prune period',
      suggestedDays: config.pruneDays * 2
    });
  }
  
  return {
    currentStats: stats,
    usagePatterns,
    recommendations
  };
};
```

#### Cache Warming
```typescript
const warmCache = async (modelIds: string[]): Promise<WarmingResult> => {
  const results = [];
  
  for (const modelId of modelIds) {
    try {
      // Check if already cached
      const cached = await cache.getCachedModel(modelId);
      if (cached) {
        results.push({ modelId, status: 'already_cached' });
        continue;
      }
      
      // Pre-fetch model metadata
      const modelData = await fetchModelMetadata(modelId);
      await cache.addModel(modelData);
      
      results.push({ modelId, status: 'warmed' });
    } catch (error) {
      results.push({ modelId, status: 'error', error: error.message });
    }
  }
  
  return {
    total: modelIds.length,
    successful: results.filter(r => r.status === 'warmed').length,
    alreadyCached: results.filter(r => r.status === 'already_cached').length,
    errors: results.filter(r => r.status === 'error'),
    details: results
  };
};
```

#### Cache Prefetching
```typescript
const prefetchRelatedModels = async (currentModel: string): Promise<void> => {
  // Find similar models based on usage patterns
  const relatedModels = await findRelatedModels(currentModel);
  
  // Prefetch top 3 related models
  const topModels = relatedModels.slice(0, 3);
  
  for (const model of topModels) {
    // Don't prefetch if cache is nearly full
    const currentSize = await cache.getTotalCacheSize();
    const limit = cache.getStorageLimit();
    
    if (currentSize / limit > 0.8) break;
    
    try {
      await fetchModelMetadata(model.modelId);
      await cache.addModel(model);
    } catch (error) {
      // Ignore prefetch errors
      console.warn(`Failed to prefetch ${model.modelId}:`, error);
    }
  }
};
```

### Memory Optimization

#### Lazy Loading
```typescript
const useLazyCacheLoading = () => {
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  
  const loadModelOnDemand = async (modelId: string) => {
    if (loadedModels.has(modelId)) return;
    
    try {
      const model = await cache.getCachedModel(modelId);
      if (model) {
        setLoadedModels(prev => new Set(prev).add(modelId));
      }
    } catch (error) {
      console.error(`Failed to load model ${modelId}:`, error);
    }
  };
  
  return {
    loadedModels,
    loadModelOnDemand,
    isModelLoaded: (modelId: string) => loadedModels.has(modelId)
  };
};
```

#### Memory Cleanup
```typescript
const performMemoryCleanup = async (): Promise<void> => {
  // Clear unused model data from memory
  const loadedModels = getLoadedModels();
  const cachedModels = await cache.getCachedModels();
  
  // Find models loaded in memory but not in cache
  const orphanedModels = loadedModels.filter(modelId => 
    !cachedModels.some(cached => cached.modelId === modelId)
  );
  
  // Unload orphaned models
  for (const modelId of orphanedModels) {
    try {
      await unloadModel(modelId);
    } catch (error) {
      console.warn(`Failed to unload orphaned model ${modelId}:`, error);
    }
  }
  
  // Trigger garbage collection if available
  if (window.gc) {
    window.gc();
  }
};
```

## Cache Analytics

### Usage Statistics

#### Model Usage Patterns
```typescript
const analyzeUsagePatterns = async (stats: CacheStats): Promise<UsagePatterns> => {
  const models = await cache.getCachedModels();
  
  // Calculate usage metrics
  const totalAccess = models.reduce((sum, model) => sum + model.accessCount, 0);
  const averageAccess = totalAccess / models.length;
  
  // Find most used models
  const mostUsed = models
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, 5);
  
  // Find least used models
  const leastUsed = models
    .sort((a, b) => a.accessCount - b.accessCount)
    .slice(0, 5);
  
  // Calculate age distribution
  const now = Date.now();
  const ageDistribution = models.reduce((acc, model) => {
    const ageDays = (now - model.loadedAt) / (24 * 60 * 60 * 1000);
    const bucket = getAgeBucket(ageDays);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalModels: models.length,
    totalAccess,
    averageAccess,
    mostUsed,
    leastUsed,
    ageDistribution,
    frequentlyEvicted: calculateEvictionRate(models),
    utilization: stats.totalSizeMB / cache.getStorageLimit()
  };
};

const getAgeBucket = (ageDays: number): string => {
  if (ageDays < 1) return '< 1 day';
  if (ageDays < 7) return '1-7 days';
  if (ageDays < 30) return '7-30 days';
  return '> 30 days';
};
```

#### Performance Metrics
```typescript
const getCachePerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  const startTime = Date.now();
  
  // Test cache read performance
  const readTimes = [];
  for (let i = 0; i < 100; i++) {
    const start = Date.now();
    await cache.getCachedModels();
    readTimes.push(Date.now() - start);
  }
  
  // Test cache write performance
  const writeTimes = [];
  for (let i = 0; i < 10; i++) {
    const testModel = createTestModel(i);
    const start = Date.now();
    await cache.addModel(testModel);
    writeTimes.push(Date.now() - start);
    await cache.removeModel(testModel.modelId);
  }
  
  return {
    averageReadTime: readTimes.reduce((a, b) => a + b) / readTimes.length,
    averageWriteTime: writeTimes.reduce((a, b) => a + b) / writeTimes.length,
    readThroughput: 100 / (readTimes.reduce((a, b) => a + b) / readTimes.length),
    writeThroughput: 10 / (writeTimes.reduce((a, b) => a + b) / writeTimes.length),
    cacheHitRate: await calculateCacheHitRate(),
    evictionRate: await calculateEvictionRate()
  };
};
```

### Cache Reports

#### Generate Cache Report
```typescript
const generateCacheReport = async (): Promise<CacheReport> => {
  const stats = await cache.getCacheStats();
  const usagePatterns = await analyzeUsagePatterns(stats);
  const performanceMetrics = await getCachePerformanceMetrics();
  
  return {
    summary: {
      totalModels: stats.totalModels,
      totalSize: stats.totalSizeMB,
      storageUtilization: (stats.totalSizeMB / cache.getStorageLimit()) * 100,
      averageModelSize: stats.totalSizeMB / stats.totalModels,
      oldestModel: stats.oldestModel?.loadedAt,
      newestModel: stats.newestModel?.loadedAt
    },
    usage: usagePatterns,
    performance: performanceMetrics,
    recommendations: generateRecommendations(stats, usagePatterns, performanceMetrics),
    generatedAt: Date.now()
  };
};
```

#### Export Cache Data
```typescript
const exportCacheData = async (): Promise<ExportData> => {
  const models = await cache.getCachedModels();
  const stats = await cache.getCacheStats();
  const config = cache.getConfig();
  
  return {
    version: '1.0',
    exportedAt: Date.now(),
    config,
    models,
    stats,
    metadata: {
      totalModels: models.length,
      totalSize: stats.totalSizeMB,
      exportFormat: 'forge-cache-json'
    }
  };
};

const importCacheData = async (data: ExportData): Promise<void> => {
  // Validate data format
  if (data.version !== '1.0') {
    throw new Error('Unsupported cache data version');
  }
  
  // Import models
  for (const model of data.models) {
    await cache.addModel(model);
  }
  
  // Import configuration
  cache.setStorageLimit(data.config.storageLimitMB);
  cache.setPruneDays(data.config.pruneDays);
};
```

## Advanced Configuration

### Custom Cache Strategies

#### LRU with Weighting
```typescript
class WeightedLRUCache extends CacheManager {
  private calculateWeight(model: CachedModel): number {
    const now = Date.now();
    const ageInHours = (now - model.loadedAt) / (60 * 60 * 1000);
    const recentAccess = (now - model.lastUsed) / (60 * 60 * 1000);
    
    // Weight = access frequency * recency * size factor
    return model.accessCount * Math.exp(-recentAccess / 24) * Math.log(model.estimatedSizeMB + 1);
  }
  
  protected async selectEvictionCandidates(): Promise<string[]> {
    const models = await this.getCachedModels();
    
    // Sort by weight (lowest weight = least valuable)
    models.sort((a, b) => this.calculateWeight(a) - this.calculateWeight(b));
    
    return models.map(m => m.modelId);
  }
}
```

#### Predictive Caching
```typescript
class PredictiveCache extends CacheManager {
  private usagePredictor = new UsagePredictor();
  
  async addToCache(model: CachedModel): Promise<void> {
    await super.addModel(model);
    
    // Update prediction model
    this.usagePredictor.recordAccess(model.modelId, Date.now());
    
    // Predict next likely models
    const predictions = this.usagePredictor.predictNextModels(model.modelId);
    
    // Prefetch high-confidence predictions
    for (const prediction of predictions) {
      if (prediction.confidence > 0.8) {
        this.prefetchModel(prediction.modelId);
      }
    }
  }
  
  private async prefetchModel(modelId: string): Promise<void> {
    try {
      const modelData = await fetchModelMetadata(modelId);
      await this.addModel(modelData);
    } catch (error) {
      // Ignore prefetch errors
    }
  }
}
```

### Cache Events

#### Event System
```typescript
class CacheEventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => callback(data));
  }
}

// Usage in cache manager
class CacheManager extends CacheEventEmitter {
  async addModel(model: CachedModel): Promise<void> {
    // ... existing logic
    
    this.emit('model:added', { model, timestamp: Date.now() });
  }
  
  async removeModel(modelId: string): Promise<void> {
    // ... existing logic
    
    this.emit('model:removed', { modelId, timestamp: Date.now() });
  }
}

// Event listeners
cacheManager.on('model:added', (data) => {
  console.log(`Model added: ${data.model.name}`);
  updateStorageDisplay();
});

cacheManager.on('model:removed', (data) => {
  console.log(`Model removed: ${data.modelId}`);
  updateStorageDisplay();
});
```

## Troubleshooting

### Common Issues

#### Cache Corruption
```typescript
const detectCacheCorruption = async (): Promise<CorruptionReport> => {
  const issues = [];
  
  // Check for invalid JSON
  try {
    const cacheData = localStorage.getItem('forge_cache_index');
    if (cacheData) {
      JSON.parse(cacheData);
    }
  } catch (error) {
    issues.push({
      type: 'json_corruption',
      message: 'Cache index contains invalid JSON',
      severity: 'critical'
    });
  }
  
  // Check for missing model data
  const models = await cache.getCachedModels();
  for (const model of models) {
    const modelData = localStorage.getItem(`forge_cache_${model.modelId}`);
    if (!modelData) {
      issues.push({
        type: 'missing_data',
        message: `Missing data for model ${model.modelId}`,
        severity: 'high'
      });
    }
  }
  
  return {
    hasIssues: issues.length > 0,
    issues,
    canAutoFix: issues.every(i => i.severity !== 'critical')
  };
};
```

#### Performance Issues
```typescript
const diagnosePerformanceIssues = async (): Promise<PerformanceDiagnosis> => {
  const metrics = await getCachePerformanceMetrics();
  const issues = [];
  
  // Slow read performance
  if (metrics.averageReadTime > 100) {
    issues.push({
      type: 'slow_reads',
      message: `Average read time is ${metrics.averageReadTime}ms (should be < 100ms)`,
      suggestions: ['Consider reducing cache size', 'Check for memory leaks']
    });
  }
  
  // Low cache hit rate
  if (metrics.cacheHitRate < 0.7) {
    issues.push({
      type: 'low_hit_rate',
      message: `Cache hit rate is ${(metrics.cacheHitRate * 100).toFixed(1)}% (should be > 70%)`,
      suggestions: ['Increase cache size', 'Adjust cache TTL', 'Review access patterns']
    });
  }
  
  // High eviction rate
  if (metrics.evictionRate > 0.1) {
    issues.push({
      type: 'high_eviction',
      message: `Eviction rate is ${(metrics.evictionRate * 100).toFixed(1)}% (should be < 10%)`,
      suggestions: ['Increase storage limit', 'Optimize cache strategy']
    });
  }
  
  return {
    metrics,
    issues,
    overallHealth: issues.length === 0 ? 'healthy' : 'needs_attention'
  };
};
```

#### Recovery Procedures
```typescript
const recoverFromCorruption = async (): Promise<RecoveryResult> => {
  const corruption = await detectCacheCorruption();
  
  if (!corruption.hasIssues) {
    return { status: 'no_corruption', actions: [] };
  }
  
  const actions = [];
  
  // Backup current cache
  const backup = await createCacheBackup();
  actions.push('Created backup of corrupted cache');
  
  // Clear corrupted data
  if (corruption.issues.some(i => i.type === 'json_corruption')) {
    localStorage.removeItem('forge_cache_index');
    actions.push('Cleared corrupted cache index');
  }
  
  // Remove corrupted model entries
  for (const issue of corruption.issues) {
    if (issue.type === 'missing_data') {
      const modelId = issue.message.match(/Missing data for model (.+)/)?.[1];
      if (modelId) {
        localStorage.removeItem(`forge_cache_${modelId}`);
        actions.push(`Removed corrupted entry for ${modelId}`);
      }
    }
  }
  
  // Reinitialize cache
  await cache.initialize();
  actions.push('Reinitialized cache system');
  
  return {
    status: 'recovered',
    actions,
    backup
  };
};
```

### Cache Debugging

#### Debug Mode
```typescript
class DebugCacheManager extends CacheManager {
  private debugLogs: DebugLog[] = [];
  
  private log(operation: string, data: any): void {
    const logEntry: DebugLog = {
      timestamp: Date.now(),
      operation,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      stackTrace: new Error().stack
    };
    
    this.debugLogs.push(logEntry);
    
    // Keep only last 1000 logs
    if (this.debugLogs.length > 1000) {
      this.debugLogs = this.debugLogs.slice(-1000);
    }
  }
  
  async addModel(model: CachedModel): Promise<void> {
    this.log('addModel_start', { modelId: model.modelId });
    
    try {
      await super.addModel(model);
      this.log('addModel_success', { modelId: model.modelId });
    } catch (error) {
      this.log('addModel_error', { modelId: model.modelId, error: error.message });
      throw error;
    }
  }
  
  getDebugLogs(): DebugLog[] {
    return [...this.debugLogs];
  }
  
  exportDebugLogs(): string {
    return JSON.stringify(this.debugLogs, null, 2);
  }
}
```

#### Cache Visualization
```typescript
const generateCacheVisualization = async (): Promise<VisualizationData> => {
  const models = await cache.getCachedModels();
  const stats = await cache.getCacheStats();
  
  // Create size distribution
  const sizeDistribution = models.reduce((acc, model) => {
    const bucket = getSizeBucket(model.estimatedSizeMB);
    acc[bucket] = (acc[bucket] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Create usage timeline
  const timeline = models.map(model => ({
    date: new Date(model.loadedAt),
    modelId: model.modelId,
    size: model.estimatedSizeMB,
    accessCount: model.accessCount
  }));
  
  // Create provider distribution
  const providerDistribution = models.reduce((acc, model) => {
    acc[model.provider] = (acc[model.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    sizeDistribution,
    timeline,
    providerDistribution,
    totalModels: models.length,
    totalSize: stats.totalSizeMB
  };
};

const getSizeBucket = (sizeMB: number): string => {
  if (sizeMB < 100) return '< 100MB';
  if (sizeMB < 500) return '100-500MB';
  if (sizeMB < 1000) return '500MB-1GB';
  if (sizeMB < 2000) return '1-2GB';
  return '> 2GB';
};
```

---

This guide covers all aspects of cache management in FORGE. Proper cache management is essential for optimal performance and user experience.
