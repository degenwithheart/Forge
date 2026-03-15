import { useState, useCallback, useRef, useEffect } from 'react';
import type { Modality, HFModel, InferenceResult, TelemetryData, InferenceParams, Provider } from '@/types/models';
import { DEFAULT_PARAMS, fetchOpenAIModels } from '@/types/models';
import { useModelCache } from '@/hooks/useModelCache';
import { useProviders } from '@/hooks/useProviders';
import { getSystemStats } from '@/lib/system-monitor';
import { fetchServerSystemStats, convertServerStats } from '@/lib/telemetry-client';
import { streamOpenAI, streamHuggingFace } from '@/lib/streaming';
import { loadModel, unloadModel, runInference, runInferenceStreaming } from '@/lib/model-loader';

export function useForgeEngine() {
  const [activeModality, setActiveModality] = useState<Modality>('text');
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  const [loadingModels, setLoadingModels] = useState<Set<string>>(new Set());
  const [activeModel, setActiveModel] = useState<HFModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [results, setResults] = useState<InferenceResult[]>([]);
  const [params, setParams] = useState<InferenceParams>(DEFAULT_PARAMS);
  const [openaiModels, setOpenaiModels] = useState<HFModel[]>([]);
  const [isLoadingOpenAI, setIsLoadingOpenAI] = useState(false);

  const cache = useModelCache();
  const providersHook = useProviders();

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    vramUsed: 0,
    vramTotal: 8.0,
    cpuUsage: 0,
    gpuUsage: 0,
    tps: 0,
    modelsLoaded: 0,
  });

  const telemetryInterval = useRef<number | null>(null);
  const inferenceAbort = useRef<AbortController | null>(null);

  // Start telemetry on mount and keep it running continuously
  useEffect(() => {
    // Start continuous telemetry updates
    telemetryInterval.current = window.setInterval(async () => {
      // Try to fetch from server first (real metrics)
      const serverStats = await fetchServerSystemStats();
      
      if (serverStats) {
        // Use real metrics from Node.js server
        const converted = convertServerStats(serverStats);
        setTelemetry(prev => ({
          ...prev,
          vramUsed: converted.memoryUsage,
          vramTotal: converted.memoryTotal,
          cpuUsage: converted.cpuUsage,
          gpuUsage: converted.gpuUsage,
        }));
      } else {
        // Fallback to browser-only measurements
        const stats = getSystemStats();
        setTelemetry(prev => ({
          ...prev,
          vramUsed: stats.memoryUsage,
          vramTotal: stats.memoryTotal,
          cpuUsage: stats.cpuUsage,
          gpuUsage: stats.gpuUsage,
        }));
      }
    }, 500);

    // Cleanup on unmount
    return () => {
      if (telemetryInterval.current) {
        clearInterval(telemetryInterval.current);
        telemetryInterval.current = null;
      }
    };
  }, []);

  // Fetch OpenAI models on mount if API key is available
  useEffect(() => {
    const openaiKey = providersHook.getApiKey('openai');
    const isEnabled = providersHook.isProviderEnabled('openai');
    if (openaiKey && isEnabled && openaiModels.length === 0) {
      setIsLoadingOpenAI(true);
      fetchOpenAIModels(openaiKey).then(models => {
        setOpenaiModels(models);
        setIsLoadingOpenAI(false);
      }).catch(() => setIsLoadingOpenAI(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTelemetry = useCallback(() => {
    // Telemetry already running continuously from mount effect
  }, []);

  const stopTelemetry = useCallback(() => {
    // Keep telemetry running always, don't stop it
  }, []);

  const handleModelLoad = useCallback((model: HFModel) => {
    setLoadingModels(prev => new Set(prev).add(model.modelId));
    setResults([]);
    setStreamingText('');
    cache.setModelLoadState(model.modelId, { status: 'downloading', progress: 0 });

    // Real model loading via transformers.js
    loadModel(model.modelId, model.name, (status: string) => {
      // Update cache with progress status
      cache.setModelLoadState(model.modelId, { status: 'downloading', progress: 0 });
    }).then(() => {
      // Model loaded successfully
      setLoadingModels(prev => {
        const next = new Set(prev);
        next.delete(model.modelId);
        return next;
      });
      setLoadedModels(prev => {
        const next = new Set(prev).add(model.modelId);
        setTelemetry(t => ({ ...t, modelsLoaded: next.size }));
        cache.setModelLoadState(model.modelId, { status: 'loaded' });
        return next;
      });
      setActiveModel(model);
      cache.addToCache({
        modelId: model.modelId,
        name: model.name,
        author: model.author,
        provider: model.provider || 'huggingface',
        modality: model.modality,
      });
    }).catch((err) => {
      // Model loading failed
      console.error('Failed to load model:', err);
      setLoadingModels(prev => {
        const next = new Set(prev);
        next.delete(model.modelId);
        return next;
      });
      cache.setModelLoadState(model.modelId, { status: 'error' });
      // Note: ModelCard will show error via toast
    });
  }, [cache]);

  const handleModelUnload = useCallback(async (model: HFModel) => {
    try {
      await unloadModel(model.modelId);
    } catch (err) {
      console.error('Failed to unload model:', err);
    }
    
    setResults([]);
    setStreamingText('');
    setLoadedModels(prev => {
      const next = new Set(prev);
      next.delete(model.modelId);
      setTelemetry(t => ({
        ...t,
        modelsLoaded: next.size,
      }));
      cache.setModelLoadState(model.modelId, { status: 'idle' });
      return next;
    });
    if (activeModel?.modelId === model.modelId) {
      setActiveModel(null);
    }
  }, [activeModel?.modelId, cache]);

  const handleInference = useCallback(async (prompt: string) => {
    if (!activeModel || isGenerating) return;

    setIsGenerating(true);
    setStreamingText('');
    startTelemetry();

    // Update cache
    cache.addToCache({
      modelId: activeModel.modelId,
      name: activeModel.name,
      author: activeModel.author,
      provider: activeModel.provider || 'huggingface',
      modality: activeModel.modality,
    });

    inferenceAbort.current = new AbortController();

    try {
      const provider = activeModel.provider || 'huggingface';

      if (provider === 'openai') {
        const apiKey = providersHook.getApiKey('openai');
        if (!apiKey) {
          setResults(prev => [...prev, {
            type: 'text',
            role: 'assistant',
            content: 'Error: OpenAI API key not configured',
          }]);
          setIsGenerating(false);
          stopTelemetry();
          return;
        }

        const telemetryTracker = { tps: 0, start: Date.now() };
        let tokenCount = 0;

        try {
          const result = await streamOpenAI(
            apiKey,
            activeModel.modelId,
            [{ role: 'user', content: prompt }],
            params,
            (chunk) => {
              setStreamingText(prev => prev + chunk);
              tokenCount += chunk.match(/\s+/g)?.length || 1;
              const elapsed = (Date.now() - telemetryTracker.start) / 1000;
              setTelemetry(prev => ({ ...prev, tps: tokenCount / elapsed }));
            },
            (error) => {
              setResults(prev => [...prev, { type: 'text', content: `Error: ${error}` }]);
            }
          );

          setStreamingText('');
          setResults(prev => [...prev, {
            type: 'text',
            role: 'assistant',
            content: result.fullText,
            prompt: prompt,
            tokens: result.tokenCount,
            duration: result.duration,
            tps: result.tokenCount / (result.duration / 1000),
            model: activeModel.modelId,
            provider: 'openai',
          }]);
        } catch (err) {
          setResults(prev => [...prev, {
            type: 'text',
            content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          }]);
        }
      } else {
        // Check if model is loaded locally (Python backend)
        if (loadedModels.has(activeModel.modelId)) {
          // Use local Python backend for inference with streaming
          const telemetryTracker = { tokenCount: 0, start: Date.now() };

          try {
            // Call local Python server with streaming callback for real-time TPS
            const output = await runInferenceStreaming(
              activeModel.modelId,
              prompt,
              {
                temperature: params.temperature,
                topP: params.topP,
                maxTokens: params.maxTokens,
              },
              (chunk) => {
                // Update streaming text in real-time
                setStreamingText(prev => prev + chunk);
                
                // Update telemetry with real-time TPS calculation
                telemetryTracker.tokenCount += chunk.split(/\s+/).filter(w => w).length;
                const elapsed = (Date.now() - telemetryTracker.start) / 1000;
                const tps = telemetryTracker.tokenCount / Math.max(elapsed, 0.1);
                
                setTelemetry(prev => ({
                  ...prev,
                  tps: tps,
                }));
              }
            );

            const tokenCount = output.split(/\s+/).filter(w => w).length;
            const duration = Date.now() - telemetryTracker.start;

            setStreamingText('');
            setResults(prev => [...prev, {
              type: 'text',
              role: 'assistant',
              content: output,
              prompt: prompt,
              tokens: tokenCount,
              duration: duration,
              tps: tokenCount / Math.max(duration / 1000, 0.1),
              model: activeModel.modelId,
              provider: 'local',
            }]);
          } catch (err) {
            setResults(prev => [...prev, {
              type: 'text',
              content: `Error: ${err instanceof Error ? err.message : 'Unknown error during local inference'}`,
            }]);
          }
        } else {
          // Fallback to HuggingFace API if model not loaded locally
          const apiKey = providersHook.getApiKey('huggingface');
          const telemetryTracker = { tokenCount: 0, start: Date.now() };

          try {
            const result = await streamHuggingFace(
              activeModel.modelId,
              prompt,
              apiKey,
              params,
              (chunk) => {
                setStreamingText(prev => prev + chunk);
                const elapsed = (Date.now() - telemetryTracker.start) / 1000;
                setTelemetry(prev => ({
                  ...prev,
                  tps: telemetryTracker.tokenCount / Math.max(elapsed, 0.1),
                }));
              },
              (error) => {
                setResults(prev => [...prev, { type: 'text', content: `Error: ${error}` }]);
              },
              activeModel.modality
            );

            setStreamingText('');
            setResults(prev => [...prev, {
              type: result.type as 'text' | 'image',
              role: 'assistant',
              content: result.content,
              prompt: prompt,
              tokens: result.tokenCount,
              duration: result.duration,
              tps: result.tokenCount / (result.duration / 1000),
              model: activeModel.modelId,
              provider: 'huggingface',
            }]);
          } catch (err) {
            setResults(prev => [...prev, {
              type: 'text',
              content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
            }]);
          }
        }
      }
    } catch (err) {
      setResults(prev => [...prev, {
        type: 'text',
        content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }]);
    } finally {
      setIsGenerating(false);
      inferenceAbort.current = null;
    }
  }, [activeModel, isGenerating, params, providersHook, cache]);

  const cancelInference = useCallback(() => {
    if (inferenceAbort.current) {
      inferenceAbort.current.abort();
      inferenceAbort.current = null;
    }
    setIsGenerating(false);
  }, []);

  return {
    activeModality,
    setActiveModality,
    loadedModels,
    loadingModels,
    activeModel,
    isGenerating,
    streamingText,
    results,
    telemetry,
    params,
    setParams,
    cache,
    providers: providersHook,
    handleModelLoad,
    handleModelUnload,
    handleInference,
    cancelInference,
    openaiModels,
    isLoadingOpenAI,
  };
}
