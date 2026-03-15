import { useState, useCallback, useEffect } from 'react';
import type { CachedModel, ModelLoadState } from '@/types/models';
import { getModelMetadata, saveModelMetadata, initDB, clearOldSearches } from '@/lib/db';

const LOAD_STATES_KEY = 'forge_model_load_states';

interface CacheEntry {
  metadata: CachedModel;
  state: ModelLoadState;
}

function readLoadStates(): Record<string, ModelLoadState> {
  try {
    const raw = localStorage.getItem(LOAD_STATES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLoadStates(states: Record<string, ModelLoadState>) {
  localStorage.setItem(LOAD_STATES_KEY, JSON.stringify(states));
}

export function useModelCache() {
  const [cachedModels, setCachedModels] = useState<CachedModel[]>([]);
  const [loadStates, setLoadStates] = useState<Record<string, ModelLoadState>>(() => readLoadStates());

  useEffect(() => {
    const init = async () => {
      try {
        await initDB();
        await clearOldSearches();
      } catch (err) {
        console.error('Failed to initialize cache:', err);
      }
    };
    init();
  }, []);

  const addToCache = useCallback((model: Omit<CachedModel, 'loadedAt' | 'lastUsed' | 'estimatedSizeMB'>) => {
    setCachedModels(prev => {
      const exists = prev.find(m => m.modelId === model.modelId);
      if (exists) {
        const updated = prev.map(m =>
          m.modelId === model.modelId ? { ...m, lastUsed: Date.now() } : m
        );
        return updated;
      }

      const entry: CachedModel = {
        ...model,
        loadedAt: Date.now(),
        lastUsed: Date.now(),
        estimatedSizeMB: Math.round(500 + Math.random() * 4000),
      };

      return [...prev, entry];
    });

    // Save to IndexedDB
    saveModelMetadata({
      modelId: model.modelId,
      name: model.name,
      author: model.author,
      description: '',
      provider: model.provider,
      modality: model.modality,
      card: {
        modelId: model.modelId,
        name: model.name,
        author: model.author,
        description: '',
        tags: [],
        stats: { downloads: 0, likes: 0 },
        requirements: {},
        gated: false,
      },
      fetchedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
    }).catch(console.error);
  }, []);

  const removeFromCache = useCallback((modelId: string) => {
    setCachedModels(prev => prev.filter(m => m.modelId !== modelId));
    setLoadStates(prev => {
      const next = { ...prev };
      delete next[modelId];
      writeLoadStates(next);
      return next;
    });
  }, []);

  const pruneUnused = useCallback((olderThanMs = 7 * 24 * 60 * 60 * 1000) => {
    const cutoff = Date.now() - olderThanMs;
    setCachedModels(prev => prev.filter(m => m.lastUsed > cutoff));
  }, []);

  const clearAll = useCallback(() => {
    setCachedModels([]);
    setLoadStates({});
    writeLoadStates({});
  }, []);

  const setModelLoadState = useCallback((modelId: string, state: Partial<ModelLoadState>) => {
    setLoadStates(prev => {
      const current = prev[modelId] || {
        modelId,
        status: 'idle' as const,
        activatedAt: Date.now(),
      };
      const updated = { ...current, ...state, modelId };
      const next = { ...prev, [modelId]: updated };
      writeLoadStates(next);
      return next;
    });
  }, []);

  const getModelLoadState = useCallback((modelId: string): ModelLoadState | null => {
    return loadStates[modelId] || null;
  }, [loadStates]);

  const totalSizeMB = cachedModels.reduce((sum, m) => sum + m.estimatedSizeMB, 0);

  return {
    cachedModels,
    addToCache,
    removeFromCache,
    pruneUnused,
    clearAll,
    totalSizeMB,
    loadStates,
    setModelLoadState,
    getModelLoadState,
  };
}
